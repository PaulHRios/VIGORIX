// Rule-based workout generator. NO AI yet — this is intentional and explicit.
// Inputs: a structured request + a list of exercises + the user's detected conditions.
// Output: a routine object the UI renders directly.

import { getAvoidTags, getIntensityModifier, CONDITIONS } from '../data/conditions.js';

/**
 * Pick the number of exercises a session should contain based on time available.
 * Accounts for warm-up + rest periods at ~3.5 minutes per exercise on average.
 */
function exerciseCountForTime(minutes) {
  if (!minutes || minutes < 10) return 3;
  if (minutes <= 20) return 4;
  if (minutes <= 35) return 5;
  if (minutes <= 50) return 6;
  return 7;
}

/**
 * Sets / reps / rest schemes by goal.
 */
const SCHEMES = {
  strength: { sets: 4, reps: '4-6', rest: 120 },
  hypertrophy: { sets: 4, reps: '8-12', rest: 75 },
  endurance: { sets: 3, reps: '15-20', rest: 45 },
  fatloss: { sets: 3, reps: '12-15', rest: 30 },
  mobility: { sets: 2, reps: '10-12', rest: 30 },
  general: { sets: 3, reps: '10-12', rest: 60 },
};

/**
 * Apply an intensity modifier to a rep range string. "8-12" * 0.7 → "6-8".
 */
function adjustReps(repsStr, modifier) {
  if (modifier >= 1) return repsStr;
  const m = repsStr.match(/^(\d+)-(\d+)$/);
  if (!m) return repsStr;
  const lo = Math.max(4, Math.round(parseInt(m[1], 10) * modifier));
  const hi = Math.max(lo + 2, Math.round(parseInt(m[2], 10) * modifier));
  return `${lo}-${hi}`;
}

/**
 * Score how well an exercise matches the request. Higher = better.
 * Returns null if the exercise should be excluded entirely.
 */
function scoreExercise(ex, req, avoidTags) {
  // SAFETY FIRST — if the exercise has any avoided tag, exclude it.
  if (ex.tags?.some((t) => avoidTags.has(t))) return null;

  // Equipment match (hard filter unless user picked "any" / undefined)
  if (req.equipment && req.equipment !== 'any' && ex.equipment !== req.equipment) {
    // Allow bodyweight exercises to count when user has equipment available
    // (you can always do push-ups even at the gym), but penalize the score.
    if (ex.equipment === 'none') {
      // bodyweight is fine as a fallback, just lower priority
    } else {
      return null;
    }
  }

  let score = 0;

  // Muscle match (or full_body request matches anything)
  if (req.muscle && req.muscle !== 'full_body') {
    if (ex.muscle.includes(req.muscle)) score += 10;
    else if (ex.muscle.includes('full_body')) score += 3;
    else return null; // doesn't hit the requested muscle group at all
  } else {
    score += 5;
  }

  // Level match
  if (req.level) {
    const order = { beginner: 1, intermediate: 2, advanced: 3 };
    const exLvl = order[ex.level] || 2;
    const reqLvl = order[req.level] || 2;
    if (exLvl === reqLvl) score += 4;
    else if (exLvl < reqLvl) score += 2;
    else score -= 3; // too advanced for the user
  }

  // Equipment exact match bonus
  if (ex.equipment === req.equipment) score += 3;

  return score;
}

/**
 * Generate a routine.
 *
 * @param {object} request
 *   - goal: 'strength' | 'hypertrophy' | 'endurance' | 'fatloss' | 'mobility' | 'general'
 *   - muscle: 'full_body' | 'upper' | 'lower' | 'core' | 'push' | 'pull' | 'legs' | 'glutes'
 *   - equipment: 'none' | 'dumbbells' | 'barbell' | 'bands' | 'kettlebell' | 'machines' | 'any'
 *   - time: minutes
 *   - level: 'beginner' | 'intermediate' | 'advanced'
 *   - condition: free text (e.g. "knee pain")
 * @param {Array} exercises  Pool of exercises. Each must have a non-empty `gif`.
 * @param {Array<string>} conditionKeys  Pre-detected condition keys.
 * @returns {object} routine
 */
