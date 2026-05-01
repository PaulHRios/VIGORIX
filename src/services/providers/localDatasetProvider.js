// src/services/providers/localDatasetProvider.js
//
// Reads the bundled fallback dataset (src/data/exercises.js) and runs it
// through the classifier. Always available — no network needed.
// This is the absolute floor: even if every API is down and there's no
// cache, the user still gets ~12 high-quality exercises.

import { FALLBACK_EXERCISES } from '../../data/exercises.js';
import { classifyExercise, normalizeEquipment } from '../../data/subgroupClassifier.js';

export const LOCAL_SOURCE = 'local';

export async function fetchExercises() {
  return FALLBACK_EXERCISES.map(normalize).filter(Boolean);
}

function normalize(ex) {
  if (!ex) return null;
  const enName = ex.name?.en || ex.name || ex.id;
  const classification = classifyExercise({
    name: { en: enName },
    primaryMuscles: ex.primaryMuscles || [],
    secondaryMuscles: ex.secondaryMuscles || [],
    mechanic: ex.mechanic,
  });

  return {
    ...ex,
    id: ex.id?.startsWith('local_') ? ex.id : `local_${ex.id}`,
    source: [LOCAL_SOURCE],
    equipment: normalizeEquipment(ex.equipment),
    main_muscle: classification.main_muscle,
    sub_muscle: classification.sub_muscle,
    secondary_normalized: classification.secondary_muscles,
    body_part: classification.body_part,
    exercise_type: classification.exercise_type,
    movement_pattern: classification.movement_pattern,
  };
}
