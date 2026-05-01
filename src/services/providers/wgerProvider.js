// src/services/providers/wgerProvider.js
//
// Fetches exercises from wger.de — a free, AGPL-licensed open-source
// fitness database with bilingual (EN+ES) translations and category info.
//
// API: https://wger.de/api/v2/exerciseinfo/
// Docs: https://wger.de/en/software/api
//
// We hit two endpoints:
//   /exerciseinfo/?language=2&limit=200    English
//   /exerciseinfo/?language=4&limit=200    Spanish
// then fuse the translations by exercise base id.

import { classifyExercise, normalizeEquipment } from '../../data/subgroupClassifier.js';

const BASE = 'https://wger.de/api/v2';
const PAGE_SIZE = 100;
const MAX_PAGES = 10; // safety cap → 1000 exercises max
const IMAGE_BASE = 'https://wger.de/media/exercise-images/';

export const WGER_SOURCE = 'wger';

// wger language ids:  2 = English, 4 = Spanish, 1 = German
const LANG_EN = 2;
const LANG_ES = 4;

// wger category id → main muscle (used as fallback if name inference fails)
const CATEGORY_MAIN_MUSCLE = {
  10: 'abs',        // Abs
  8: 'arms',        // Arms (we'll narrow via name)
  12: 'back',       // Back
  14: 'calves',     // Calves
  11: 'chest',      // Chest
  9: 'legs',        // Legs
  13: 'shoulders',  // Shoulders
  15: 'cardio',
  16: 'full_body',  // Misc
};

export async function fetchExercises() {
  const enList = await fetchAllPages(LANG_EN);
  const esList = await fetchAllPages(LANG_ES);

  const esByBase = new Map();
  for (const e of esList) {
    if (e.exercise_base) esByBase.set(e.exercise_base, e);
  }

  const out = [];
  for (const en of enList) {
    const normalized = normalizeExercise(en, esByBase.get(en.exercise_base));
    if (normalized) out.push(normalized);
  }
  return out;
}

async function fetchAllPages(language) {
  const out = [];
  for (let page = 0; page < MAX_PAGES; page++) {
    const offset = page * PAGE_SIZE;
    const url = `${BASE}/exerciseinfo/?language=${language}&limit=${PAGE_SIZE}&offset=${offset}`;
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) {
      if (page === 0) throw new Error(`wger HTTP ${r.status}`);
      break;
    }
    const data = await r.json();
    const results = Array.isArray(data?.results) ? data.results : [];
    out.push(...results);
    if (!data.next || results.length < PAGE_SIZE) break;
  }
  return out;
}

export function normalizeExercise(en, es) {
  if (!en || !en.id) return null;

  // Skip exercises with no description AND no name — they're useless to the user.
  const enName = stripTags(en.name || '').trim();
  if (!enName) return null;

  const esName = es ? stripTags(es.name || '').trim() : enName;

  const enDesc = stripTags(en.description || '');
  const esDesc = es ? stripTags(es.description || '') : enDesc;

  const enInstr = splitInstructions(enDesc);
  const esInstr = es ? splitInstructions(esDesc) : enInstr;

  // Images
  const images = (en.images || [])
    .map((img) => img?.image)
    .filter(Boolean)
    .map((p) => (p.startsWith('http') ? p : `${IMAGE_BASE}${p.replace(/^\/+/, '')}`));

  // Skip if no images — the UI needs at least one.
  if (images.length === 0) return null;

  // Equipment
  const equipmentName = (en.equipment || [])[0]?.name || 'none';
  const equipment = normalizeEquipment(equipmentName);

  // Muscles
  const primaryMuscles = (en.muscles || []).map((m) => m.name_en || m.name).filter(Boolean);
  const secondaryMuscles = (en.muscles_secondary || []).map((m) => m.name_en || m.name).filter(Boolean);

  // Classification
  const classification = classifyExercise({
    name: { en: enName },
    primaryMuscles,
    secondaryMuscles,
  });

  return {
    id: `wger_${en.id}`,
    source: [WGER_SOURCE],
    name: { en: enName, es: esName },
    images,
    gif: images[0],
    primaryMuscles,
    secondaryMuscles,
    equipment,
    rawEquipment: equipmentName,
    level: 'intermediate',
    category: 'strength',
    force: null,
    mechanic: classification.exercise_type === 'compound' ? 'compound' : 'isolation',
    instructions: { en: enInstr, es: esInstr },

    main_muscle: classification.main_muscle,
    sub_muscle: classification.sub_muscle,
    secondary_normalized: classification.secondary_muscles,
    body_part: classification.body_part,
    exercise_type: classification.exercise_type,
    movement_pattern: classification.movement_pattern,

    muscle: [classification.main_muscle, classification.sub_muscle, ...classification.secondary_muscles],
    tags: [],
  };
}

function stripTags(html) {
  if (!html) return '';
  return String(html)
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function splitInstructions(text) {
  if (!text) return [];
  // Split on sentence ends OR list markers
  const parts = String(text)
    .split(/(?:\.\s+|\n+|\d+\.\s+|\u2022\s+)/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 6);
  return parts;
}
