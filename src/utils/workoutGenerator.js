// Rule-based workout generator. NO AI yet — this is intentional and explicit.
// Inputs: a structured request + a list of exercises + the user's detected conditions.
// Output: a routine object the UI renders directly.

import { getAvoidTags, getIntensityModifier } from '../data/conditions.js';

const MIN_EXERCISES = 3;
const MAX_EXERCISES = 12;

const DEFAULT_REQUEST = {
  goal: 'general',
  muscle: 'full_body',
  equipment: 'any',
  time: null,
  level: null,
  condition: '',
  exerciseCount: null,
};

const MUSCLE_PRIMARY = {
  chest: ['chest'],
  biceps: ['biceps'],
  triceps: ['triceps'],
  shoulders: ['shoulders'],
  traps: ['traps'],
  forearms: ['forearms'],
  lats: ['lats', 'middle back', 'lower back'],
  back: ['lats', 'middle back', 'lower back', 'traps'],
  quadriceps: ['quadriceps'],
  hamstrings: ['hamstrings'],
  calves: ['calves'],
  glutes: ['glutes'],
  core: ['abdominals'],
  abdominals: ['abdominals'],
  legs: ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors'],
  lower: ['quadriceps', 'hamstrings', 'calves', 'glutes', 'adductors', 'abductors'],
  upper: [
    'chest',
    'shoulders',
    'triceps',
    'biceps',
    'lats',
    'middle back',
    'lower back',
    'traps',
    'forearms',
  ],
  push: ['chest', 'shoulders', 'triceps'],
  pull: ['biceps', 'lats', 'middle back', 'lower back', 'traps', 'forearms'],
  full_body: null,
};

function exerciseCountForTime(minutes) {
  if (!minutes || minutes < 10) return 3;
  if (minutes <= 20) return 4;
  if (minutes <= 35) return 5;
  if (minutes <= 50) return 6;
  if (minutes <= 75) return 7;
  if (minutes <= 100) return 8;
  return 9;
}

function clampExerciseCount(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return Math.max(MIN_EXERCISES, Math.min(MAX_EXERCISES, Math.round(n)));
}

const SCHEMES = {
  strength: { sets: 4, reps: '4-6', rest: 120 },
  hypertrophy: { sets: 4, reps: '8-12', rest: 75 },
  endurance: { sets: 3, reps: '15-20', rest: 45 },
  fatloss: { sets: 3, reps: '12-15', rest: 30 },
  mobility: { sets: 2, reps: '10-12', rest: 30 },
  general: { sets: 3, reps: '10-12', rest: 60 },
};

function adjustReps(repsStr, modifier) {
  if (modifier >= 1) return repsStr;
  const m = repsStr.match(/^(\d+)-(\d+)$/);
  if (!m) return repsStr;
  const lo = Math.max(4, Math.round(parseInt(m[1], 10) * modifier));
  const hi = Math.max(lo + 2, Math.round(parseInt(m[2], 10) * modifier));
  return `${lo}-${hi}`;
}

function normalizeRequest(request = {}) {
  const rawTime = request.time === '' || request.time === undefined ? null : request.time;
  const parsedTime = rawTime === null ? null : Number(rawTime);
  const safeTime = Number.isFinite(parsedTime)
    ? Math.max(5, Math.min(180, Math.round(parsedTime)))
    : null;

  return {
    ...DEFAULT_REQUEST,
    ...request,
    time: safeTime,
    level: request.level || null,
    condition: request.condition || '',
    exerciseCount: clampExerciseCount(request.exerciseCount),
  };
}

function primaryMuscleMatches(ex, requestedMuscle) {
  if (!requestedMuscle || requestedMuscle === 'full_body') return true;
  const allowed = MUSCLE_PRIMARY[requestedMuscle];
  if (!allowed) return true;
  const primary = ex.primaryMuscles || [];
  return primary.some((m) => allowed.includes(m));
}

function muscleTagsMatch(ex, requestedMuscle) {
  if (!requestedMuscle || requestedMuscle === 'full_body') return true;
  const muscles = ex.muscle || [];
  if (muscles.includes(requestedMuscle)) return true;
  const allowed = MUSCLE_PRIMARY[requestedMuscle] || [];
  return muscles.some((m) => allowed.includes(m));
}

function equipmentMatches(ex, requestedEquipment) {
  if (!requestedEquipment || requestedEquipment === 'any') return true;
  return ex.equipment === requestedEquipment;
}

function normalizeExerciseKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(
      /\b(with|the|and|or|de|con|sin|a|an|one|two|arm|single|double)\b/g,
      '',
    )
    .replace(
      /\b(barbell|dumbbell|cable|machine|smith|band|bands|bodyweight|incline|decline|flat)\b/g,
      '',
    )
    .replace(/[^a-z0-9]/g, '');
}

function exerciseKey(ex) {
  return normalizeExerciseKey(ex.id || ex.name?.en || ex.name?.es);
}

function isDuplicateExercise(ex, chosen) {
  const key = exerciseKey(ex);
  const id = String(ex.id || '').toLowerCase();

  if (!key && !id) return false;

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

function isValidExerciseForRequest(ex, req, avoidTags) {
  if (ex.tags?.some((t) => avoidTags.has(t))) return false;

  // Strict equipment filter. If user says dumbbells, machines are not invited.
  if (!equipmentMatches(ex, req.equipment)) return false;

  // Strict muscle filter. For chest, primary muscle must be chest.
  // No more sled push in chest day. Civilization advances.
  if (req.muscle && req.muscle !== 'full_body') {
    if (!muscleTagsMatch(ex, req.muscle)) return false;
    if (!primaryMuscleMatches(ex, req.muscle)) return false;
  }

  // Do not sneak stretching into strength/hypertrophy routines.
  if (req.goal !== 'mobility' && ex.category === 'stretching') return false;

  return true;
}

function scoreExercise(ex, req, avoidTags) {
  if (!isValidExerciseForRequest(ex, req, avoidTags)) return null;

  let score = 0;

  if (req.muscle && req.muscle !== 'full_body') {
    score += 20;
    if (primaryMuscleMatches(ex, req.muscle)) score += 12;
  } else {
    score += 5;
  }

  if (req.level) {
    const order = { beginner: 1, intermediate: 2, advanced: 3 };
    const exLvl = order[ex.level] || 2;
    const reqLvl = order[req.level] || 2;

    if (exLvl === reqLvl) score += 4;
    else if (exLvl < reqLvl) score += 2;
    else score -= 3;
  }

  if (ex.equipment === req.equipment) score += 4;
  if (ex.category === 'stretching' && req.goal !== 'mobility') score -= 8;

  score += Math.random() * 0.5;

  return score;
}

export function generateRoutine(request, exercises, conditionKeys = []) {
  const req = normalizeRequest(request);
  const avoidTags = getAvoidTags(conditionKeys);
  const intensity = getIntensityModifier(conditionKeys);

  const pool = exercises.filter((e) =>
    Array.isArray(e.images) ? e.images.length > 0 : !!e.gif,
  );

  const scored = pool
    .map((ex) => ({ ex, score: scoreExercise(ex, req, avoidTags) }))
    .filter((s) => s.score !== null)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { exercises: [], conditionKeys, intensity, empty: true, request: req };
  }

  const countFromTime = exerciseCountForTime(req.time || 30);
  const desiredCount = req.exerciseCount || countFromTime;
  const targetCount = Math.min(desiredCount, scored.length, MAX_EXERCISES);

  const chosen = [];
  const muscleHits = {};

  for (const { ex } of scored) {
    if (chosen.length >= targetCount) break;
    if (isDuplicateExercise(ex, chosen)) continue;

    const primary = (ex.primaryMuscles && ex.primaryMuscles[0]) || (ex.muscle && ex.muscle[0]);

    if (primary) {
      muscleHits[primary] = (muscleHits[primary] || 0) + 1;

      // For full body, avoid 5 chest exercises pretending to be balance.
      if (req.muscle === 'full_body' && muscleHits[primary] > 2) continue;
    }

    chosen.push(ex);
  }

  // Refill only with valid non-duplicates. Never use unrelated junk as filler.
  if (chosen.length < targetCount) {
    for (const { ex } of scored) {
      if (chosen.length >= targetCount) break;
      if (isDuplicateExercise(ex, chosen)) continue;
      if (!chosen.includes(ex)) chosen.push(ex);
    }
  }

  const validated = chosen.filter((ex) => isValidExerciseForRequest(ex, req, avoidTags));

  if (validated.length === 0) {
    return { exercises: [], conditionKeys, intensity, empty: true, request: req };
  }

  const scheme = SCHEMES[req.goal] || SCHEMES.general;

  const prescribed = validated.map((ex) => ({
    ...ex,
    sets: Math.max(2, Math.round(scheme.sets * (intensity < 1 ? 0.85 : 1))),
    reps: adjustReps(scheme.reps, intensity),
    rest: scheme.rest,
  }));

  return {
    exercises: prescribed,
    conditionKeys,
    intensity,
    request: req,
    requestedCount: req.exerciseCount || null,
    availableMatches: scored.length,
    createdAt: new Date().toISOString(),
    empty: false,
  };
}

