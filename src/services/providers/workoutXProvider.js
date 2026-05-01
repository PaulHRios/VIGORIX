// src/services/providers/workoutXProvider.js
//
// WorkoutX (RapidAPI) — opt-in. Requires VITE_WORKOUTX_KEY.
// Documentation: https://rapidapi.com/dadoutdor/api/workout
//
// Disabled by default. Add the env var to enable.

import { classifyExercise, normalizeEquipment } from '../../data/subgroupClassifier.js';

const HOST = 'workout-planner-api.p.rapidapi.com';
const ENDPOINT = `https://${HOST}/exercises`;
export const WORKOUTX_SOURCE = 'workoutx';

export function isEnabled() {
  return Boolean(import.meta?.env?.VITE_WORKOUTX_KEY);
}

export async function fetchExercises() {
  if (!isEnabled()) return [];
  const key = import.meta.env.VITE_WORKOUTX_KEY;
  const r = await fetch(ENDPOINT, {
    headers: { 'X-RapidAPI-Host': HOST, 'X-RapidAPI-Key': key },
  });
  if (!r.ok) return [];
  const arr = await r.json();
  if (!Array.isArray(arr)) return [];
  return arr.map(normalizeExercise).filter(Boolean);
}

export function normalizeExercise(raw) {
  if (!raw?.name) return null;
  const classification = classifyExercise({
    name: { en: raw.name },
    primaryMuscles: raw.target ? [raw.target] : [],
    secondaryMuscles: raw.secondaryMuscles || [],
  });

  const images = raw.gifUrl ? [raw.gifUrl] : [];
  if (images.length === 0) return null;

  return {
    id: `wox_${raw.id || raw.name.toLowerCase().replace(/\s+/g, '_')}`,
    source: [WORKOUTX_SOURCE],
    name: { en: raw.name, es: raw.name },
    images,
    gif: images[0],
    primaryMuscles: raw.target ? [raw.target] : [],
    secondaryMuscles: raw.secondaryMuscles || [],
    equipment: normalizeEquipment(raw.equipment),
    level: 'intermediate',
    category: 'strength',
    mechanic: classification.exercise_type === 'compound' ? 'compound' : 'isolation',
    instructions: { en: raw.instructions || [], es: raw.instructions || [] },

    main_muscle: classification.main_muscle,
    sub_muscle: classification.sub_muscle,
    secondary_normalized: classification.secondary_muscles,
    body_part: classification.body_part,
    exercise_type: classification.exercise_type,
    movement_pattern: classification.movement_pattern,

    muscle: [classification.main_muscle, classification.sub_muscle],
    tags: [],
  };
}
