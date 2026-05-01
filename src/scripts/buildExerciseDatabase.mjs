#!/usr/bin/env node
/* eslint-disable no-console */
//
// scripts/buildExerciseDatabase.mjs
//
// Pipeline:
//   1) Fetch every free dataset we can reach from a Node environment
//      (free-exercise-db via jsDelivr, wger via wger.de API).
//   2) Run each exercise through the central classifier.
//   3) Deduplicate, prefer GIFs, fuse multilingual data.
//   4) Emit:
//        src/data/exercises/raw/free-exercise-db.raw.json
//        src/data/exercises/raw/wger.raw.json
//        src/data/exercises/processed/exercises.master.json
//        src/data/exercises/processed/exercises.master.txt
//        src/data/exercises/processed/exercises.index.json
//
// Usage:
//   node scripts/buildExerciseDatabase.mjs
//   npm run build:exercises

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// We import the classifier directly from the project source so the
// build pipeline shares logic with the runtime.
const { classifyExercise, normalizeEquipment } = await import(
  pathToFileUrl(path.join(ROOT, 'src/data/subgroupClassifier.js'))
);

function pathToFileUrl(p) {
  // ESM dynamic imports want a file:// URL on some platforms.
  return new URL('file://' + p);
}

const RAW_DIR = path.join(ROOT, 'src/data/exercises/raw');
const PROC_DIR = path.join(ROOT, 'src/data/exercises/processed');
fs.mkdirSync(RAW_DIR, { recursive: true });
fs.mkdirSync(PROC_DIR, { recursive: true });

console.log('🏋️  VIGORIX exercise database builder');
console.log('   root =', ROOT);

// ---------- 1) FETCH ----------
const all = [];

console.log('\n[1/3] Fetching sources…');

try {
  const fdbRaw = await fetchJson(
    'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json',
  );
  fs.writeFileSync(
    path.join(RAW_DIR, 'free-exercise-db.raw.json'),
    JSON.stringify(fdbRaw, null, 2),
  );
  const fdbNorm = fdbRaw.map(normalizeFreeExerciseDb).filter(Boolean);
  console.log(`   ✓ free-exercise-db: ${fdbNorm.length} exercises`);
  all.push(...fdbNorm);
} catch (e) {
  console.warn('   ✗ free-exercise-db failed:', e.message);
}

try {
  const wgerRaw = await fetchWger();
  fs.writeFileSync(
    path.join(RAW_DIR, 'wger.raw.json'),
    JSON.stringify(wgerRaw, null, 2),
  );
  const wgerNorm = wgerRaw.map(normalizeWger).filter(Boolean);
  console.log(`   ✓ wger: ${wgerNorm.length} exercises`);
  all.push(...wgerNorm);
} catch (e) {
  console.warn('   ✗ wger failed:', e.message);
}

if (all.length === 0) {
  console.error('\n💥 No sources succeeded. Aborting.');
  process.exit(1);
}

// ---------- 2) DEDUPE & MERGE ----------
console.log('\n[2/3] Deduplicating and merging…');
const merged = dedupe(all);
console.log(`   ${all.length} → ${merged.length} after dedup`);

// ---------- 3) WRITE ----------
console.log('\n[3/3] Writing outputs…');
fs.writeFileSync(
  path.join(PROC_DIR, 'exercises.master.json'),
  JSON.stringify(merged, null, 2),
);

fs.writeFileSync(
  path.join(PROC_DIR, 'exercises.master.txt'),
  toTxt(merged),
);

fs.writeFileSync(
  path.join(PROC_DIR, 'exercises.index.json'),
  JSON.stringify(buildIndex(merged), null, 2),
);

const withGif = merged.filter((e) => e.images?.length).length;
console.log(`   ✓ master.json — ${merged.length} exercises`);
console.log(`   ✓ master.txt`);
console.log(`   ✓ index.json`);
console.log(`\n✅ Done. ${withGif}/${merged.length} have media.\n`);

// ============================================================
// FETCHERS / NORMALIZERS
// ============================================================

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, opts);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  return res.json();
}

const FDB_IMAGE_BASE = 'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