export function parseRequestText(text) {
  const t = (text || '').toLowerCase();
  const req = { ...DEFAULT_REQUEST, condition: text || '' };

  const countMatch = t.match(
    /(?:dame|quiero|hazme|genera|generate|give me|build me|make me)?\s*(\d{1,2})\s*(?:ejercicios?|exercises?|movimientos?|moves?)\b/,
  );

  if (countMatch) {
    req.exerciseCount = clampExerciseCount(countMatch[1]);
  }

  if (/\b(strength|fuerza)\b/.test(t)) req.goal = 'strength';
  else if (/\b(hypertrophy|muscle|hipertrofia|m[uú]sculo|masa|crecer|volumen)\b/.test(t)) {
    req.goal = 'hypertrophy';
  } else if (/\b(endurance|cardio|resistencia|aer[oó]bico)\b/.test(t)) {
    req.goal = 'endurance';
  } else if (
    /\b(fat ?loss|weight ?loss|adelgaza|grasa|perder peso|definici[oó]n|quemar)\b/.test(t)
  ) {
    req.goal = 'fatloss';
  } else if (/\b(mobility|stretch|movilidad|estirar|flexibilidad|elasticidad)\b/.test(t)) {
    req.goal = 'mobility';
  }

  const m = (re, val) => {
    if (re.test(t) && req.muscle === 'full_body') req.muscle = val;
  };

  m(/\b(trapecio|trapezius|traps?|trapecios)\b/, 'traps');
  m(/\b(b[ií]ceps|biceps|bicep)\b/, 'biceps');
  m(/\b(tr[ií]ceps|triceps)\b/, 'triceps');
  m(/\b(hombros?|shoulders?|delto[ií]des?|deltoid)\b/, 'shoulders');
  m(/\b(pecho|chest|pectorales?|pecs)\b/, 'chest');
  m(/\b(espalda|back|dorsales?|lats?|lat)\b/, 'lats');
  m(/\b(cu[aá]driceps|quadriceps|quads?|cuads?)\b/, 'quadriceps');
  m(/\b(isquios?|hamstrings?|isquiotibiales?|f[ée]moral)\b/, 'hamstrings');
  m(/\b(pantorrillas?|gemelos?|calves?|s[oó]leo)\b/, 'calves');
  m(/\b(antebrazos?|forearms?)\b/, 'forearms');

  m(/\b(tren superior|upper body|parte superior|torso superior)\b/, 'upper');
  m(/\b(tren inferior|lower body|parte inferior|piernas y gl[uú]teos)\b/, 'lower');
  m(/\b(core|abdomen|abs|abdominales?|abdominal)\b/, 'core');
  m(/\b(empuj[eo]|push|empujar)\b/, 'push');
  m(/\b(tir[oó]n|pull|tirar|jalar)\b/, 'pull');
  m(/\b(piernas?|legs)\b/, 'legs');
  m(/\b(gl[uú]teos?|glutes?|nalgas?|cola|booty)\b/, 'glutes');
  m(/\b(full[- ]?body|cuerpo completo|todo el cuerpo|cuerpo entero)\b/, 'full_body');

  if (
    /\b(no equipment|sin equipo|sin material|bodyweight|peso corporal|sin pesas|sin m[aá]quinas?|sin gym|sin gimnasio)\b/.test(
      t,
    )
  ) {
    req.equipment = 'none';
  } else if (/\b(dumbbell|dumbbells|mancuernas?|pesas? de mano)\b/.test(t)) {
    req.equipment = 'dumbbells';
  } else if (/\b(barbell|barra ol[ií]mpica|con barra)\b/.test(t)) {
    req.equipment = 'barbell';
  } else if (/\b(bands?|bandas?|elasticos?|el[aá]sticas?|tubular)\b/.test(t)) {
    req.equipment = 'bands';
  } else if (/\b(kettlebell|pesa rusa|kettle)\b/.test(t)) {
    req.equipment = 'kettlebell';
  } else if (/\b(machines?|m[aá]quinas?|gym|gimnasio|polea|cable|cables)\b/.test(t)) {
    req.equipment = 'machines';
  } else if (/\b(en casa|at home|home workout|casa)\b/.test(t)) {
    req.equipment = 'none';
  }

  const minMatch = t.match(/(\d{1,3})\s*(min|minute|minuto)/);

  if (minMatch) {
    req.time = parseInt(minMatch[1], 10);
  } else {
    const hourMatch = t.match(/(\d+(?:\.\d+)?)\s*(hour|hora|hr)/);

    if (hourMatch) {
      req.time = Math.round(parseFloat(hourMatch[1]) * 60);
    } else if (/\b(quick|r[aá]pid|short|corto|breve)\b/.test(t)) {
      req.time = 15;
    } else if (/\b(long|largo|extenso|completo)\b/.test(t)) {
      req.time = 60;
    }
  }

  if (req.time !== null) {
    if (req.time < 5) req.time = 5;
    if (req.time > 180) req.time = 180;
  }

  if (/\b(beginner|principiante|nuevo|novato|empezando)\b/.test(t)) {
    req.level = 'beginner';
  } else if (/\b(intermediate|intermedio|medio)\b/.test(t)) {
    req.level = 'intermediate';
  } else if (/\b(advanced|avanzado|experto|atleta)\b/.test(t)) {
    req.level = 'advanced';
  }

  return req;
}