export function generateRoutine(request, exercises, conditionKeys = []) {
  const avoidTags = getAvoidTags(conditionKeys);
  const intensity = getIntensityModifier(conditionKeys);

  // 1) Filter to gif-only as a safety check (defense in depth — dataset already enforces this).
  const pool = exercises.filter((e) => !!e.gif);

  // 2) Score & rank.
  const scored = pool
    .map((ex) => ({ ex, score: scoreExercise(ex, request, avoidTags) }))
    .filter((s) => s.score !== null)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { exercises: [], conditionKeys, intensity, empty: true };
  }

  // 3) Choose top N, but enforce muscle variety so we don't pick 5 push exercises in a row.
  const targetCount = exerciseCountForTime(request.time);
  const chosen = [];
  const muscleHits = {};
  for (const { ex } of scored) {
    const primary = ex.muscle[0];
    muscleHits[primary] = (muscleHits[primary] || 0) + 1;
    // soft cap of 2 per primary muscle when the request is full_body
    if (request.muscle === 'full_body' && muscleHits[primary] > 2) continue;
    chosen.push(ex);
    if (chosen.length >= targetCount) break;
  }

  // Fall back: if variety filter starved us, refill from scored.
  if (chosen.length < Math.min(targetCount, scored.length)) {
    for (const { ex } of scored) {
      if (chosen.length >= targetCount) break;
      if (!chosen.includes(ex)) chosen.push(ex);
    }
  }

  // 4) Build prescriptions per goal, with intensity modifier applied to volume.
  const scheme = SCHEMES[request.goal] || SCHEMES.general;
  const prescribed = chosen.map((ex) => {
    const flagged = ex.tags?.some((t) => CONDITIONS_HIT_BY_TAG(conditionKeys, t)) || false;
    return {
      ...ex,
      sets: Math.max(2, Math.round(scheme.sets * (intensity < 1 ? 0.85 : 1))),
      reps: adjustReps(scheme.reps, intensity),
      rest: scheme.rest,
      flagged, // exercise wasn't filtered out but is on the borderline
    };
  });

  return {
    exercises: prescribed,
    conditionKeys,
    intensity,
    request,
    createdAt: new Date().toISOString(),
    empty: false,
  };
}

// Helper used above — true if the user has a condition that lists this tag,
// even though we kept the exercise (the tag isn't a hard avoid tag for them).
// In practice all hard-avoid tags are filtered earlier, so this is for "soft" warnings only.
// We pre-compute the set of tags actually hit by avoidTags.
function CONDITIONS_HIT_BY_TAG(conditionKeys, tag) {
  // intentionally always returns false here — kept as a hook for future "soft" warnings.
  // (All avoidTags result in the exercise being filtered out, which is the correct, conservative behavior.)
  return false;
}

/**
 * Parse free-text into a structured request.
 * This is a deterministic keyword parser, not an LLM. It's intentionally simple;
 * users who want precision should use the guided form.
 */
export function parseRequestText(text) {
  const t = (text || '').toLowerCase();
  const req = {
    goal: 'general',
    muscle: 'full_body',
    equipment: 'any',
    time: 30,
    level: 'beginner',
    condition: text || '',
  };

  // goal
  if (/strength|fuerza/.test(t)) req.goal = 'strength';
  else if (/hypertrophy|muscle|hipertrofia|musculo|músculo/.test(t)) req.goal = 'hypertrophy';
  else if (/endurance|cardio|resistencia/.test(t)) req.goal = 'endurance';
  else if (/fat ?loss|weight ?loss|adelgaza|grasa|perder peso/.test(t)) req.goal = 'fatloss';
  else if (/mobility|stretch|movilidad|estirar|flexibilidad/.test(t)) req.goal = 'mobility';

  // muscle group
  if (/upper|brazo|pecho|hombro/.test(t)) req.muscle = 'upper';
  else if (/lower|pierna|gluteo|glúteo/.test(t)) req.muscle = 'lower';
  else if (/core|abs|abdomen/.test(t)) req.muscle = 'core';
  else if (/push|empuj/.test(t)) req.muscle = 'push';
  else if (/pull|tiron|tirón|espalda|biceps|bíceps/.test(t)) req.muscle = 'pull';
  else if (/legs|piernas|cuadr/.test(t)) req.muscle = 'legs';
  else if (/glute|gluteo|glúteo/.test(t)) req.muscle = 'glutes';
  else if (/full[- ]?body|cuerpo completo|todo el cuerpo/.test(t)) req.muscle = 'full_body';

  // equipment
  if (/no equipment|sin equipo|bodyweight|peso corporal|en casa|at home/.test(t))
    req.equipment = 'none';
  else if (/dumbbell|mancuerna/.test(t)) req.equipment = 'dumbbells';
  else if (/barbell|barra/.test(t)) req.equipment = 'barbell';
  else if (/band|banda/.test(t)) req.equipment = 'bands';
  else if (/kettlebell|pesa rusa/.test(t)) req.equipment = 'kettlebell';
  else if (/machine|máquina|maquina|gym|gimnasio/.test(t)) req.equipment = 'machines';

  // time
  const timeMatch = t.match(/(\d{2,3})\s*(min|minute|minuto)/);
  if (timeMatch) req.time = parseInt(timeMatch[1], 10);
  else if (/\bquick|rápid|rapid|short|corto/.test(t)) req.time = 15;
  else if (/\blong|largo/.test(t)) req.time = 60;

  // level
  if (/beginner|principiante|nuevo/.test(t)) req.level = 'beginner';
  else if (/intermediate|intermedio/.test(t)) req.level = 'intermediate';
  else if (/advanced|avanzado/.test(t)) req.level = 'advanced';

  return req;
}
