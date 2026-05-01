// src/utils/workoutGenerator.js
//
// VIGORIX rule-based workout generator.
//
// Public API:
//   generateRoutine(request, exercises, conditionKeys)
//   generateWeeklyRoutine(request, exercises, conditionKeys)
//   replaceExercise(routine, exerciseIndex, exercises, conditionKeys)
//   buildSplit(daysPerWeek, level, goal)
//   inferSubgroup(exercise, targetMuscle)
//   subgroupOf(exercise)
//   youtubeSearchUrl(name, lang)
//
// Built on top of the central classifier in src/data/subgroupClassifier.js,
// which means every exercise that flows through the aggregator is already
// tagged with main_muscle / sub_muscle / exercise_type, etc.

import { getAvoidTags, getIntensityModifier } from '../data/conditions.js';
import { classifyExercise } from '../data/subgroupClassifier.js';

// =================================================================
// REQUEST → POOL TAXONOMY
// =================================================================

// User-facing muscle keys → which classifier "main_muscle" values match.
const MUSCLE_TO_MAINS = {
  full_body: null, // null = match anything
  upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'traps'],
  lower: ['quads', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves', 'abductors', 'adductors'],
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'biceps', 'lower_back', 'traps'],

  chest: ['chest'],
  back: ['back', 'lower_back'],
  shoulders: ['shoulders'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  forearms: ['forearms'],
  traps: ['traps'],
  abs: ['abs'],
  core: ['abs'],
  quadriceps: ['quads'],
  quads: ['quads'],
  hamstrings: ['hamstrings'],
  glutes: ['glutes'],
  calves: ['calves'],
  abductors: ['abductors'],
  adductors: ['adductors'],
};

const GROUP_EXPANSIONS = {
  full_body: ['chest', 'back', 'quads', 'hamstrings', 'glutes', 'shoulders', 'abs'],
  upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  lower: ['quads', 'hamstrings', 'glutes', 'calves'],
  legs: ['quads', 'hamstrings', 'glutes', 'calves'],
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'biceps', 'traps'],
};

const MUSCLE_WEIGHTS = {
  chest: 4, back: 4,
  quads: 4, hamstrings: 3, glutes: 3, calves: 1,
  shoulders: 3, biceps: 2, triceps: 2,
  abs: 2, traps: 1, forearms: 1,
  abductors: 1, adductors: 1, lower_back: 1,
};

const SECTION_PLANS = {
  chest: ['upper_chest', 'mid_chest', 'lower_chest', 'chest_isolation'],
  back: ['lats', 'middle_back', 'upper_back'],
  lower_back: ['lower_back'],
  shoulders: ['lateral_delts', 'front_delts', 'rear_delts'],
  biceps: ['biceps_long_head', 'biceps_short_head', 'brachialis', 'biceps'],
  triceps: ['triceps_long_head', 'triceps_lateral_head', 'triceps_medial_head', 'triceps'],
  quads: ['quads'],
  hamstrings: ['hamstrings_curl', 'hamstrings_hinge', 'hamstrings'],
  glutes: ['glutes_max', 'glutes_med'],
  calves: ['calves_gastrocnemius', 'calves_soleus'],
  abs: ['abs_upper', 'abs_lower', 'obliques', 'core'],
  traps: ['traps'],
  forearms: ['forearms'],
  abductors: ['abductors'],
  adductors: ['adductors'],
};

const SCHEMES = {
  strength:    { sets: 4, reps: '4-6',   rest: 150 },
  hypertrophy: { sets: 4, reps: '8-12',  rest: 75 },
  endurance:   { sets: 3, reps: '15-20', rest: 45 },
  fatloss:     { sets: 3, reps: '12-15', rest: 30 },
  mobility:    { sets: 2, reps: '10-12', rest: 30 },
  general:     { sets: 3, reps: '10-12', rest: 60 },
};

