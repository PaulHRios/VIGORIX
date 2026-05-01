// src/services/exerciseAggregator.js
//
// The aggregator is the brain that combines ALL providers into a single
// deduplicated, fully-classified list of exercises.
//
// Pipeline:
//   1) Run every available provider in parallel (with timeout + error isolation)
//   2) Merge their normalized results
//   3) Deduplicate by (name + main_muscle + equipment) — keeping the
//      best version (GIF > images > no media; better instructions wins)
//   4) Final classifier pass to ensure consistency
//   5) Cache the merged result to localStorage (7 days)
//
// Public API:
//   aggregateExercises({ force })  — returns merged list, uses cache when possible
//   reload()                       — bypasses cache and re-fetches everything

import * as freeExerciseDb from './providers/freeExerciseDbProvider.js';
import * as wger from './providers/wgerProvider.js';
import * as exerciseDb from './providers/exerciseDbProvider.js';
import * as workoutX from './providers/workoutXProvider.js';
import * as apiNinjas from './providers/apiNinjasProvider.js';
import * as local from './providers/localDatasetProvider.js';

import { classifyExercise } from '../data/subgroupClassifier.js';

const CACHE_KEY = 'vigorix.masterDb.v1';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const PROVIDER_TIMEOUT_MS = 12_000;

// Order matters: earlier providers are preferred when deduping ties.
// We rank free-exercise-db highest because it ships with images, instructions,
// and curated muscle data.
const PROVIDERS = [
  { name: 'free-exercise-db', mod: freeExerciseDb, alwaysOn: true },
  { name: 'wger',             mod: wger,           alwaysOn: true },
  { name: 'exercisedb',       mod: exerciseDb,     alwaysOn: false },
  { name: 'workoutx',         mod: workoutX,       alwaysOn: false },
  { name: 'api-ninjas',       mod: apiNinjas,      alwaysOn: false },
  { name: 'local',            mod: local,          alwaysOn: true },
];

let inMemoryCache = null;
let inflight = null;

// ============================================================
// PUBLIC API
// ============================================================

export async function aggregateExercises({ force = false } = {}) {
  if (!force && inMemoryCache) return inMemoryCache;

  if (!force) {
    const cached = readCache();
    if (cached) {
      inMemoryCache = cached;
      // Refresh in background, don't block the user.
      refreshInBackground();
      return inMemoryCache;
    }
  }

  // Coalesce concurrent calls.
  if (inflight) return inflight;
  inflight = doAggregate();

  try {
    const result = await inflight;
    return result;
  } finally {
    inflight = null;
  }
}

export async function reload() {
  return aggregateExercises({ force: true });
}

export function clearCache() {
  inMemoryCache = null;
  try { localStorage.removeItem(CACHE_KEY); } catch { /* */ }
}

// ============================================================
// INTERNAL
// ============================================================

async function doAggregate() {
  const results = await Promise.all(
    PROVIDERS.map(async ({ name, mod, alwaysOn }) => {
      try {
        // Skip optional providers that aren't enabled (no API key).
        if (!alwaysOn && typeof mod.isEnabled === 'function' && !mod.isEnabled()) {
          return { name, exercises: [], skipped: true };
        }
        const exercises = await withTimeout(mod.fetchExercises(), PROVIDER_TIMEOUT_MS);
        return { name, exercises: Array.isArray(exercises) ? exercises : [] };
      } catch (e) {
        console.warn(`[aggregator] ${name} failed:`, e?.message || e);
        return { name, exercises: [], error: e?.message || String(e) };
      }
    }),
  );

  // Always include local as a safety floor in case everything else returned 0.
  const allExercises = results.flatMap((r) => r.exercises);

  // Re-classify to keep things consistent (some sources may have been
  // normalized with older classifier versions).
  const reclassified = allExercises.map(reclassify);

  // Deduplicate
  const merged = dedupe(reclassified);

  // Prune things that are clearly broken
  const cleaned = merged.filter((ex) => Array.isArray(ex.images) && ex.images.length > 0);

  // Sort: compounds first (they're usually the gym anchors), then by name
  cleaned.sort((a, b) => {
    if (a.exercise_type === b.exercise_type) {
      return (a.name?.en || '').localeCompare(b.name?.en || '');
    }
    return a.exercise_type === 'compound' ? -1 : 1;
  });

  inMemoryCache = cleaned;
  writeCache(cleaned, results);
  return cleaned;
}

