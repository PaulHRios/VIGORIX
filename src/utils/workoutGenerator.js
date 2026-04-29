// Rule-based workout generator. NO AI yet — this is intentional and explicit.
// Inputs: a structured request + a list of exercises + the user's detected conditions.
// Output: a routine object the UI renders directly.

import { getAvoidTags, getIntensityModifier } from '../data/conditions.js';

/**
 * Pick the number of exercises a session should contain based on time available.
 * Accounts for warm-up + rest periods at ~3.5 minutes per exercise on average.
 */
function exerciseCountForTime(minutes) {
  if (!minutes || minutes < 10) return 3;
  if (minutes <= 20) return 4;
  if (minutes <= 35) return 5;
  if (minutes <= 50) return 6;
  if (minutes <= 75) return 7;
  if (minutes <= 100) return 8;
  return 9;
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
  if (req.equipment && req.equipment !== 'any') {
    if (req.equipment === 'none') {
      // User explicitly wants bodyweight — strict.
      if (ex.equipment !== 'none') return null;
    } else if (req.equipment === 'machines') {
      // "Machines (gym)" includes bodyweight as fallback at lower priority.
      if (ex.equipment !== 'machines' && ex.equipment !== 'none') return null;
    } else if (ex.equipment !== req.equipment && ex.equipment !== 'none') {
      return null;
    }
  }

  let score = 0;

  // Muscle match (or full_body request matches anything)
  if (req.muscle && req.muscle !== 'full_body') {
    const muscles = ex.muscle || [];
    if (muscles.includes(req.muscle)) score += 12;
    else if (muscles.includes('full_body')) score += 2;
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

  // Slight randomization so successive generations vary a bit
  score += Math.random() * 0.5;

  return score;
}

/**
 * Generate a routine.
 */
export function generateRoutine(request, exercises, conditionKeys = []) {
  const avoidTags = getAvoidTags(conditionKeys);
  const intensity = getIntensityModifier(conditionKeys);

  // 1) Filter to image-bearing items only (defense in depth).
  const pool = exercises.filter((e) => Array.isArray(e.images) ? e.images.length > 0 : !!e.gif);

  // 2) Score & rank.
  const scored = pool
    .map((ex) => ({ ex, score: scoreExercise(ex, request, avoidTags) }))
    .filter((s) => s.score !== null)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return { exercises: [], conditionKeys, intensity, empty: true, request };
  }

  // 3) Choose top N, but enforce muscle variety so we don't pick 5 push exercises in a row.
  const targetCount = exerciseCountForTime(request.time);
  const chosen = [];
  const muscleHits = {};
  for (const { ex } of scored) {
    const primary = (ex.primaryMuscles && ex.primaryMuscles[0]) || (ex.muscle && ex.muscle[0]);
    if (primary) {
      muscleHits[primary] = (muscleHits[primary] || 0) + 1;
      // soft cap of 2 per primary muscle when the request is full_body
      if (request.muscle === 'full_body' && muscleHits[primary] > 2) continue;
      // soft cap of 3 per primary muscle for specific group requests (variety inside the group)
      if (request.muscle !== 'full_body' && muscleHits[primary] > 3) continue;
    }
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
  const prescribed = chosen.map((ex) => ({
    ...ex,
    sets: Math.max(2, Math.round(scheme.sets * (intensity < 1 ? 0.85 : 1))),
    reps: adjustReps(scheme.reps, intensity),
    rest: scheme.rest,
  }));

  return {
    exercises: prescribed,
    conditionKeys,
    intensity,
    request,
    createdAt: new Date().toISOString(),
    empty: false,
  };
}

/**
 * Parse free-text into a structured request. Deterministic keyword parser,
 * not an LLM. Handles English + Spanish phrasings users actually use.
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

  // ---------- GOAL ----------
  if (/\b(strength|fuerza)\b/.test(t)) req.goal = 'strength';
  else if (/\b(hypertrophy|muscle|hipertrofia|m[uú]sculo|masa)\b/.test(t)) req.goal = 'hypertrophy';
  else if (/\b(endurance|cardio|resistencia|aer[oó]bico)\b/.test(t)) req.goal = 'endurance';
  else if (/\b(fat ?loss|weight ?loss|adelgaza|grasa|perder peso|definici[oó]n|quemar)\b/.test(t))
    req.goal = 'fatloss';
  else if (/\b(mobility|stretch|movilidad|estirar|flexibilidad|elasticidad)\b/.test(t))
    req.goal = 'mobility';

  // ---------- MUSCLE GROUP ----------
  // Order matters: most specific first. We map to the muscle TAG used in the
  // generator (which exerciseService attaches to each exercise via muscleToTags).
  const m = (re, val) => {
    if (re.test(t) && req.muscle === 'full_body') req.muscle = val;
  };

  // Specific muscles
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

  // Group-level (only if no specific match yet)
  m(/\b(tren superior|upper body|parte superior|torso superior)\b/, 'upper');
  m(/\b(tren inferior|lower body|parte inferior|piernas y gl[uú]teos)\b/, 'lower');
  m(/\b(core|abdomen|abs|abdominales?|abdominal)\b/, 'core');
  m(/\b(empuj[eo]|push|empujar)\b/, 'push');
  m(/\b(tir[oó]n|pull|tirar|jalar)\b/, 'pull');
  m(/\b(piernas?|legs)\b/, 'legs');
  m(/\b(gl[uú]teos?|glutes?|nalgas?|cola|booty)\b/, 'glutes');
  m(/\b(full[- ]?body|cuerpo completo|todo el cuerpo|cuerpo entero)\b/, 'full_body');

  // ---------- EQUIPMENT ----------
  if (/\b(no equipment|sin equipo|sin material|bodyweight|peso corporal|en casa|at home|sin pesas|sin m[aá]quinas?|sin gym|sin gimnasio)\b/.test(t))
    req.equipment = 'none';
  else if (/\b(dumbbell|mancuernas?|pesas? de mano)\b/.test(t)) req.equipment = 'dumbbells';
  else if (/\b(barbell|barra ol[ií]mpica|con barra)\b/.test(t)) req.equipment = 'barbell';
  else if (/\b(bands?|bandas?|elasticos?|el[aá]sticas?|tubular)\b/.test(t)) req.equipment = 'bands';
  else if (/\b(kettlebell|pesa rusa|kettle)\b/.test(t)) req.equipment = 'kettlebell';
  else if (/\b(machines?|m[aá]quinas?|gym|gimnasio|polea|cable|cables)\b/.test(t))
    req.equipment = 'machines';

  // ---------- TIME ----------
  // Match "60 minutos", "1 hora", "1.5 horas", "an hour", etc.
  const minMatch = t.match(/(\d{1,3})\s*(min|minute|minuto)/);
  if (minMatch) {
    req.time = parseInt(minMatch[1], 10);
  } else {
    const hourMatch = t.match(/(\d+(?:\.\d+)?)\s*(hour|hora|hr)/);
    if (hourMatch) req.time = Math.round(parseFloat(hourMatch[1]) * 60);
    else if (/\b(quick|r[aá]pid|short|corto|breve)\b/.test(t)) req.time = 15;
    else if (/\b(long|largo|extenso|completo)\b/.test(t)) req.time = 60;
  }
  // Clamp absurd values
  if (req.time < 5) req.time = 5;
  if (req.time > 180) req.time = 180;

  // ---------- LEVEL ----------
  if (/\b(beginner|principiante|nuevo|novato|empezando)\b/.test(t)) req.level = 'beginner';
  else if (/\b(intermediate|intermedio|medio)\b/.test(t)) req.level = 'intermediate';
  else if (/\b(advanced|avanzado|experto|atleta)\b/.test(t)) req.level = 'advanced';

  return req;
}

/**
 * Build a YouTube search URL for a given exercise. We use a search URL
 * (rather than a specific video ID) because:
 *  - We can't verify any specific video stays online
 *  - YouTube's search always returns fresh, popular tutorials
 *  - The user can pick which one looks right
 */
export function youtubeSearchUrl(exerciseName, lang = 'en') {
  const prefix = lang === 'es' ? 'cómo hacer ' : 'how to do ';
  const q = encodeURIComponent(`${prefix}${exerciseName}`);
  return `https://www.youtube.com/results?search_query=${q}`;
}