const LEVEL_PROFILE = {
  beginner: { setsMul: 0.75, allowSuperset: false, allowTriset: false, allowDropset: false, capLevel: 'beginner' },
  balanced: { setsMul: 1.00, allowSuperset: false, allowTriset: false, allowDropset: false, capLevel: 'intermediate' },
  advanced: { setsMul: 1.05, allowSuperset: true,  allowTriset: false, allowDropset: false, capLevel: 'advanced' },
  gym_rat:  { setsMul: 1.15, allowSuperset: true,  allowTriset: true,  allowDropset: true,  capLevel: 'advanced' },
};

const LEVEL_ORDER = { beginner: 1, intermediate: 2, advanced: 3, expert: 3 };

// Antagonist pairs — used to build smart supersets.
const ANTAGONIST_PAIRS = [
  ['biceps', 'triceps'],
  ['chest', 'back'],
  ['quads', 'hamstrings'],
  ['shoulders', 'back'],
];

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

// =================================================================
// PUBLIC: SUBGROUP HELPERS
// =================================================================

export function inferSubgroup(ex, _targetMuscle) {
  if (!ex) return 'general';
  if (ex.sub_muscle) return ex.sub_muscle;
  const c = classifyExercise(ex);
  return c.sub_muscle || 'general';
}

export function subgroupOf(ex) {
  return inferSubgroup(ex);
}

export function youtubeSearchUrl(exerciseName, lang = 'en') {
  const prefix = lang === 'es' ? 'cómo hacer ' : 'how to do ';
  const q = encodeURIComponent(`${prefix}${exerciseName}`);
  return `https://www.youtube.com/results?search_query=${q}`;
}

// =================================================================
// MATCHING & SCORING
// =================================================================

function muscleMatches(ex, requestedMuscle) {
  if (!requestedMuscle || requestedMuscle === 'full_body') return true;
  const allowed = MUSCLE_TO_MAINS[requestedMuscle];
  if (!allowed) return ex.main_muscle === requestedMuscle;
  return allowed.includes(ex.main_muscle);
}

function equipmentMatches(ex, requestedEquipment) {
  if (!requestedEquipment || requestedEquipment.length === 0) return true;
  if (requestedEquipment.includes('any')) return true;
  if (requestedEquipment.includes(ex.equipment)) return true;
  if (ex.equipment === 'none') return true;
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

function scoreExercise(ex, ctx) {
  if (!passesSafety(ex, ctx.avoidTags)) return null;
  if (!levelOk(ex, ctx.capLevel)) return null;
  if (!equipmentMatches(ex, ctx.equipment)) return null;
  if (!muscleMatches(ex, ctx.targetMuscle)) return null;

  let s = 10;
  if (ctx.equipment.includes(ex.equipment) && ex.equipment !== 'none') s += 4;
  const exLvl = LEVEL_ORDER[ex.level] || 2;
  if (exLvl === ctx.userLevelOrder) s += 5;
  else if (Math.abs(exLvl - ctx.userLevelOrder) === 1) s += 2;
  if (ctx.goal === 'strength' && ex.exercise_type === 'compound') s += 6;
  if (ctx.goal === 'hypertrophy') s += 2;
  if (ctx.goal === 'mobility' && ex.category === 'stretching') s += 6;
  if (ctx.preferredSubgroup && ex.sub_muscle === ctx.preferredSubgroup) s += 8;
  if (ex.gif && /\.gif/i.test(ex.gif)) s += 1;
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
      : request.equipment ? [request.equipment] : ['any'],
    time: request.time && Number(request.time) > 0 ? Number(request.time) : null,
    exerciseCount: request.exerciseCount && Number(request.exerciseCount) > 0
      ? Math.max(3, Math.min(12, Math.round(Number(request.exerciseCount))))
      : null,
    condition: request.condition || '',
    sex: request.sex || null,
    age: request.age ? Number(request.age) : null,
  };
  if (r.equipment.length === 0) r.equipment = ['any'];
  if (!r.exerciseCount && r.time) r.exerciseCount = exerciseCountForTime(r.time);
  if (!r.exerciseCount) r.exerciseCount = 5;
  return r;
}

// =================================================================
// MUSCLE ALLOCATION
// =================================================================

