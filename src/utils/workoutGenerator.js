import { getAvoidTags, getIntensityModifier } from '../data/conditions.js';

const MIN_EXERCISES = 3;
const MAX_EXERCISES = 12;

const DEFAULT_REQUEST = {
  goal: 'general',
  muscles: [],
  muscle: null,
  muscleStatus: null,
  equipment: ['any'],
  time: null,
  level: null,
  condition: '',
  conditionStatus: null,
  exerciseCount: null,
};

const MUSCLE_PRIMARY = {
  chest: ['chest'],
  back: ['lats', 'middle back', 'lower back', 'traps'],
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
  core: ['abdominals'],
  abdominals: ['abdominals'],
  legs: ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors'],
  lower: ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors'],
  upper: ['chest', 'shoulders', 'triceps', 'biceps', 'lats', 'middle back', 'lower back', 'traps'],
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['lats', 'middle back', 'lower back', 'traps', 'biceps', 'forearms'],
  full_body: null,
};

const GROUP_EXPANSIONS = {
  full_body: ['chest', 'back', 'quadriceps', 'hamstrings', 'glutes', 'shoulders', 'core'],
  upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps'],
  lower: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  legs: ['quadriceps', 'hamstrings', 'glutes', 'calves'],
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['back', 'biceps', 'traps'],
};

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

