// src/utils/workoutGenerator.js
//
// Rule-based workout generator. Inputs: structured request + exercise pool
// + detected condition keys. Output: a routine the UI can render.
//
// Public API:
//   generateRoutine(request, exercises, conditionKeys)
//   generateWeeklyRoutine(request, exercises, conditionKeys)
//   replaceExercise(routine, exerciseIndex, exercises, conditionKeys)
//   buildSplit(daysPerWeek, level, goal)         <- returns array of day objects
//   inferSubgroup(exercise, targetMuscle)
//   subgroupOf(exercise)
//   youtubeSearchUrl(name, lang)

import { getAvoidTags, getIntensityModifier } from '../data/conditions.js';

// =================================================================
// TAXONOMY
// =================================================================

// User-facing muscle keys → which raw muscles (from the dataset's
// primaryMuscles field) count as a hit. Used both for matching and
// for grouping in weekly splits.
export const MUSCLE_PRIMARY = {
  chest: ['chest'],
  back: ['lats', 'middle back', 'lower back'],
  lats: ['lats'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  shoulders: ['shoulders'],
  traps: ['traps'],
  forearms: ['forearms'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstrings'],
  calves: ['calves'],
  glutes: ['glutes'],
  abductors: ['abductors'],
  adductors: ['adductors'],
  core: ['abdominals'],
  abdominals: ['abdominals'],
  legs: ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors'],
  lower: ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors'],
  upper: ['chest', 'shoulders', 'triceps', 'biceps', 'lats', 'middle back', 'lower back', 'traps'],
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['lats', 'middle back', 'lower back', 'traps', 'biceps', 'forearms'],
  full_body: null, // null = match anything
};

// When the user picks a "group" muscle, expand it for distribution.
const GROUP_EXPANSIONS = {
  full_body: ['chest', 'back', 'quadriceps', 'hamstrings', 'glutes', 'shoulders', 'core'],
  upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  lower: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  legs: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'biceps', 'traps'],
};

// How many exercises to allocate to each muscle within a group.
const MUSCLE_WEIGHTS = {
  chest: 4,
  back: 4,
  lats: 4,
  quadriceps: 4,
  hamstrings: 4,
  glutes: 4,
  shoulders: 3,
  biceps: 2,
  triceps: 2,
  core: 2,
  abdominals: 2,
  traps: 1,
  calves: 1,
  forearms: 1,
};

// Subgroup plans — the order in which we try to fill subgroups for variety.
// "If user wants 4 chest exercises, give them upper, middle, lower, isolation"
const SECTION_PLANS = {
  chest: ['upper_chest', 'middle_chest', 'lower_chest', 'chest_isolation'],
  back: ['lats', 'middle_back', 'traps', 'lower_back'],
  lats: ['lats', 'middle_back'],
  shoulders: ['side_delts', 'front_delts', 'rear_delts'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstrings'],
  glutes: ['glutes'],
  calves: ['calves'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  core: ['core'],
  abdominals: ['core'],
  traps: ['traps'],
  forearms: ['forearms'],
  legs: ['quadriceps', 'quadriceps', 'quadriceps', 'hamstrings', 'hamstrings', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'],
  lower: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'],
};

// Heuristic mapping from exercise name fragments → subgroup label.
const SECTION_NAME_HINTS = [
  // Chest
  { re: /\bincline|inclinad/i, group: 'chest', section: 'upper_chest' },
  { re: /\bdecline|declinad/i, group: 'chest', section: 'lower_chest' },
  { re: /\bfly|flye|cross|peck|aperturas|cruce/i, group: 'chest', section: 'chest_isolation' },
  { re: /\bdip\b/i, group: 'chest', section: 'lower_chest' },

  // Back
  { re: /\bdeadlift|peso muerto|good ?morning|hyperextension|back extension/i, group: 'back', section: 'lower_back' },
  { re: /\bshrug|encogim|farmer/i, group: 'back', section: 'traps' },
  { re: /\bpull.?up|chin.?up|pulldown|jal[oó]n|dominada/i, group: 'back', section: 'lats' },
  { re: /\brow\b|remo/i, group: 'back', section: 'middle_back' },

  // Shoulders
  { re: /\blateral raise|elevac.* lateral/i, group: 'shoulders', section: 'side_delts' },
  { re: /\bfront raise|elevac.* frontal/i, group: 'shoulders', section: 'front_delts' },
  { re: /\brear|reverse fly|p[aá]jaros|posterior/i, group: 'shoulders', section: 'rear_delts' },
  { re: /\bpress|military|overhead/i, group: 'shoulders', section: 'front_delts' },
];

// Sets / reps / rest schemes by goal.
const SCHEMES = {
  strength: { sets: 4, reps: '4-6', rest: 150 },
  hypertrophy: { sets: 4, reps: '8-12', rest: 75 },
  endurance: { sets: 3, reps: '15-20', rest: 45 },
  fatloss: { sets: 3, reps: '12-15', rest: 30 },
  mobility: { sets: 2, reps: '10-12', rest: 30 },
  general: { sets: 3, reps: '10-12', rest: 60 },
};

// Level → volume modifier (multiplies set count) and technique availability.
const LEVEL_PROFILE = {
  beginner: { setsMul: 0.75, allowSuperset: false, allowDropset: false, capLevel: 'beginner' },
  balanced: { setsMul: 1.0, allowSuperset: false, allowDropset: false, capLevel: 'intermediate' },
  advanced: { setsMul: 1.0, allowSuperset: true, allowDropset: false, capLevel: 'expert' },
  gym_rat: { setsMul: 1.15, allowSuperset: true, allowDropset: true, capLevel: 'expert' },
};

const LEVEL_ORDER = { beginner: 1, intermediate: 2, expert: 3, advanced: 3 };

// =================================================================
// HELPERS
// =================================================================

function unique(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function exerciseCountForTime(minutes) {
  if (!minutes || minutes < 10) return 3;
  if (minutes <= 20) return 4;
  if (minutes <= 35) return 5;
  if (minutes <= 50) return 6;
  if (minutes <= 75) return 7;
  if (minutes <= 100) return 8;
  return 9;
}

function adjustReps(repsStr, modifier) {
  if (modifier >= 1) return repsStr;
  const m = String(repsStr).match(/^(\d+)-(\d+)$/);
  if (!m) return repsStr;
  const lo = Math.max(4, Math.round(parseInt(m[1], 10) * modifier));
  const hi = Math.max(lo + 2, Math.round(parseInt(m[2], 10) * modifier));
  return `${lo}-${hi}`;
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// =================================================================
// SUBGROUP DETECTION
// =================================================================

/**
 * Infer the subgroup of an exercise relative to a target muscle.
 * Returns a key like 'upper_chest', 'lats', 'side_delts'.
 */
export function inferSubgroup(ex, targetMuscle) {
  if (!ex) return 'general';

  const name = (ex.name?.en || ex.name || '').toLowerCase();

  // Try the name hints first — most reliable.
  for (const hint of SECTION_NAME_HINTS) {
    if (hint.re.test(name)) {
      // Only return if it matches the target group (or the target is generic)
      if (
        !targetMuscle ||
        targetMuscle === 'full_body' ||
        targetMuscle === hint.group ||
        (MUSCLE_PRIMARY[targetMuscle] || []).some((m) => MUSCLE_PRIMARY[hint.group]?.includes(m))
      ) {
        return hint.section;
      }
    }
  }

  // Fall back to the primary muscle of the exercise.
  const primary = (ex.primaryMuscles && ex.primaryMuscles[0]) || ex.muscle?.[0];
  if (primary) return String(primary).replace(/\s+/g, '_');

  return 'general';
}

/**
 * Public: subgroup tag without needing a target.
 */
export function subgroupOf(exercise) {
  return inferSubgroup(exercise, null);
}

// =================================================================
// MATCHING & SCORING
// =================================================================

function muscleMatchesPrimary(ex, requestedMuscle) {
  if (!requestedMuscle || requestedMuscle === 'full_body') return true;
  const primary = MUSCLE_PRIMARY[requestedMuscle];
  if (!primary) {
    // Unknown — fall back to tag membership
    return (ex.muscle || []).includes(requestedMuscle);
  }
  const exPrimary = ex.primaryMuscles || [];
  return exPrimary.some((m) => primary.includes(m));
}

function equipmentMatches(ex, requestedEquipment) {
  if (!requestedEquipment || requestedEquipment.length === 0) return true;
  if (requestedEquipment.includes('any')) return true;
  if (requestedEquipment.includes(ex.equipment)) return true;
  // Bodyweight is always available unless 'none' was explicitly excluded
  if (ex.equipment === 'none' && requestedEquipment.length > 0) return true;
  return false;
}

function levelOk(ex, capLevel) {
  if (!capLevel) return true;
  const exLvl = LEVEL_ORDER[ex.level] || 2;
  const capLvl = LEVEL_ORDER[capLevel] || 2;
  return exLvl <= capLvl;
}

function passesSafety(ex, avoidTags) {
  if (!avoidTags || avoidTags.size === 0) return true;
  return !ex.tags?.some((t) => avoidTags.has(t));
}

/**
 * Score an exercise's fit. Returns null if it should be excluded.
 */
function scoreExercise(ex, ctx) {
  if (!passesSafety(ex, ctx.avoidTags)) return null;
  if (!levelOk(ex, ctx.capLevel)) return null;
  if (!equipmentMatches(ex, ctx.equipment)) return null;
  if (!muscleMatchesPrimary(ex, ctx.targetMuscle)) return null;

  let s = 10;

  // Equipment exact match (not bodyweight default) gets a small bonus.
  if (ctx.equipment.includes(ex.equipment) && ex.equipment !== 'none') s += 4;

  // Level closeness (we want the user's level, not below)
  const exLvl = LEVEL_ORDER[ex.level] || 2;
  const want = ctx.userLevelOrder;
  if (exLvl === want) s += 5;
  else if (Math.abs(exLvl - want) === 1) s += 2;

  // Goal-aligned mechanics
  if (ctx.goal === 'strength' && ex.mechanic === 'compound') s += 4;
  if (ctx.goal === 'hypertrophy' && (ex.mechanic === 'compound' || ex.mechanic === 'isolation')) s += 2;
  if (ctx.goal === 'mobility' && ex.category === 'stretching') s += 6;

  // Subgroup match bonus
  if (ctx.preferredSubgroup) {
    const sub = inferSubgroup(ex, ctx.targetMuscle);
    if (sub === ctx.preferredSubgroup) s += 8;
  }

  // Slight randomization so successive generations aren't identical.
  s += Math.random() * 0.5;

  return s;
}

// =================================================================
// REQUEST NORMALIZATION
// =================================================================

export function normalizeRequest(request = {}) {
  const r = {
    goal: request.goal || 'general',
    level: request.level || 'balanced',
    muscle: request.muscle || 'full_body',
    equipment: Array.isArray(request.equipment)
      ? unique(request.equipment)
      : request.equipment
        ? [request.equipment]
        : ['any'],
    time: request.time && Number(request.time) > 0 ? Number(request.time) : null,
    exerciseCount:
      request.exerciseCount && Number(request.exerciseCount) > 0
        ? Math.max(3, Math.min(12, Math.round(Number(request.exerciseCount))))
        : null,
    condition: request.condition || '',
    sex: request.sex || null,
    age: request.age ? Number(request.age) : null,
  };

  if (r.equipment.length === 0) r.equipment = ['any'];

  // Resolve target count: explicit count beats time-derived.
  if (!r.exerciseCount && r.time) {
    r.exerciseCount = exerciseCountForTime(r.time);
  }
  if (!r.exerciseCount) r.exerciseCount = 5;

  return r;
}

// =================================================================
// MUSCLE ALLOCATION (how many exercises per muscle for a group target)
// =================================================================

function allocateCounts(muscles, total) {
  if (muscles.length === 1) return { [muscles[0]]: total };

  const weights = muscles.map((m) => MUSCLE_WEIGHTS[m] || 1);
  const sum = weights.reduce((a, b) => a + b, 0);
  const allocation = {};
  let assigned = 0;

  for (let i = 0; i < muscles.length; i++) {
    const share = Math.floor((weights[i] / sum) * total);
    allocation[muscles[i]] = share;
    assigned += share;
  }

  // Distribute remainder largest-weight-first.
  const ordered = muscles
    .map((m, i) => ({ m, w: weights[i] }))
    .sort((a, b) => b.w - a.w);
  let i = 0;
  while (assigned < total && i < ordered.length * 2) {
    allocation[ordered[i % ordered.length].m] += 1;
    assigned++;
    i++;
  }

  return allocation;
}

function expandTargetMuscles(muscle) {
  if (GROUP_EXPANSIONS[muscle]) return GROUP_EXPANSIONS[muscle];
  return [muscle];
}

// =================================================================
// CORE GENERATION
// =================================================================

function pickForMuscle(pool, muscle, count, ctx, alreadyChosen) {
  const sectionPlan = SECTION_PLANS[muscle] || [muscle];
  const chosen = [];
  const usedSubgroups = new Set();

  // Score the whole pool against this muscle once.
  const scored = pool
    .map((ex) => {
      const localCtx = { ...ctx, targetMuscle: muscle, preferredSubgroup: null };
      const s = scoreExercise(ex, localCtx);
      return s === null ? null : { ex, score: s };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return chosen;

  for (let i = 0; i < count; i++) {
    // Preferred subgroup for this slot, cycling through the plan.
    const wanted = sectionPlan[i % sectionPlan.length];

    // First try to find a great match in the wanted subgroup that's also new.
    let pick = scored.find(
      ({ ex }) =>
        !alreadyChosen.has(ex.id) &&
        !chosen.some((c) => c.id === ex.id) &&
        inferSubgroup(ex, muscle) === wanted &&
        !usedSubgroups.has(wanted),
    );

    // Fall back: any scored exercise we haven't used yet.
    if (!pick) {
      pick = scored.find(
        ({ ex }) =>
          !alreadyChosen.has(ex.id) &&
          !chosen.some((c) => c.id === ex.id),
      );
    }

    if (!pick) break;

    chosen.push(pick.ex);
    alreadyChosen.add(pick.ex.id);
    usedSubgroups.add(inferSubgroup(pick.ex, muscle));

    // After using a subgroup once, allow it again only if there are no fresh ones.
    // We rebuild the available section each cycle.
    if (usedSubgroups.size >= sectionPlan.length) {
      usedSubgroups.clear();
    }
  }

  return chosen;
}

function applyTechniques(exercises, levelKey) {
  const profile = LEVEL_PROFILE[levelKey] || LEVEL_PROFILE.balanced;
  const out = exercises.map((ex) => ({ ...ex, technique: 'straight' }));

  if (!profile.allowSuperset && !profile.allowDropset) return out;

  // Pair adjacent isolation exercises into a superset (every 3rd-4th slot).
  // This keeps it simple and safe even on advanced.
  if (profile.allowSuperset && out.length >= 4) {
    for (let i = 1; i < out.length; i += 3) {
      if (i + 1 >= out.length) break;
      const a = out[i];
      const b = out[i + 1];
      // Only superset if both are non-strength (we don't pair heavy compounds).
      if (a.mechanic !== 'compound' && b.mechanic !== 'compound') {
        a.technique = 'superset';
        a.supersetWith = b.id;
        b.technique = 'superset';
        b.supersetWith = a.id;
      }
    }
  }

  // Add one drop set on the last big lift for gym rats.
  if (profile.allowDropset) {
    const last = out
      .map((ex, i) => ({ ex, i }))
      .reverse()
      .find(({ ex }) => ex.mechanic !== 'compound');
    if (last) last.ex.technique = 'dropset';
  }

  return out;
}

function buildPrescription(exercise, ctx) {
  const scheme = SCHEMES[ctx.goal] || SCHEMES.general;
  const profile = LEVEL_PROFILE[ctx.levelKey] || LEVEL_PROFILE.balanced;
  const sets = Math.max(2, Math.round(scheme.sets * profile.setsMul * (ctx.intensity < 1 ? 0.85 : 1)));
  const reps = adjustReps(scheme.reps, ctx.intensity);
  const rest = ctx.intensity < 1 ? Math.round(scheme.rest * 1.15) : scheme.rest;

  return {
    ...exercise,
    sets,
    reps,
    rest,
    subgroup: inferSubgroup(exercise, ctx.targetMuscleForCard || null),
  };
}

/**
 * Generate a single-day routine.
 */
export function generateRoutine(rawRequest, exercises, conditionKeys = []) {
  const request = normalizeRequest(rawRequest);
  const avoidTags = getAvoidTags(conditionKeys);
  const intensity = getIntensityModifier(conditionKeys);

  const profile = LEVEL_PROFILE[request.level] || LEVEL_PROFILE.balanced;
  const userLevelOrder = LEVEL_ORDER[
    request.level === 'beginner'
      ? 'beginner'
      : request.level === 'gym_rat'
        ? 'expert'
        : request.level === 'advanced'
          ? 'expert'
          : 'intermediate'
  ];

  const ctx = {
    goal: request.goal,
    levelKey: request.level,
    capLevel: profile.capLevel,
    userLevelOrder,
    equipment: request.equipment,
    avoidTags,
    intensity,
    targetMuscle: request.muscle,
  };

  const pool = (exercises || []).filter(
    (e) => Array.isArray(e.images) ? e.images.length > 0 : !!e.gif,
  );

  if (pool.length === 0) {
    return { exercises: [], conditionKeys, intensity, request, empty: true };
  }

  // Decide muscle distribution.
  const targetMuscles = expandTargetMuscles(request.muscle);
  const allocation = allocateCounts(targetMuscles, request.exerciseCount);

  const alreadyChosen = new Set();
  const collected = [];

  for (const muscle of targetMuscles) {
    const need = allocation[muscle];
    if (!need) continue;
    const picks = pickForMuscle(pool, muscle, need, ctx, alreadyChosen);
    for (const ex of picks) {
      collected.push({ ...ex, _targetMuscle: muscle });
    }
  }

  // If we didn't reach the target count (some muscles starved), top up
  // with any compatible exercise.
  if (collected.length < request.exerciseCount) {
    const needMore = request.exerciseCount - collected.length;
    const fallbackCtx = { ...ctx, targetMuscle: request.muscle };
    const scored = pool
      .filter((e) => !alreadyChosen.has(e.id))
      .map((ex) => ({ ex, score: scoreExercise(ex, fallbackCtx) }))
      .filter((s) => s.score !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, needMore);
    for (const { ex } of scored) {
      alreadyChosen.add(ex.id);
      collected.push({ ...ex, _targetMuscle: request.muscle });
    }
  }

  if (collected.length === 0) {
    return { exercises: [], conditionKeys, intensity, request, empty: true };
  }

  // Build prescriptions, then layer techniques on top.
  const prescribed = collected.map((ex) =>
    buildPrescription(ex, { ...ctx, targetMuscleForCard: ex._targetMuscle }),
  );
  const withTechniques = applyTechniques(prescribed, request.level);

  return {
    exercises: withTechniques,
    conditionKeys,
    intensity,
    request,
    createdAt: new Date().toISOString(),
    empty: false,
  };
}

// =================================================================
// EXERCISE REPLACEMENT
// =================================================================

/**
 * Replace one exercise in a routine without touching the others.
 * Picks an alternative that:
 *  - hits the same target muscle
 *  - respects equipment, level, conditions
 *  - avoids any exercise already in the routine
 */
export function replaceExercise(routine, exerciseIndex, exercises, conditionKeys = []) {
  if (!routine || !Array.isArray(routine.exercises)) return null;
  const current = routine.exercises[exerciseIndex];
  if (!current) return null;

  const request = routine.request || normalizeRequest({});
  const avoidTags = getAvoidTags(conditionKeys);
  const intensity = getIntensityModifier(conditionKeys);

  const profile = LEVEL_PROFILE[request.level] || LEVEL_PROFILE.balanced;
  const userLevelOrder = LEVEL_ORDER[
    request.level === 'beginner'
      ? 'beginner'
      : request.level === 'gym_rat' || request.level === 'advanced'
        ? 'expert'
        : 'intermediate'
  ];

  // Target muscle — try the original assignment first, otherwise primary.
  const targetMuscle =
    current._targetMuscle ||
    (current.primaryMuscles && current.primaryMuscles[0]) ||
    request.muscle;

  const ctx = {
    goal: request.goal,
    levelKey: request.level,
    capLevel: profile.capLevel,
    userLevelOrder,
    equipment: request.equipment,
    avoidTags,
    intensity,
    targetMuscle,
    preferredSubgroup: current.subgroup || inferSubgroup(current, targetMuscle),
  };

  const usedIds = new Set(routine.exercises.map((e) => e.id));

  const pool = (exercises || []).filter(
    (e) => (Array.isArray(e.images) ? e.images.length > 0 : !!e.gif) && !usedIds.has(e.id),
  );

  if (pool.length === 0) return null;

  // Score, sort, pick the top — but with a small randomization in scoreExercise
  // so consecutive replacements aren't identical.
  const scored = pool
    .map((ex) => ({ ex, score: scoreExercise(ex, ctx) }))
    .filter((s) => s.score !== null)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) return null;

  const next = scored[0].ex;
  const prescribed = buildPrescription(
    { ...next, _targetMuscle: targetMuscle },
    { ...ctx, targetMuscleForCard: targetMuscle },
  );
  prescribed.technique = current.technique || 'straight';
  if (current.supersetWith) prescribed.supersetWith = current.supersetWith;

  const newExercises = [...routine.exercises];
  newExercises[exerciseIndex] = prescribed;

  return {
    ...routine,
    exercises: newExercises,
    updatedAt: new Date().toISOString(),
  };
}

// =================================================================
// WEEKLY SPLITS
// =================================================================

const SPLITS = {
  // Keys: number of training days per week.
  // Each split is an array of day plans. Each day has a label and a muscle target.
  2: [
    { id: 'upper', label: { en: 'Upper body', es: 'Tren superior' }, muscle: 'upper' },
    { id: 'lower', label: { en: 'Lower body', es: 'Tren inferior' }, muscle: 'lower' },
  ],
  3: [
    { id: 'push', label: { en: 'Push', es: 'Empuje' }, muscle: 'push' },
    { id: 'pull', label: { en: 'Pull', es: 'Tirón' }, muscle: 'pull' },
    { id: 'legs', label: { en: 'Legs', es: 'Piernas' }, muscle: 'legs' },
  ],
  4: [
    { id: 'upper1', label: { en: 'Upper A', es: 'Superior A' }, muscle: 'upper' },
    { id: 'lower1', label: { en: 'Lower A', es: 'Inferior A' }, muscle: 'lower' },
    { id: 'upper2', label: { en: 'Upper B', es: 'Superior B' }, muscle: 'upper' },
    { id: 'lower2', label: { en: 'Lower B', es: 'Inferior B' }, muscle: 'lower' },
  ],
  5: [
    { id: 'push', label: { en: 'Push', es: 'Empuje' }, muscle: 'push' },
    { id: 'pull', label: { en: 'Pull', es: 'Tirón' }, muscle: 'pull' },
    { id: 'legs', label: { en: 'Legs', es: 'Piernas' }, muscle: 'legs' },
    { id: 'upper', label: { en: 'Upper', es: 'Superior' }, muscle: 'upper' },
    { id: 'lower', label: { en: 'Lower', es: 'Inferior' }, muscle: 'lower' },
  ],
  6: [
    { id: 'push1', label: { en: 'Push A', es: 'Empuje A' }, muscle: 'push' },
    { id: 'pull1', label: { en: 'Pull A', es: 'Tirón A' }, muscle: 'pull' },
    { id: 'legs1', label: { en: 'Legs A', es: 'Piernas A' }, muscle: 'legs' },
    { id: 'push2', label: { en: 'Push B', es: 'Empuje B' }, muscle: 'push' },
    { id: 'pull2', label: { en: 'Pull B', es: 'Tirón B' }, muscle: 'pull' },
    { id: 'legs2', label: { en: 'Legs B', es: 'Piernas B' }, muscle: 'legs' },
  ],
};

const BRO_SPLIT = [
  { id: 'chest', label: { en: 'Chest', es: 'Pecho' }, muscle: 'chest' },
  { id: 'back', label: { en: 'Back', es: 'Espalda' }, muscle: 'back' },
  { id: 'legs', label: { en: 'Legs', es: 'Piernas' }, muscle: 'legs' },
  { id: 'shoulders', label: { en: 'Shoulders', es: 'Hombros' }, muscle: 'shoulders' },
  { id: 'arms', label: { en: 'Arms', es: 'Brazos' }, muscle: 'biceps' }, // arms day handled below
];

/**
 * Pick the best split structure for the user.
 */
export function buildSplit(daysPerWeek, level = 'balanced', goal = 'general') {
  const days = Math.max(2, Math.min(6, Number(daysPerWeek) || 3));

  // Bro split makes sense at 5 days for hypertrophy gym_rat.
  if (days === 5 && level === 'gym_rat' && goal === 'hypertrophy') {
    return BRO_SPLIT.map((d) => ({ ...d }));
  }

  return (SPLITS[days] || SPLITS[3]).map((d) => ({ ...d }));
}

/**
 * Generate a weekly plan: one routine per training day, plus rest days
 * filled in to hit 7 calendar days.
 */
export function generateWeeklyRoutine(rawRequest, exercises, conditionKeys = []) {
  const request = normalizeRequest({
    goal: rawRequest.goal || 'general',
    level: rawRequest.level || 'balanced',
    equipment: rawRequest.equipment || ['any'],
    exerciseCount: rawRequest.exerciseCount || 6,
    sex: rawRequest.sex,
    age: rawRequest.age,
  });

  const daysPerWeek = Math.max(2, Math.min(6, Number(rawRequest.daysPerWeek) || 3));
  const split = buildSplit(daysPerWeek, request.level, request.goal);

  const days = split.map((slot) => {
    const dayRequest = {
      ...request,
      muscle: slot.muscle,
    };
    const routine = generateRoutine(dayRequest, exercises, conditionKeys);
    return {
      id: slot.id,
      label: slot.label,
      muscle: slot.muscle,
      routine,
    };
  });

  return {
    type: 'weekly',
    daysPerWeek,
    split,
    days,
    conditionKeys,
    request,
    createdAt: new Date().toISOString(),
  };
}

// =================================================================
// YOUTUBE LINK BUILDER
// =================================================================

export function youtubeSearchUrl(exerciseName, lang = 'en') {
  const prefix = lang === 'es' ? 'cómo hacer ' : 'how to do ';
  const q = encodeURIComponent(`${prefix}${exerciseName}`);
  return `https://www.youtube.com/results?search_query=${q}`;
}