function normalizeFreeExerciseDb(raw) {
  if (!raw?.id) return null;
  const enName = raw.name || String(raw.id).replace(/_/g, ' ');
  const images = (raw.images || []).map((p) => `${FDB_IMAGE_BASE}${p}`);
  if (images.length === 0) return null;

  const c = classifyExercise({
    name: { en: enName },
    primaryMuscles: raw.primaryMuscles,
    secondaryMuscles: raw.secondaryMuscles,
    mechanic: raw.mechanic,
  });

  return {
    id: `fdb_${raw.id}`,
    name: { en: enName, es: enName },
    images,
    gif: images[0],
    primaryMuscles: raw.primaryMuscles || [],
    secondaryMuscles: raw.secondaryMuscles || [],
    equipment: normalizeEquipment(raw.equipment || 'none'),
    level: mapLevel(raw.level),
    category: raw.category || 'strength',
    mechanic: raw.mechanic || (c.exercise_type === 'compound' ? 'compound' : 'isolation'),
    instructions: { en: raw.instructions || [], es: raw.instructions || [] },
    main_muscle: c.main_muscle,
    sub_muscle: c.sub_muscle,
    secondary_normalized: c.secondary_muscles,
    body_part: c.body_part,
    exercise_type: c.exercise_type,
    movement_pattern: c.movement_pattern,
    source: ['free-exercise-db'],
    tags: [],
  };
}

const WGER_API = 'https://wger.de/api/v2/exerciseinfo/';
const WGER_PAGE = 100;
const WGER_MAX_PAGES = 10;
const WGER_IMAGE_BASE = 'https://wger.de/media/exercise-images/';

async function fetchWger() {
  // Pull both EN and ES
  async function pullLang(language) {
    const out = [];
    for (let p = 0; p < WGER_MAX_PAGES; p++) {
      const url = `${WGER_API}?language=${language}&limit=${WGER_PAGE}&offset=${p * WGER_PAGE}`;
      try {
        const data = await fetchJson(url);
        const results = data?.results || [];
        out.push(...results);
        if (!data.next || results.length < WGER_PAGE) break;
      } catch (e) {
        console.warn(`   wger page ${p} (lang ${language}) failed:`, e.message);
        break;
      }
    }
    return out;
  }

  const en = await pullLang(2);
  const es = await pullLang(4);

  const esByBase = new Map();
  for (const e of es) if (e.exercise_base) esByBase.set(e.exercise_base, e);

  return en.map((row) => ({ en: row, es: esByBase.get(row.exercise_base) || null }));
}

function normalizeWger({ en, es }) {
  if (!en?.id) return null;
  const enName = stripTags(en.name || '').trim();
  if (!enName) return null;

  const images = (en.images || [])
    .map((img) => img?.image)
    .filter(Boolean)
    .map((p) => (p.startsWith('http') ? p : `${WGER_IMAGE_BASE}${p.replace(/^\/+/, '')}`));
  if (images.length === 0) return null;

  const esName = es ? stripTags(es.name || '').trim() : enName;
  const enInstr = splitInstructions(stripTags(en.description || ''));
  const esInstr = es ? splitInstructions(stripTags(es.description || '')) : enInstr;

  const equipmentName = (en.equipment || [])[0]?.name || 'none';
  const primaryMuscles = (en.muscles || []).map((m) => m.name_en || m.name).filter(Boolean);
  const secondaryMuscles = (en.muscles_secondary || []).map((m) => m.name_en || m.name).filter(Boolean);

  const c = classifyExercise({
    name: { en: enName },
    primaryMuscles,
    secondaryMuscles,
  });

  return {
    id: `wger_${en.id}`,
    name: { en: enName, es: esName },
    images,
    gif: images[0],
    primaryMuscles,
    secondaryMuscles,
    equipment: normalizeEquipment(equipmentName),
    level: 'intermediate',
    category: 'strength',
    mechanic: c.exercise_type === 'compound' ? 'compound' : 'isolation',
    instructions: { en: enInstr, es: esInstr },
    main_muscle: c.main_muscle,
    sub_muscle: c.sub_muscle,
    secondary_normalized: c.secondary_muscles,
    body_part: c.body_part,
    exercise_type: c.exercise_type,
    movement_pattern: c.movement_pattern,
    source: ['wger'],
    tags: [],
  };
}

