// src/services/providers/freeExerciseDbProvider.js
//
// Fetches the yuhonas/free-exercise-db dataset from jsDelivr.
// ~870 exercises, public domain (CC0), comes with primary/secondary
// muscles, equipment, level, category, mechanic, and 2 image frames each.
//
// Source: https://github.com/yuhonas/free-exercise-db

import { classifyExercise, normalizeEquipment } from '../../data/subgroupClassifier.js';
import { translateExerciseName, translateInstructions } from '../../data/exerciseTranslations.js';

const REMOTE_JSON =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json';

const IMAGE_BASE =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

export const FREE_EXERCISE_DB_SOURCE = 'free-exercise-db';

export async function fetchExercises() {
  const r = await fetch(REMOTE_JSON, { cache: 'no-cache' });
  if (!r.ok) throw new Error(`free-exercise-db HTTP ${r.status}`);
  const arr = await r.json();
  if (!Array.isArray(arr)) throw new Error('free-exercise-db: malformed payload');
  return arr.map(normalizeExercise).filter(Boolean);
}

export function normalizeExercise(raw) {
  if (!raw || !raw.id) return null;

  const images = Array.isArray(raw.images) && raw.images.length > 0
    ? raw.images.map((p) => `${IMAGE_BASE}${p}`)
    : [];

  if (images.length === 0) return null; // we always want at least 1 image

  const enName = raw.name || String(raw.id).replace(/_/g, ' ');
  const esName = translateExerciseName(raw.id, enName);
  const enInstr = Array.isArray(raw.instructions) ? raw.instructions : [];
  const esInstr = translateInstructions(raw.id, enInstr);

  const equipment = normalizeEquipment(raw.equipment || 'none');

  // Run the classifier on the merged source data.
  const classification = classifyExercise({
    name: { en: enName },
    primaryMuscles: raw.primaryMuscles || [],
    secondaryMuscles: raw.secondaryMuscles || [],
    mechanic: raw.mechanic,
  });

  const level = mapLevel(raw.level);

  return {
    id: `fdb_${raw.id}`,
    source: [FREE_EXERCISE_DB_SOURCE],
    name: { en: enName, es: esName },
    images,
    gif: images[0],
    primaryMuscles: raw.primaryMuscles || [],
    secondaryMuscles: raw.secondaryMuscles || [],
    equipment,
    rawEquipment: raw.equipment || null,
    level,
    category: raw.category || 'strength',
    force: raw.force || null,
    mechanic: raw.mechanic || (classification.exercise_type === 'compound' ? 'compound' : 'isolation'),
    instructions: { en: enInstr, es: esInstr },

    // Classification (this is what the rest of the app reads)
    main_muscle: classification.main_muscle,
    sub_muscle: classification.sub_muscle,
    secondary_normalized: classification.secondary_muscles,
    body_part: classification.body_part,
    exercise_type: classification.exercise_type,
    movement_pattern: classification.movement_pattern,

    // Backwards-compat for the existing generator (tag list)
    muscle: buildLegacyTags(classification, raw.primaryMuscles || [], raw.secondaryMuscles || []),
    tags: deriveSafetyTags(enName),
  };
}

function mapLevel(raw) {
  if (!raw) return 'beginner';
  const k = String(raw).toLowerCase();
  if (k === 'expert') return 'advanced';
  if (k === 'intermediate' || k === 'beginner' || k === 'advanced') return k;
  return 'beginner';
}

// Build the legacy tag list the existing generator uses.
function buildLegacyTags(classification, primary, secondary) {
  const tags = new Set([classification.main_muscle, classification.sub_muscle]);
  for (const m of [...primary, ...secondary]) {
    if (!m) continue;
    const k = String(m).toLowerCase();
    tags.add(k);
    if (['chest', 'triceps', 'shoulders'].includes(k)) {
      tags.add('upper'); tags.add('push');
    }
    if (['biceps', 'lats', 'middle back', 'lower back', 'forearms', 'traps'].includes(k)) {
      tags.add('upper'); tags.add('pull'); tags.add('back');
    }
    if (['quadriceps', 'hamstrings', 'calves', 'adductors', 'abductors'].includes(k)) {
      tags.add('lower'); tags.add('legs');
    }
    if (k === 'glutes') { tags.add('lower'); tags.add('glutes'); }
    if (k === 'abdominals') { tags.add('core'); }
  }
  return Array.from(tags);
}

function deriveSafetyTags(name) {
  const tags = [];
  const n = String(name).toLowerCase();
  if (/squat|lunge|jump|burpee|deadlift|pistol/.test(n)) tags.push('high_impact_lower');
  if (/jump|burpee|sprint|hop|plyometric|box/.test(n)) tags.push('plyometric', 'high_impact');
  if (/push.?up|plank|prone/.test(n)) tags.push('prone');
  if (/sit.?up|crunch|leg raise|v-up/.test(n)) tags.push('supine_flexion');
  if (/overhead|press|jerk|snatch|clean/.test(n)) tags.push('overhead');
  if (/twist|russian|woodchop|rotation/.test(n)) tags.push('rotation');
  return tags;
}