const SECTION_PLANS = {
  chest: ['upper_chest', 'middle_chest', 'lower_chest', 'chest_isolation'],
  back: ['lats', 'middle_back', 'traps', 'lower_back'],
  lats: ['lats', 'middle_back'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstrings'],
  glutes: ['glutes'],
  calves: ['calves'],
  shoulders: ['front_delts', 'side_delts', 'rear_delts'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  core: ['core'],
  traps: ['traps'],
  forearms: ['forearms'],
};

const SECTION_LABELS = {
  upper_chest: { en: 'Upper chest', es: 'Pecho superior' },
  middle_chest: { en: 'Middle chest', es: 'Pecho medio' },
  lower_chest: { en: 'Lower chest', es: 'Pecho inferior' },
  chest_isolation: { en: 'Chest isolation', es: 'Aislamiento de pecho' },

  lats: { en: 'Lats', es: 'Dorsales' },
  middle_back: { en: 'Middle back', es: 'Espalda media' },
  lower_back: { en: 'Lower back', es: 'Espalda baja' },
  traps: { en: 'Traps', es: 'Trapecio' },

  quadriceps: { en: 'Quadriceps', es: 'Cuádriceps' },
  hamstrings: { en: 'Hamstrings', es: 'Femoral / isquios' },
  glutes: { en: 'Glutes', es: 'Glúteos' },
  calves: { en: 'Calves', es: 'Pantorrilla' },

  front_delts: { en: 'Front delts', es: 'Deltoide frontal' },
  side_delts: { en: 'Side delts', es: 'Deltoide lateral' },
  rear_delts: { en: 'Rear delts', es: 'Deltoide posterior' },

  biceps: { en: 'Biceps', es: 'Bíceps' },
  triceps: { en: 'Triceps', es: 'Tríceps' },
  core: { en: 'Core', es: 'Core / abdomen' },
  forearms: { en: 'Forearms', es: 'Antebrazos' },
  general: { en: 'General', es: 'General' },
};

const SCHEMES = {
  strength: { sets: 4, reps: '4-6', rest: 120 },
  hypertrophy: { sets: 4, reps: '8-12', rest: 75 },
  endurance: { sets: 3, reps: '15-20', rest: 45 },
  fatloss: { sets: 3, reps: '12-15', rest: 30 },
  mobility: { sets: 2, reps: '10-12', rest: 30 },
  general: { sets: 3, reps: '10-12', rest: 60 },
};

const ALL_REAL_EQUIPMENT = [
  'none',
  'dumbbells',
  'barbell',
  'bands',
  'kettlebell',
  'exercise_ball',
  'medicine_ball',
  'machines',
];

function clampExerciseCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(MIN_EXERCISES, Math.min(MAX_EXERCISES, Math.round(n)));
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

  const m = repsStr.match(/^(\d+)-(\d+)$/);
  if (!m) return repsStr;

  const lo = Math.max(4, Math.round(parseInt(m[1], 10) * modifier));
  const hi = Math.max(lo + 2, Math.round(parseInt(m[2], 10) * modifier));

  return `${lo}-${hi}`;
}

function unique(arr) {
  return Array.from(new Set((arr || []).filter(Boolean)));
}

function normalizeMuscles(input) {
  const raw = Array.isArray(input) ? input : input ? [input] : [];
  const cleaned = raw.filter(Boolean);

  if (cleaned.length === 0) return ['full_body'];

  const expanded = [];

  for (const item of cleaned) {
    const key = item === 'abdominals' ? 'core' : item;
    const group = GROUP_EXPANSIONS[key];

    if (group) expanded.push(...group);
    else expanded.push(key);
  }

  const result = unique(expanded);

  if (result.length === 0) return ['full_body'];
  if (result.includes('full_body')) return GROUP_EXPANSIONS.full_body;

  return result;
}

function normalizeEquipment(input) {
  const raw = Array.isArray(input) ? input : input ? [input] : ['any'];
  const cleaned = unique(raw);

  if (cleaned.length === 0) return ['any'];
  if (cleaned.includes('any')) return ['any'];

  return cleaned;
}

export function normalizeRequest(request = {}) {
  const rawTime = request.time === '' || request.time === undefined ? null : request.time;
  const parsedTime = rawTime === null ? null : Number(rawTime);
  const safeTime = Number.isFinite(parsedTime)
    ? Math.max(5, Math.min(180, Math.round(parsedTime)))
    : null;

  const hasExplicitMuscleIntent =
    request.muscleStatus === 'selected' ||
    (Array.isArray(request.muscles) && request.muscles.length > 0) ||
    (request.muscle && request.muscle !== 'full_body');

  const muscles = normalizeMuscles(request.muscles || request.muscle);
  const equipment = normalizeEquipment(request.equipment);

  return {
    ...DEFAULT_REQUEST,
    ...request,
    muscles,
    muscle: muscles[0] || 'full_body',
    muscleStatus: hasExplicitMuscleIntent ? 'selected' : request.muscleStatus || null,
    equipment,
    time: safeTime,
    level: request.level || null,
    condition: request.condition || '',
    conditionStatus: request.conditionStatus || null,
    exerciseCount: clampExerciseCount(request.exerciseCount),
  };
}

function equipmentMatches(ex, requestedEquipment) {
  const eq = normalizeEquipment(requestedEquipment);
  if (eq.includes('any')) return true;
  return eq.includes(ex.equipment);
}

function primaryMuscleMatches(ex, requestedMuscle) {
  if (!requestedMuscle || requestedMuscle === 'full_body') return true;

  const allowed = MUSCLE_PRIMARY[requestedMuscle];

  if (!allowed) return true;

  const primary = ex.primaryMuscles || [];

  return primary.some((m) => allowed.includes(m));
}

function matchesAnyRequestedMuscle(ex, req) {
  return req.muscles.some((m) => primaryMuscleMatches(ex, m));
}

function normalizeExerciseKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/\b(with|the|and|or|de|con|sin|a|an|one|two|arm|single|double)\b/g, '')
    .replace(/\b(barbell|dumbbell|cable|machine|smith|band|bands|bodyweight|incline|decline|flat)\b/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function exerciseKey(ex) {
  return normalizeExerciseKey(ex.id || ex.name?.en || ex.name?.es);
}

function isDuplicateExercise(ex, chosen) {
  const key = exerciseKey(ex);
  const id = String(ex.id || '').toLowerCase();

  return chosen.some((c) => {
    const cKey = exerciseKey(c);
    const cId = String(c.id || '').toLowerCase();

    if (id && cId && id === cId) return true;
    if (!key || !cKey) return false;
    if (key === cKey) return true;

    if (key.length >= 8 && cKey.length >= 8) {
      return key.includes(cKey) || cKey.includes(key);
    }

    return false;
  });
}

function isValidExerciseForRequest(ex, req, avoidTags, targetMuscle = null) {
  if (ex.tags?.some((t) => avoidTags.has(t))) return false;
  if (!equipmentMatches(ex, req.equipment)) return false;

  if (targetMuscle) {
    if (!primaryMuscleMatches(ex, targetMuscle)) return false;
  } else if (!matchesAnyRequestedMuscle(ex, req)) {
    return false;
  }

  if (req.goal !== 'mobility' && ex.category === 'stretching') return false;

  return true;
}

function inferMuscleSection(ex, targetMuscle) {
  const name = `${ex.id || ''} ${ex.name?.en || ''}`.toLowerCase();
  const primary = ex.primaryMuscles || [];

  let key = 'general';

  if (targetMuscle === 'chest') {
    if (/incline|upper/.test(name)) key = 'upper_chest';
    else if (/decline|dip|lower/.test(name)) key = 'lower_chest';
    else if (/fly|flies|crossover|cross over|pec deck/.test(name)) key = 'chest_isolation';
    else key = 'middle_chest';
  } else if (targetMuscle === 'back' || targetMuscle === 'lats') {
    if (/lat|pulldown|pullup|pull-up|chin/.test(name) || primary.includes('lats')) key = 'lats';
    else if (/row/.test(name) || primary.includes('middle back')) key = 'middle_back';
    else if (/shrug|trap/.test(name) || primary.includes('traps')) key = 'traps';
    else if (/deadlift|hyperextension|good morning|lower/.test(name) || primary.includes('lower back')) key = 'lower_back';
    else key = 'middle_back';
  } else if (targetMuscle === 'quadriceps') key = 'quadriceps';
  else if (targetMuscle === 'hamstrings') key = 'hamstrings';
  else if (targetMuscle === 'glutes') key = 'glutes';
  else if (targetMuscle === 'calves') key = 'calves';
  else if (targetMuscle === 'biceps') key = 'biceps';
  else if (targetMuscle === 'triceps') key = 'triceps';
  else if (targetMuscle === 'traps') key = 'traps';
  else if (targetMuscle === 'forearms') key = 'forearms';
  else if (targetMuscle === 'core' || targetMuscle === 'abdominals') key = 'core';
  else if (targetMuscle === 'shoulders') {
    if (/rear|reverse|face pull/.test(name)) key = 'rear_delts';
    else if (/side|lateral/.test(name)) key = 'side_delts';
    else key = 'front_delts';
  }

  return {
    key,
    label: SECTION_LABELS[key] || SECTION_LABELS.general,
  };
}

function scoreExercise(ex, req, avoidTags, targetMuscle = null, preferredSection = null) {
  if (!isValidExerciseForRequest(ex, req, avoidTags, targetMuscle)) return null;

  let score = 0;

  if (targetMuscle) {
    score += 30;
    if (primaryMuscleMatches(ex, targetMuscle)) score += 20;
  }

  if (req.level) {
    const order = { beginner: 1, intermediate: 2, advanced: 3 };
    const exLvl = order[ex.level] || 2;
    const reqLvl = order[req.level] || 2;

    if (exLvl === reqLvl) score += 4;
    else if (exLvl < reqLvl) score += 2;
    else score -= 3;
  }

  if (equipmentMatches(ex, req.equipment)) score += 4;

  const section = inferMuscleSection(ex, targetMuscle).key;

  if (preferredSection && section === preferredSection) score += 18;

  score += Math.random() * 0.5;

  return score;
}

function allocateCounts(muscles, total) {
  const targets = unique(muscles);

  if (targets.length === 0) return [];
  if (targets.length === 1) return [{ muscle: targets[0], count: total }];

  const sorted = targets
    .map((muscle) => ({ muscle, weight: MUSCLE_WEIGHTS[muscle] || 2 }))
    .sort((a, b) => b.weight - a.weight);

  const totalWeight = sorted.reduce((s, m) => s + m.weight, 0);
  let remaining = total;

  const allocations = sorted.map((item) => {
    const exact = (item.weight / totalWeight) * total;
    const base = Math.max(1, Math.floor(exact));
    remaining -= base;

    return {
      muscle: item.muscle,
      count: base,
      fraction: exact - Math.floor(exact),
      weight: item.weight,
    };
  });

  while (remaining > 0) {
    allocations.sort((a, b) => b.fraction - a.fraction || b.weight - a.weight);
    allocations[0].count += 1;
    allocations[0].fraction = 0;
    remaining -= 1;
  }

  while (allocations.reduce((s, a) => s + a.count, 0) > total) {
    const removable = allocations
      .filter((a) => a.count > 1)
      .sort((a, b) => a.weight - b.weight)[0];

    if (!removable) break;

    removable.count -= 1;
  }

  return allocations.map(({ muscle, count }) => ({ muscle, count }));
}

function sectionSequenceFor(muscle, count) {
  const plan = SECTION_PLANS[muscle] || [muscle];
  const sequence = [];

  for (let i = 0; i < count; i++) {
    sequence.push(plan[i % plan.length]);
  }

  return sequence;
}

function chooseBestExercise(scored, req, avoidTags, chosen, targetMuscle, preferredSection) {
  const ranked = scored
    .map(({ ex }) => ({
      ex,
      score: scoreExercise(ex, req, avoidTags, targetMuscle, preferredSection),
    }))
    .filter((item) => item.score !== null && !isDuplicateExercise(item.ex, chosen))
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.ex || null;
}

function buildPrescription(ex, req, intensity, targetMuscle, sectionOverride = null) {
  const scheme = SCHEMES[req.goal] || SCHEMES.general;
  const section = sectionOverride || inferMuscleSection(ex, targetMuscle);

  return {
    ...ex,
    targetMuscle,
    muscleSection: section,
    sets: Math.max(2, Math.round(scheme.sets * (intensity < 1 ? 0.85 : 1))),
    reps: adjustReps(scheme.reps, intensity),
    rest: scheme.rest,
  };
}

export function generateRoutine(request, exercises, conditionKeys = []) {
  const req = normalizeRequest(request);
  const avoidTags = getAvoidTags(conditionKeys);
  const intensity = getIntensityModifier(conditionKeys);

  const pool = exercises.filter((e) =>
    Array.isArray(e.images) ? e.images.length > 0 : !!e.gif,
  );

  const baseScored = pool
    .map((ex) => ({ ex, score: scoreExercise(ex, req, avoidTags) }))
    .filter((s) => s.score !== null)
    .sort((a, b) => b.score - a.score);

  if (baseScored.length === 0) {
    return { exercises: [], conditionKeys, intensity, empty: true, request: req };
  }

  const desiredCount = req.exerciseCount || exerciseCountForTime(req.time || 30);
  const targetCount = Math.min(desiredCount, MAX_EXERCISES);

  const allocations = allocateCounts(req.muscles, targetCount);
  const chosen = [];

  for (const allocation of allocations) {
    const sections = sectionSequenceFor(allocation.muscle, allocation.count);

    for (const sectionKey of sections) {
      let selected = chooseBestExercise(
        baseScored,
        req,
        avoidTags,
        chosen,
        allocation.muscle,
        sectionKey,
      );

      if (!selected) {
        selected = chooseBestExercise(baseScored, req, avoidTags, chosen, allocation.muscle, null);
      }

      if (!selected) continue;

      const section = inferMuscleSection(selected, allocation.muscle);

      chosen.push(buildPrescription(selected, req, intensity, allocation.muscle, section));
    }
  }

  if (chosen.length === 0) {
    return { exercises: [], conditionKeys, intensity, empty: true, request: req };
  }

  return {
    exercises: chosen,
    conditionKeys,
    intensity,
    request: req,
    requestedCount: req.exerciseCount || null,
    availableMatches: baseScored.length,
    createdAt: new Date().toISOString(),
    empty: false,
  };
}

function addIfMatch(list, t, re, value) {
  if (re.test(t) && !list.includes(value)) list.push(value);
}

function hasNegatedEquipment(t, keywordPattern) {
  const re = new RegExp(
    `(?:no tengo|no hay|sin|excepto|menos|salvo|máquinas no|maquinas no|no máquinas|no maquinas|todo excepto|todas menos|todos menos|lo unico que no tengo|lo único que no tengo)[^.!?,;]{0,60}${keywordPattern}`,
    'i',
  );

  return re.test(t);
}

function addEquipmentIfMentioned(list, t, keywordPattern, value) {
  const re = new RegExp(keywordPattern, 'i');

  if (!re.test(t)) return;
  if (hasNegatedEquipment(t, keywordPattern)) return;

  if (!list.includes(value)) list.push(value);
}

function parseEquipmentFromText(t) {
  const equipment = [];

  const saysAllExceptMachines =
    /\b(todo|todos|todas|tengo todo|tengo todos|tengo todas)\b/.test(t) &&
    /\b(excepto|menos|salvo)\b/.test(t) &&
    /\b(machines?|m[aá]quinas?|maquinas?|gym|gimnasio|polea|cable|cables)\b/.test(t);

  const saysOnlyMissingMachines =
    /\blo [uú]nico que no tengo\b/.test(t) &&
    /\b(machines?|m[aá]quinas?|maquinas?|gym|gimnasio|polea|cable|cables)\b/.test(t);

  const saysMachinesNo =
    /\b(m[aá]quinas?|maquinas?|machines?|gym|gimnasio|polea|cable|cables)\s+no\b/.test(t) ||
    /\bno\s+(m[aá]quinas?|maquinas?|machines?|gym|gimnasio|polea|cable|cables)\b/.test(t);

  if (saysAllExceptMachines || saysOnlyMissingMachines || saysMachinesNo) {
    return ALL_REAL_EQUIPMENT.filter((item) => item !== 'machines');
  }

  if (
    /\b(no equipment|sin equipo|sin material|bodyweight|peso corporal|sin pesas|sin gym|sin gimnasio|en casa|at home|home workout|casa)\b/.test(
      t,
    )
  ) {
    equipment.push('none');
  }

  addEquipmentIfMentioned(
    equipment,
    t,
    '\\b(dumbbell|dumbbells|mancuernas?|pesas? de mano)\\b',
    'dumbbells',
  );

  addEquipmentIfMentioned(
    equipment,
    t,
    '\\b(barbell|barra ol[ií]mpica|con barra)\\b',
    'barbell',
  );

  addEquipmentIfMentioned(
    equipment,
    t,
    '\\b(bands?|bandas?|elasticos?|el[aá]sticas?|tubular)\\b',
    'bands',
  );

  addEquipmentIfMentioned(
    equipment,
    t,
    '\\b(kettlebell|pesa rusa|kettle)\\b',
    'kettlebell',
  );

  addEquipmentIfMentioned(
    equipment,
    t,
    '\\b(pelota de ejercicio|pelota|exercise ball|swiss ball|stability ball)\\b',
    'exercise_ball',
  );

  addEquipmentIfMentioned(
    equipment,
    t,
    '\\b(bal[oó]n medicinal|medicine ball)\\b',
    'medicine_ball',
  );

  addEquipmentIfMentioned(
    equipment,
    t,
    '\\b(machines?|m[aá]quinas?|maquinas?|gym|gimnasio|polea|cable|cables)\\b',
    'machines',
  );

  return unique(equipment);
}

function parseConditionStatusFromText(t) {
  if (
    /\b(sin lesiones|sin lesi[oó]n|sin dolor|no injuries|no injury|no pain|no medical condition|sin condici[oó]n médica|ninguna lesi[oó]n|ning[uú]n dolor|ninguna|nada|no)\b/.test(
      t,
    )
  ) {
    return 'none';
  }

  if (
    /\b(dolor|lesi[oó]n|lesion|rodilla|espalda|hombro|embaraz|pregnan|pain|injur|knee|back pain|shoulder pain|shoulder injury)\b/.test(
      t,
    )
  ) {
    return 'described';
  }

  return null;
}

export function parseRequestText(text) {
  const t = (text || '').toLowerCase();
  const muscles = [];
  const equipment = [];

  const req = {
    ...DEFAULT_REQUEST,
    muscles,
    equipment,
    condition: text || '',
  };

  const countMatch = t.match(
    /(?:dame|quiero|hazme|genera|generate|give me|build me|make me)?\s*(\d{1,2})\s*(?:ejercicios?|exercises?|movimientos?|moves?)\b/,
  );

  if (countMatch) req.exerciseCount = clampExerciseCount(countMatch[1]);

  if (/\b(strength|fuerza)\b/.test(t)) req.goal = 'strength';
  else if (/\b(hypertrophy|muscle|hipertrofia|m[uú]sculo|masa|crecer|volumen)\b/.test(t)) {
    req.goal = 'hypertrophy';
  } else if (/\b(endurance|cardio|resistencia|aer[oó]bico)\b/.test(t)) {
    req.goal = 'endurance';
  } else if (/\b(fat ?loss|weight ?loss|adelgaza|grasa|perder peso|definici[oó]n|quemar)\b/.test(t)) {
    req.goal = 'fatloss';
  } else if (/\b(mobility|stretch|movilidad|estirar|flexibilidad|elasticidad)\b/.test(t)) {
    req.goal = 'mobility';
  }

  addIfMatch(muscles, t, /\b(pecho|chest|pectorales?|pecs)\b/, 'chest');
  addIfMatch(muscles, t, /\b(espalda|back)\b/, 'back');
  addIfMatch(muscles, t, /\b(dorsales?|lats?|lat)\b/, 'lats');
  addIfMatch(muscles, t, /\b(hombros?|shoulders?|delto[ií]des?|deltoid)\b/, 'shoulders');
  addIfMatch(muscles, t, /\b(b[ií]ceps|biceps|bicep)\b/, 'biceps');
  addIfMatch(muscles, t, /\b(tr[ií]ceps|triceps)\b/, 'triceps');
  addIfMatch(muscles, t, /\b(trapecio|trapezius|traps?|trapecios)\b/, 'traps');
  addIfMatch(muscles, t, /\b(antebrazos?|forearms?)\b/, 'forearms');
  addIfMatch(muscles, t, /\b(cu[aá]driceps|quadriceps|quads?|cuads?)\b/, 'quadriceps');
  addIfMatch(muscles, t, /\b(isquios?|hamstrings?|isquiotibiales?|f[ée]moral)\b/, 'hamstrings');
  addIfMatch(muscles, t, /\b(gl[uú]teos?|glutes?|nalgas?|cola|booty)\b/, 'glutes');
  addIfMatch(muscles, t, /\b(pantorrillas?|gemelos?|calves?|s[oó]leo)\b/, 'calves');
  addIfMatch(muscles, t, /\b(core|abdomen|abs|abdominales?|abdominal)\b/, 'core');

  addIfMatch(muscles, t, /\b(pierna completa|piernas?|legs|tren inferior|lower body|parte inferior)\b/, 'legs');
  addIfMatch(muscles, t, /\b(tren superior|upper body|parte superior|torso superior)\b/, 'upper');
  addIfMatch(muscles, t, /\b(empuj[eo]|push|empujar)\b/, 'push');
  addIfMatch(muscles, t, /\b(tir[oó]n|pull|tirar|jalar)\b/, 'pull');
  addIfMatch(muscles, t, /\b(full[- ]?body|cuerpo completo|todo el cuerpo|cuerpo entero)\b/, 'full_body');

  equipment.push(...parseEquipmentFromText(t));

  const minMatch = t.match(/(\d{1,3})\s*(min|minute|minuto)/);

  if (minMatch) {
    req.time = parseInt(minMatch[1], 10);
  } else {
    const hourMatch = t.match(/(\d+(?:\.\d+)?)\s*(hour|hora|hr)/);

    if (hourMatch) req.time = Math.round(parseFloat(hourMatch[1]) * 60);
    else if (/\b(quick|r[aá]pid|short|corto|breve)\b/.test(t)) req.time = 15;
    else if (/\b(long|largo|extenso|completo)\b/.test(t)) req.time = 60;
  }

  if (/\b(beginner|principiante|nuevo|novato|empezando|baja intensidad|suave)\b/.test(t)) {
    req.level = 'beginner';
  } else if (/\b(intermediate|intermedio|medio|moderado|media intensidad)\b/.test(t)) {
    req.level = 'intermediate';
  } else if (/\b(advanced|avanzado|experto|atleta|alta intensidad|intenso)\b/.test(t)) {
    req.level = 'advanced';
  }

  const conditionStatus = parseConditionStatusFromText(t);

  if (conditionStatus) {
    req.conditionStatus = conditionStatus;
  }

  req.muscles = muscles.length ? unique(muscles) : [];
  req.muscle = req.muscles[0] || null;
  req.muscleStatus = muscles.length ? 'selected' : null;
  req.equipment = equipment.length ? unique(equipment) : ['any'];

  return req;
}

export function mergeRequestDraft(previous = {}, next = {}) {
  const prev = normalizeRequest(previous);
  const parsedNext = normalizeRequest(next);

  const nextHasSpecificMuscles = parsedNext.muscleStatus === 'selected';
  const nextHasSpecificEquipment = !parsedNext.equipment.includes('any');

  return normalizeRequest({
    ...prev,
    goal: parsedNext.goal && parsedNext.goal !== 'general' ? parsedNext.goal : prev.goal,
    muscles: nextHasSpecificMuscles ? parsedNext.muscles : prev.muscles,
    muscle: nextHasSpecificMuscles ? parsedNext.muscles[0] : prev.muscle,
    muscleStatus: nextHasSpecificMuscles ? 'selected' : prev.muscleStatus,
    equipment: nextHasSpecificEquipment ? parsedNext.equipment : prev.equipment,
    time: parsedNext.time ?? prev.time,
    level: parsedNext.level ?? prev.level,
    exerciseCount: parsedNext.exerciseCount ?? prev.exerciseCount,
    conditionStatus: parsedNext.conditionStatus ?? prev.conditionStatus,
    condition: [prev.condition, next.condition].filter(Boolean).join(' '),
  });
}

export function applyAnswerToClarifyingField(previous, parsed, field, rawText = '') {
  const next = { ...parsed };

  if (field === 'condition') {
    if (
      /\b(no|nada|ninguna|sin lesiones|sin lesi[oó]n|sin dolor|no pain|no injury|no injuries|ninguna lesi[oó]n|ning[uú]n dolor)\b/i.test(
        rawText,
      )
    ) {
      next.conditionStatus = 'none';
      next.condition = '';
    } else {
      next.conditionStatus = 'described';
      next.condition = rawText;
    }
  }

  return mergeRequestDraft(previous, next);
}

export function getNextClarifyingField(request = {}) {
  const req = normalizeRequest(request);

  if (!req.muscleStatus) return 'muscles';
  if (!req.time && !req.exerciseCount) return 'time';
  if (!req.level) return 'level';
  if (!req.goal || req.goal === 'general') return 'goal';
  if (!req.equipment || req.equipment.includes('any')) return 'equipment';
  if (!req.conditionStatus) return 'condition';

  return null;
}

export function buildClarifyingQuestion(request = {}, lang = 'en', field = null) {
  const next = field || getNextClarifyingField(request);

  const questions = {
    es: {
      muscles: '¿Qué grupo muscular quieres trabajar? Puedes elegir uno o varios.',
      time: '¿Cuántos ejercicios quieres o cuánto tiempo tienes disponible?',
      level: '¿Qué nivel de intensidad buscas?',
      goal: '¿Cuál es tu objetivo principal?',
      equipment: '¿Qué equipo tienes disponible? Selecciona uno o varios.',
      condition: '¿Tienes alguna lesión o condición médica que deba tomar en cuenta?',
    },
    en: {
      muscles: 'What muscle group do you want to train? You can choose one or several.',
      time: 'How many exercises do you want or how much time do you have?',
      level: 'What intensity level are you looking for?',
      goal: 'What is your main goal?',
      equipment: 'What equipment do you have available? Select one or several.',
      condition: 'Do you have any injury or medical condition I should consider?',
    },
  };

  return questions[lang]?.[next] || questions.en[next] || null;
}

export function replaceExerciseInRoutine(routine, index, exercises) {
  if (!routine || !Array.isArray(routine.exercises)) return null;

  const current = routine.exercises[index];

  if (!current) return null;

  const req = normalizeRequest(routine.request);
  const avoidTags = getAvoidTags(routine.conditionKeys || []);
  const intensity = getIntensityModifier(routine.conditionKeys || []);
  const targetMuscle = current.targetMuscle || req.muscles[0];
  const wantedSection = current.muscleSection?.key || inferMuscleSection(current, targetMuscle).key;

  const used = routine.exercises.filter((_, i) => i !== index);

  const pool = exercises.filter((e) =>
    Array.isArray(e.images) ? e.images.length > 0 : !!e.gif,
  );

  const rankedSameSection = pool
    .map((ex) => ({
      ex,
      score: scoreExercise(ex, req, avoidTags, targetMuscle, wantedSection),
    }))
    .filter(({ ex, score }) => score !== null && !isDuplicateExercise(ex, used) && ex.id !== current.id)
    .sort((a, b) => b.score - a.score);

  let replacement = rankedSameSection[0]?.ex || null;

  if (!replacement) {
    const rankedAnySection = pool
      .map((ex) => ({
        ex,
        score: scoreExercise(ex, req, avoidTags, targetMuscle, null),
      }))
      .filter(({ ex, score }) => score !== null && !isDuplicateExercise(ex, used) && ex.id !== current.id)
      .sort((a, b) => b.score - a.score);

    replacement = rankedAnySection[0]?.ex || null;
  }

  if (!replacement) return null;

  const nextExercises = [...routine.exercises];

  nextExercises[index] = {
    ...buildPrescription(replacement, req, intensity, targetMuscle),
    sets: current.sets,
    reps: current.reps,
    rest: current.rest,
  };

  return {
    ...routine,
    exercises: nextExercises,
  };
}

export function youtubeSearchUrl(exerciseName, lang = 'en') {
  const prefix = lang === 'es' ? 'cómo hacer ' : 'how to do ';
  const q = encodeURIComponent(`${prefix}${exerciseName}`);

  return `https://www.youtube.com/results?search_query=${q}`;
}