function expandTargetMuscles(muscle) {
  return GROUP_EXPANSIONS[muscle] || [muscle];
}

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
  const ordered = muscles.map((m, i) => ({ m, w: weights[i] })).sort((a, b) => b.w - a.w);
  let i = 0;
  while (assigned < total && i < ordered.length * 4) {
    allocation[ordered[i % ordered.length].m] += 1;
    assigned++;
    i++;
  }
  return allocation;
}

// =================================================================
// CORE GENERATION
// =================================================================

function pickForMuscle(pool, muscle, count, ctx, usedIds) {
  const sectionPlan = SECTION_PLANS[muscle] || [muscle];

  const scored = pool
    .filter((ex) => !usedIds.has(ex.id))
    .map((ex) => {
      const s = scoreExercise(ex, { ...ctx, targetMuscle: muscle, preferredSubgroup: null });
      return s === null ? null : { ex, score: s };
    })
    .filter(Boolean)
    .sort((a, b) => b.score - a.score);

  const chosen = [];
  const usedSubgroups = new Set();

  for (let i = 0; i < count; i++) {
    const wantedSubgroup = sectionPlan[i % sectionPlan.length];
    let pick = scored.find(
      ({ ex }) =>
        !usedIds.has(ex.id) &&
        !chosen.some((c) => c.id === ex.id) &&
        ex.sub_muscle === wantedSubgroup &&
        !usedSubgroups.has(wantedSubgroup),
    );
    if (!pick) {
      pick = scored.find(({ ex }) => !usedIds.has(ex.id) && !chosen.some((c) => c.id === ex.id));
    }
    if (!pick) break;
    chosen.push(pick.ex);
    usedIds.add(pick.ex.id);
    usedSubgroups.add(pick.ex.sub_muscle);
    if (usedSubgroups.size >= sectionPlan.length) usedSubgroups.clear();
  }
  return chosen;
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
    subgroup: exercise.sub_muscle,
    technique: 'straight',
  };
}

// =================================================================
// TECHNIQUE ENGINE — supersets, trisets, dropsets
// =================================================================

function applyTechniques(exercises, levelKey) {
  const profile = LEVEL_PROFILE[levelKey] || LEVEL_PROFILE.balanced;
  const list = exercises.map((ex) => ({ ...ex, technique: 'straight' }));

  if (!profile.allowSuperset && !profile.allowTriset && !profile.allowDropset) return list;

  // ---- 1) ANTAGONIST SUPERSETS ----
  if (profile.allowSuperset) {
    const used = new Set();
    for (let i = 0; i < list.length; i++) {
      if (used.has(i)) continue;
      const a = list[i];
      if (a.exercise_type === 'compound') continue;

      let bestJ = -1;
      let bestScore = -1;
      for (let j = i + 1; j < list.length; j++) {
        if (used.has(j)) continue;
        const b = list[j];
        if (b.exercise_type === 'compound') continue;
        if (!areAntagonists(a.main_muscle, b.main_muscle)) continue;

        let s = 1;
        if (a.equipment === b.equipment) s += 3; // same machine = real-gym efficiency
        if (j === i + 1) s += 2;
        if (s > bestScore) { bestScore = s; bestJ = j; }
      }
      if (bestJ === -1) continue;
      const b = list[bestJ];
      a.technique = 'superset';
      b.technique = 'superset';
      a.supersetWith = b.id;
      b.supersetWith = a.id;
      const g = `ss_${i}`;
      a.supersetGroup = g;
      b.supersetGroup = g;
      used.add(i); used.add(bestJ);
    }
  }

  // ---- 2) TRI-SETS for gym_rat ----
  if (profile.allowTriset && list.length >= 5) {
    for (let i = 0; i < list.length - 2; i++) {
      const a = list[i], b = list[i + 1], c = list[i + 2];
      if (a.technique !== 'straight' || b.technique !== 'straight' || c.technique !== 'straight') continue;
      if ([a, b, c].some((e) => e.exercise_type === 'compound')) continue;
      if (a.main_muscle === b.main_muscle && b.main_muscle === c.main_muscle) {
        const g = `ts_${i}`;
        a.technique = 'triset'; b.technique = 'triset'; c.technique = 'triset';
        a.supersetGroup = g; b.supersetGroup = g; c.supersetGroup = g;
        break;
      }
    }
  }

  // ---- 3) DROP SET for gym_rat ----
  if (profile.allowDropset) {
    for (let i = list.length - 1; i >= 0; i--) {
      const ex = list[i];
      if (ex.technique === 'straight' && ex.exercise_type !== 'compound') {
        ex.technique = 'dropset';
        break;
      }
    }
  }

  return list;
}