function stripTags(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitInstructions(text) {
  if (!text) return [];
  return String(text)
    .split(/(?:\.\s+|\n+|\d+\.\s+|\u2022\s+)/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 6);
}

function mapLevel(raw) {
  if (!raw) return 'beginner';
  const k = String(raw).toLowerCase();
  if (k === 'expert') return 'advanced';
  if (['beginner', 'intermediate', 'advanced'].includes(k)) return k;
  return 'beginner';
}

// ============================================================
// DEDUPE
// ============================================================

function dedupe(list) {
  const byKey = new Map();
  for (const ex of list) {
    const key = dedupeKey(ex);
    const cur = byKey.get(key);
    if (!cur) { byKey.set(key, ex); continue; }
    byKey.set(key, scoreEx(ex) >= scoreEx(cur) ? mergeBetter(ex, cur) : mergeBetter(cur, ex));
  }
  return Array.from(byKey.values());
}

function dedupeKey(ex) {
  const name = (ex?.name?.en || '').toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return `${name}__${ex.main_muscle}__${ex.equipment}`;
}

function scoreEx(ex) {
  let s = 0;
  if (ex.gif && /\.gif/i.test(ex.gif)) s += 8;
  s += Math.min(5, ex.images?.length || 0);
  s += Math.min(6, ex.instructions?.en?.length || 0);
  if (ex.exercise_type === 'compound') s += 1;
  return s;
}

function mergeBetter(winner, loser) {
  return {
    ...winner,
    source: Array.from(new Set([...(winner.source || []), ...(loser.source || [])])),
    name: {
      en: winner.name?.en || loser.name?.en,
      es: winner.name?.es && winner.name.es !== winner.name.en
        ? winner.name.es
        : loser.name?.es || winner.name?.es,
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
// OUTPUT FORMATS
// ============================================================

function toTxt(list) {
  const lines = [];
  lines.push('VIGORIX EXERCISE DATABASE');
  lines.push(`Built: ${new Date().toISOString()}`);
  lines.push(`Total: ${list.length}`);
  lines.push('='.repeat(80));
  lines.push('');
  for (const ex of list) {
    lines.push(`ID:           ${ex.id}`);
    lines.push(`Name:         ${ex.name?.en || ''}`);
    if (ex.name?.es && ex.name.es !== ex.name.en) lines.push(`Name (es):    ${ex.name.es}`);
    lines.push(`Main:         ${ex.main_muscle}`);
    lines.push(`Sub:          ${ex.sub_muscle}`);
    if (ex.secondary_normalized?.length) lines.push(`Secondary:    ${ex.secondary_normalized.join(', ')}`);
    lines.push(`Equipment:    ${ex.equipment}`);
    lines.push(`Difficulty:   ${ex.level}`);
    lines.push(`Type:         ${ex.exercise_type}`);
    lines.push(`Pattern:      ${ex.movement_pattern || '-'}`);
    lines.push(`Body part:    ${ex.body_part}`);
    lines.push(`Image:        ${ex.gif || '-'}`);
    lines.push(`Sources:      ${(ex.source || []).join(', ')}`);
    if (ex.instructions?.en?.length) {
      lines.push('Instructions:');
      ex.instructions.en.forEach((s, i) => lines.push(`  ${i + 1}. ${s}`));
    }
    lines.push('-'.repeat(80));
  }
  return lines.join('\n');
}

function buildIndex(list) {
  const byMain = {};
  const bySub = {};
  const byEquip = {};
  for (const ex of list) {
    (byMain[ex.main_muscle] ||= []).push(ex.id);
    (bySub[ex.sub_muscle] ||= []).push(ex.id);
    (byEquip[ex.equipment] ||= []).push(ex.id);
  }
  return {
    total: list.length,
    builtAt: new Date().toISOString(),
    byMain,
    bySub,
    byEquipment: byEquip,
  };
}