export function getMissingRequestFields(req = {}) {
  const missing = [];

  if (!req.goal || req.goal === 'general') missing.push('goal');
  if (!req.time && !req.exerciseCount) missing.push('time');
  if (!req.equipment || req.equipment === 'any') missing.push('equipment');
  if (!req.level) missing.push('level');

  return missing;
}

export function buildClarifyingQuestion(req = {}, lang = 'en') {
  const missing = getMissingRequestFields(req);

  if (missing.length === 0) return null;

  if (lang === 'es') {
    const parts = [];

    if (missing.includes('goal')) {
      parts.push('objetivo: fuerza, hipertrofia, resistencia, grasa o movilidad');
    }

    if (missing.includes('time')) {
      parts.push('tiempo disponible o número de ejercicios');
    }

    if (missing.includes('equipment')) {
      parts.push('equipo disponible');
    }

    if (missing.includes('level')) {
      parts.push('nivel: principiante, intermedio o avanzado');
    }

    return `Para armarla bien necesito: ${parts.join(
      '; ',
    )}. También dime si tienes lesión o condición médica. Ejemplo: “hipertrofia, 45 min, mancuernas, intermedio, sin lesiones”.`;
  }

  const parts = [];

  if (missing.includes('goal')) {
    parts.push('goal: strength, hypertrophy, endurance, fat loss, or mobility');
  }

  if (missing.includes('time')) {
    parts.push('time available or number of exercises');
  }

  if (missing.includes('equipment')) {
    parts.push('available equipment');
  }

  if (missing.includes('level')) {
    parts.push('level: beginner, intermediate, or advanced');
  }

  return `To build it properly I need: ${parts.join(
    '; ',
  )}. Also mention any injury or medical condition. Example: “hypertrophy, 45 min, dumbbells, intermediate, no injuries”.`;
}

export function mergeRequestDraft(previous = {}, next = {}) {
  return {
    ...DEFAULT_REQUEST,
    ...previous,
    goal: next.goal && next.goal !== 'general' ? next.goal : previous.goal || 'general',
    muscle: next.muscle && next.muscle !== 'full_body' ? next.muscle : previous.muscle || 'full_body',
    equipment: next.equipment && next.equipment !== 'any' ? next.equipment : previous.equipment || 'any',
    time: next.time ?? previous.time ?? null,
    level: next.level ?? previous.level ?? null,
    exerciseCount: next.exerciseCount ?? previous.exerciseCount ?? null,
    condition: [previous.condition, next.condition].filter(Boolean).join(' '),
  };
}

export function youtubeSearchUrl(exerciseName, lang = 'en') {
  const prefix = lang === 'es' ? 'cómo hacer ' : 'how to do ';
  const q = encodeURIComponent(`${prefix}${exerciseName}`);
  return `https://www.youtube.com/results?search_query=${q}`;
}
