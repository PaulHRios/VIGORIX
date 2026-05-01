// src/services/providers/apiNinjasProvider.js
//
// API Ninjas /v1/exercises — small but useful free dataset (free tier
// gives 50,000 calls/month). Requires a free API key.
//   https://api-ninjas.com/api/exercises
//
// To enable: set VITE_API_NINJAS_KEY.
// Without a key this provider returns an empty array.

import { classifyExercise, normalizeEquipment } from '../../data/subgroupClassifier.js';

const ENDPOINT = 'https://api.api-ninjas.com/v1/exercises';
export const API_NINJAS_SOURCE = 'api-ninjas';

export function isEnabled() {
  return Boolean(import.meta?.env?.VITE_API_NINJAS_KEY);
}

export async function fetchExercises() {
  if (!isEnabled()) return [];
  const key = import.meta.env.VITE_API_NINJAS_KEY;

  // API ninjas returns max 10 per call. We sweep main muscles to broaden coverage.
  const muscles = [
    'chest', 'lats', 'middle_back', 'lower_back', 'traps',
    'biceps', 'triceps', 'forearms', 'neck',
    'quadriceps', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors',
    'abdominals', 'shoulders',
  ];

  const all = [];
  for (const m of muscles) {
    const url = `${ENDPOINT}?muscle=${m}`;
    try {
      const r = await fetch(url, { headers: { 'X-Api-Key': key } });
      if (!r.ok) continue;
      const arr = await r.json();
      if (Array.isArray(arr)) all.push(...arr.map((e) => ({ ...e, _muscle: m })));
    } catch {
      // skip muscle on transient error
    }
  }
  return all.map(normalizeExercise).filter(Boolean);
}

export function normalizeExercise(raw) {
  if (!raw || !raw.name) return null;

  const enName = raw.name;
  const equipment = normalizeEquipment(raw.equipment || 'none');

  const primaryMuscles = raw.muscle ? [raw.muscle] : raw._muscle ? [raw._muscle] : [];
  const classification = classifyExercise({
    name: { en: enName },
    primaryMuscles,
  });

  const enInstr = raw.instructions ? splitInstructions(raw.instructions) : [];

  return {
    id: `apn_${slugify(enName)}`,
    source: [API_NINJAS_SOURCE],
    name: { en: enName, es: enName },
    images: [], // API Ninjas has no images
    gif: null,
    primaryMuscles,
    secondaryMuscles: [],
    equipment,
    rawEquipment: raw.equipment || null,
    level: mapLevel(raw.difficulty),
    category: raw.type || 'strength',
    mechanic: classification.exercise_type === 'compound' ? 'compound' : 'isolation',
    instructions: { en: enInstr, es: enInstr },

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

function mapLevel(d) {
  if (!d) return 'intermediate';
  const k = String(d).toLowerCase();
  if (k.includes('beginner')) return 'beginner';
  if (k.includes('expert') || k.includes('advanced')) return 'advanced';
  return 'intermediate';
}

function splitInstructions(text) {
  return String(text)
    .split(/(?:\.\s+|\n+|\d+\.\s+)/g)
    .map((s) => s.trim())
    .filter((s) => s.length > 6);
}

function slugify(s) {
  return String(s).toLowerCase().replace(/[^\w]+/g, '_').slice(0, 80);
}
