// Exercise data source.
//
// Primary source: yuhonas/free-exercise-db (Public Domain / Unlicense).
// 800+ exercises with curated, hosted images. We fetch the JSON from jsDelivr
// at app load (CORS-friendly, edge-cached, fast) and normalize each entry
// into our internal schema. Images come from the same repo via raw GitHub.
//
// Fallback: a small bundled set in data/exercises.js. Used if the network
// is offline or the upstream is unreachable.
//
// IMPORTANT: this implementation NEVER returns an exercise without at least
// one image. Exercises without imagery are filtered out before the
// generator ever sees them.

import { FALLBACK_EXERCISES } from '../data/exercises.js';
import { translateExerciseName, translateInstructions } from '../data/exerciseTranslations.js';

const REMOTE_JSON =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json';
const IMAGE_BASE =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

const CACHE_KEY = 'gymai.exerciseCache.v2';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

// Map free-exercise-db equipment strings to our internal taxonomy.
const EQUIPMENT_MAP = {
  'body only': 'none',
  none: 'none',
  dumbbell: 'dumbbells',
  barbell: 'barbell',
  'e-z curl bar': 'barbell',
  cable: 'machines',
  machine: 'machines',
  kettlebells: 'kettlebell',
  bands: 'bands',
  'medicine ball': 'medicine_ball',
  'exercise ball': 'exercise_ball',
  'foam roll': 'foam_roll',
  other: 'other',
};

// Map free-exercise-db primaryMuscles → tags we use in the generator.
// We attach multiple tags so requests like "upper" or "push" still match.
function muscleToTags(primary, secondary = []) {
  const tags = new Set();
  const add = (m) => tags.add(m);

  const all = [...primary, ...secondary];
  for (const m of all) {
    add(m); // raw tag (e.g. 'biceps', 'chest', 'traps')
    if (['chest', 'triceps', 'shoulders'].includes(m)) {
      add('upper');
      add('push');
    }
    if (['biceps', 'lats', 'middle back', 'lower back', 'forearms', 'traps'].includes(m)) {
      add('upper');
      add('pull');
      add('back'); // alias for "espalda"
    }
    if (['quadriceps', 'hamstrings', 'calves', 'adductors', 'abductors'].includes(m)) {
      add('lower');
      add('legs');
    }
    if (m === 'glutes') {
      add('lower');
      add('glutes');
    }
    if (m === 'abdominals') {
      add('core');
    }
    if (m === 'neck') {
      add('upper');
    }
  }
  return Array.from(tags);
}

// Tags that interact with the safety system. Some exercise names imply
// risky positions for certain conditions; we add them heuristically.
function safetyTags(ex) {
  const tags = [];
  const n = (ex.name || '').toLowerCase();
  if (/squat|lunge|jump|burpee|deadlift|pistol/.test(n)) tags.push('high_impact_lower');
  if (/jump|burpee|sprint|hop|plyometric|box/.test(n)) tags.push('plyometric', 'high_impact');
  if (/push.?up|plank|prone/.test(n)) tags.push('prone');
  if (/sit.?up|crunch|leg raise|v-up/.test(n)) tags.push('supine_flexion');
  if (/overhead|press|jerk|snatch|clean/.test(n)) tags.push('overhead');
  if (/twist|russian|woodchop|rotation/.test(n)) tags.push('rotation');
  return tags;
}

function normalize(raw) {
  if (!raw || !raw.id || !Array.isArray(raw.images) || raw.images.length === 0) return null;

  const images = raw.images.map((p) => `${IMAGE_BASE}${p}`);

  const equipment =
    EQUIPMENT_MAP[(raw.equipment || 'none').toLowerCase()] ||
    (raw.equipment ? 'other' : 'none');

  const enName = raw.name || raw.id.replace(/_/g, ' ');
  const esName = translateExerciseName(raw.id, enName);
  const enInstr = Array.isArray(raw.instructions) ? raw.instructions : [];
  const esInstr = translateInstructions(raw.id, enInstr);

  return {
    id: raw.id,
    name: { en: enName, es: esName },
    images, // [start, end] poses — UI alternates between them
    gif: images[0], // legacy field kept for backward compat
    youtubeQuery: enName, // used to build a "Watch on YouTube" link
    muscle: muscleToTags(raw.primaryMuscles || [], raw.secondaryMuscles || []),
    primaryMuscles: raw.primaryMuscles || [],
    equipment,
    rawEquipment: raw.equipment || null,
    level: raw.level || 'beginner',
    category: raw.category || 'strength',
    force: raw.force || null,
    mechanic: raw.mechanic || null,
    tags: safetyTags(raw),
    instructions: { en: enInstr, es: esInstr },
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (!obj || !obj.savedAt || !Array.isArray(obj.data)) return null;
    if (Date.now() - obj.savedAt > CACHE_TTL_MS) return null;
    return obj.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), data }),
    );
  } catch {
    /* quota exceeded — ignore */
  }
}

async function fetchRemote() {
  const r = await fetch(REMOTE_JSON, { cache: 'force-cache' });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  const arr = await r.json();
  if (!Array.isArray(arr)) throw new Error('Bad payload');
  return arr.map(normalize).filter(Boolean);
}

let inMemoryCache = null;

export async function getExercises() {
  if (inMemoryCache) return inMemoryCache;

  // 1. Try the localStorage cache first — instant, offline-friendly.
  const cached = readCache();
  if (cached && cached.length > 0) {
    inMemoryCache = cached;
    // Background refresh so next load is up-to-date.
    fetchRemote()
      .then((fresh) => {
        if (fresh && fresh.length > 0) {
          writeCache(fresh);
          inMemoryCache = fresh;
        }
      })
      .catch(() => {});
    return inMemoryCache;
  }

  // 2. Try the network.
  try {
    const fresh = await fetchRemote();
    if (fresh && fresh.length > 0) {
      writeCache(fresh);
      inMemoryCache = fresh;
      return inMemoryCache;
    }
  } catch (e) {
    console.warn('[GymAI] Could not load exercise database, using fallback.', e);
  }

  // 3. Last-resort hardcoded fallback so the app *always* shows something.
  inMemoryCache = FALLBACK_EXERCISES;
  return inMemoryCache;
}

// Forces a refetch — exposed for a "refresh exercises" button.
export async function reloadExercises() {
  inMemoryCache = null;
  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    /* ignore */
  }
  return getExercises();
}
