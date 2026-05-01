// src/services/providers/exerciseDbProvider.js
//
// ExerciseDB on RapidAPI — 1300+ exercises with GIFs.
// Requires a free RapidAPI account + key.
//   https://rapidapi.com/justin-WFnsXH_t6/api/exercisedb
//
// To enable: set VITE_RAPIDAPI_KEY in your environment.
// Without a key this provider is silently skipped — the app keeps working.

import { classifyExercise, normalizeEquipment } from '../../data/subgroupClassifier.js';

const HOST = 'exercisedb.p.rapidapi.com';
const ENDPOINT = `https://${HOST}/exercises?limit=1500`;
export const EXERCISEDB_SOURCE = 'exercisedb';

export function isEnabled() {
  return Boolean(import.meta?.env?.VITE_RAPIDAPI_KEY);
}

export async function fetchExercises() {
  if (!isEnabled()) return [];
  const key = import.meta.env.VITE_RAPIDAPI_KEY;
  const r = await fetch(ENDPOINT, {
    headers: {
      'X-RapidAPI-Host': HOST,
      'X-RapidAPI-Key': key,
    },
  });
  if (!r.ok) throw new Error(`exercisedb HTTP ${r.status}`);
  const arr = await r.json();
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeExercise).filter(Boolean);
}

export function normalizeExercise(raw) {
  if (!raw || !raw.id) return null;

  const enName = raw.name || raw.id;
  if (!enName) return null;

  const images = raw.gifUrl ? [raw.gifUrl] : [];
  if (images.length === 0) return null;

  const equipment = normalizeEquipment(raw.equipment || 'none');

  const primaryMuscles = raw.target ? [raw.target] : [];
  const secondaryMuscles = Array.isArray(raw.secondaryMuscles) ? raw.secondaryMuscles : [];

  const classification = classifyExercise({
    name: { en: enName },
    primaryMuscles,
    secondaryMuscles,
  });

  const enInstr = Array.isArray(raw.instructions) ? raw.instructions : [];

  return {
    id: `edb_${raw.id}`,
    source: [EXERCISEDB_SOURCE],
    name: { en: enName, es: enName },
    images,
    gif: images[0],
    primaryMuscles,
    secondaryMuscles,
    equipment,
    rawEquipment: raw.equipment || null,
    level: 'intermediate',
    category: 'strength',
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