function areAntagonists(mainA, mainB) {
  if (!mainA || !mainB) return false;
  return ANTAGONIST_PAIRS.some(([x, y]) => (mainA === x && mainB === y) || (mainA === y && mainB === x));
}

// =================================================================
// PUBLIC: GENERATE
// =================================================================

export function generateRoutine(rawRequest, exercises, conditionKeys = []) {
  const request = normalizeRequest(rawRequest);
  const avoidTags = getAvoidTags(conditionKeys);
  const intensity = getIntensityModifier(conditionKeys);
  const profile = LEVEL_PROFILE[request.level] || LEVEL_PROFILE.balanced;
  const userLevelOrder = LEVEL_ORDER[
    request.level === 'beginner' ? 'beginner' :
    request.level === 'gym_rat' || request.level === 'advanced' ? 'advanced' :
    'intermediate'
  ];

  const ctx = {
    goal: request.goal,
    levelKey: request.level,
    capLevel: profile.capLevel,
    userLevelOrder,
    equipment: request.equipment,
    avoidTags,
    intensity,
  };

  const pool = (exercises || []).filter(
    (e) => Array.isArray(e.images) ? e.images.length > 0 : !!e.gif,
  );
  if (pool.length === 0) {
    return { exercises: [], conditionKeys, intensity, request, empty: true };
  }

  const targetMuscles = expandTargetMuscles(request.muscle);
  const allocation = allocateCounts(targetMuscles, request.exerciseCount);

  const usedIds = new Set();
  const collected = [];
  for (const muscle of targetMuscles) {
    const need = allocation[muscle];
    if (!need) continue;
    const picks = pickForMuscle(pool, muscle, need, ctx, usedIds);
    for (const ex of picks) collected.push({ ...ex, _targetMuscle: muscle });
  }

  if (collected.length < request.exerciseCount) {
    const needed = request.exerciseCount - collected.length;
    const fallback = pool
      .filter((e) => !usedIds.has(e.id))
      .map((ex) => ({ ex, score: scoreExercise(ex, { ...ctx, targetMuscle: request.muscle }) }))
      .filter((s) => s.score !== null)
      .sort((a, b) => b.score - a.score)
      .slice(0, needed);
    for (const { ex } of fallback) {
      usedIds.add(ex.id);
      collected.push({ ...ex, _targetMuscle: request.muscle });
    }
  }

  if (collected.length === 0) {
    return { exercises: [], conditionKeys, intensity, request, empty: true };
  }

  // Compounds first, then isolations.
  collected.sort((a, b) => {
    if (a.exercise_type === b.exercise_type) return 0;
    return a.exercise_type === 'compound' ? -1 : 1;
  });

  const prescribed = collected.map((ex) => buildPrescription(ex, ctx));
  const final = applyTechniques(prescribed, request.level);

  return {
    exercises: final,
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

export function replaceExercise(routine, exerciseIndex, exercises, conditionKeys = []) {
  if (!routine || !Array.isArray(routine.exercises)) return null;
  const current = routine.exercises[exerciseIndex];
  if (!current) return null;

  const request = routine.request || normalizeRequest({});
  const avoidTags = getAvoidTags(conditionKeys);
  const intensity = getIntensityModifier(conditionKeys);
  const profile = LEVEL_PROFILE[request.level] || LEVEL_PROFILE.balanced;
  const userLevelOrder = LEVEL_ORDER[
    request.level === 'beginner' ? 'beginner' :
    request.level === 'gym_rat' || request.level === 'advanced' ? 'advanced' :
    'intermediate'
  ];

  const targetMuscle = current._targetMuscle || current.main_muscle || request.muscle;

  const ctx = {
    goal: request.goal,
    levelKey: request.level,
    capLevel: profile.capLevel,
    userLevelOrder,
    equipment: request.equipment,
    avoidTags,
    intensity,
    targetMuscle,
    preferredSubgroup: current.sub_muscle,
  };

  const usedIds = new Set(routine.exercises.map((e) => e.id));
  const pool = (exercises || []).filter(
    (e) => (Array.isArray(e.images) ? e.images.length > 0 : !!e.gif) && !usedIds.has(e.id),
  );
  if (pool.length === 0) return null;

  const scored = pool
    .map((ex) => ({ ex, score: scoreExercise(ex, ctx) }))
    .filter((s) => s.score !== null)
    .sort((a, b) => b.score - a.score);
  if (scored.length === 0) return null;

  const next = scored[0].ex;
  const prescribed = buildPrescription({ ...next, _targetMuscle: targetMuscle }, ctx);

  // Preserve the technique slot.
  prescribed.technique = current.technique || 'straight';
  if (current.supersetWith) prescribed.supersetWith = current.supersetWith;
  if (current.supersetGroup) prescribed.supersetGroup = current.supersetGroup;

  const newExercises = [...routine.exercises];
  newExercises[exerciseIndex] = prescribed;
  return { ...routine, exercises: newExercises, updatedAt: new Date().toISOString() };
}

// =================================================================
// WEEKLY SPLITS
// =================================================================

const SPLITS = {
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
    { id: 'push',  label: { en: 'Push',  es: 'Empuje' },   muscle: 'push' },
    { id: 'pull',  label: { en: 'Pull',  es: 'Tirón' },    muscle: 'pull' },
    { id: 'legs',  label: { en: 'Legs',  es: 'Piernas' },  muscle: 'legs' },
    { id: 'upper', label: { en: 'Upper', es: 'Superior' }, muscle: 'upper' },
    { id: 'lower', label: { en: 'Lower', es: 'Inferior' }, muscle: 'lower' },
  ],
  6: [
    { id: 'push1', label: { en: 'Push A', es: 'Empuje A' }, muscle: 'push' },
    { id: 'pull1', label: { en: 'Pull A', es: 'Tirón A' },  muscle: 'pull' },
    { id: 'legs1', label: { en: 'Legs A', es: 'Piernas A' }, muscle: 'legs' },
    { id: 'push2', label: { en: 'Push B', es: 'Empuje B' }, muscle: 'push' },
    { id: 'pull2', label: { en: 'Pull B', es: 'Tirón B' },  muscle: 'pull' },
    { id: 'legs2', label: { en: 'Legs B', es: 'Piernas B' }, muscle: 'legs' },
  ],
};

const BRO_SPLIT = [
  { id: 'chest',     label: { en: 'Chest',     es: 'Pecho' },    muscle: 'chest' },
  { id: 'back',      label: { en: 'Back',      es: 'Espalda' },  muscle: 'back' },
  { id: 'legs',      label: { en: 'Legs',      es: 'Piernas' },  muscle: 'legs' },
  { id: 'shoulders', label: { en: 'Shoulders', es: 'Hombros' },  muscle: 'shoulders' },
  { id: 'arms',      label: { en: 'Arms',      es: 'Brazos' },   muscle: 'biceps' },
];

export function buildSplit(daysPerWeek, level = 'balanced', goal = 'general') {
  const days = Math.max(2, Math.min(6, Number(daysPerWeek) || 3));
  if (days === 5 && level === 'gym_rat' && goal === 'hypertrophy') {
    return BRO_SPLIT.map((d) => ({ ...d }));
  }
  return (SPLITS[days] || SPLITS[3]).map((d) => ({ ...d }));
}

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
    let dayMuscle = slot.muscle;
    let exerciseCount = request.exerciseCount;

    // Bro-split arms day = biceps + triceps. Use "pull" as broad capture
    // and bump the count so both get worked.
    if (slot.id === 'arms') {
      dayMuscle = 'pull';
      exerciseCount = Math.max(6, request.exerciseCount);
    }

    const dayRequest = { ...request, muscle: dayMuscle, exerciseCount };
    const routine = generateRoutine(dayRequest, exercises, conditionKeys);
    return { id: slot.id, label: slot.label, muscle: slot.muscle, routine };
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