function reclassify(ex) {
  // Re-run the classifier with the canonical name; this ensures every
  // exercise has up-to-date main_muscle / sub_muscle even if older cache
  // data is loaded.
  const c = classifyExercise({
    name: ex.name,
    primaryMuscles: ex.primaryMuscles,
    secondaryMuscles: ex.secondaryMuscles,
    mechanic: ex.mechanic,
  });
  return {
    ...ex,
    main_muscle: c.main_muscle,
    sub_muscle: c.sub_muscle,
    secondary_normalized: c.secondary_muscles,
    body_part: c.body_part,
    exercise_type: c.exercise_type,
    movement_pattern: c.movement_pattern,
  };
}

// ============================================================
// DEDUPLICATION
// ============================================================

function dedupe(list) {
  const byKey = new Map();

  for (const ex of list) {
    const key = dedupeKey(ex);
    const existing = byKey.get(key);
    if (!existing) {
      byKey.set(key, ex);
      continue;
    }
    byKey.set(key, mergeBetter(existing, ex));
  }
  return Array.from(byKey.values());
}

function dedupeKey(ex) {
  const name = (ex?.name?.en || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  const muscle = ex.main_muscle || 'unknown';
  const equip = ex.equipment || 'none';
  return `${name}__${muscle}__${equip}`;
}

function score(ex) {
  // Higher is better
  let s = 0;
  if (ex.gif && ex.gif.match(/\.gif/i)) s += 8;
  s += Math.min(5, (ex.images?.length || 0));
  s += Math.min(6, (ex.instructions?.en?.length || 0));
  if (ex.instructions?.es?.length > 0 && ex.instructions.es[0] !== ex.instructions.en?.[0]) s += 2;
  if (ex.exercise_type === 'compound') s += 1;
  return s;
}

function mergeBetter(a, b) {
  // Pick whichever is stronger; merge sources for credit.
  const winner = score(a) >= score(b) ? a : b;
  const loser = winner === a ? b : a;
  return {
    ...winner,
    source: Array.from(new Set([...(winner.source || []), ...(loser.source || [])])),
    // If winner has no Spanish translation but loser does, keep loser's.
    name: {
      en: winner.name?.en || loser.name?.en,
      es: winner.name?.es && winner.name.es !== winner.name.en ? winner.name.es : loser.name?.es || winner.name?.es,
    },
    instructions: {
      en: (winner.instructions?.en?.length || 0) >= (loser.instructions?.en?.length || 0)
        ? winner.instructions?.en : loser.instructions?.en,
      es: (winner.instructions?.es?.length || 0) >= (loser.instructions?.es?.length || 0)
        ? winner.instructions?.es : loser.instructions?.es,
    },
  };
}

// ============================================================
// CACHE
// ============================================================

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj?.savedAt || !Array.isArray(obj.data)) return null;
    if (Date.now() - obj.savedAt > CACHE_TTL_MS) return null;
    return obj.data;
  } catch {
    return null;
  }
}

function writeCache(data, providerResults) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        savedAt: Date.now(),
        version: 2,
        data,
        sources: providerResults?.map((r) => ({
          name: r.name,
          count: r.exercises?.length || 0,
          skipped: !!r.skipped,
          error: r.error || null,
        })),
      }),
    );
  } catch {
    // localStorage quota exceeded etc.
  }
}

function refreshInBackground() {
  if (typeof window === 'undefined') return;
  setTimeout(() => {
    doAggregate().catch(() => {});
  }, 250);
}

// ============================================================
// UTIL
// ============================================================

function withTimeout(promise, ms) {
  return new Promise((resolve, reject) => {
    const id = setTimeout(() => reject(new Error(`timeout after ${ms}ms`)), ms);
    Promise.resolve(promise).then(
      (v) => { clearTimeout(id); resolve(v); },
      (e) => { clearTimeout(id); reject(e); },
    );
  });
}

/**
 * Diagnostic info about the last aggregation — used by Account/Debug pages.
 */
export function getCacheInfo() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    return {
      savedAt: obj?.savedAt ? new Date(obj.savedAt) : null,
      total: obj?.data?.length || 0,
      sources: obj?.sources || [],
    };
  } catch {
    return null;
  }
}
