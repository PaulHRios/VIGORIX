// src/data/subgroupClassifier.js
//
// The classifier turns any exercise (regardless of source) into:
//   { main_muscle, sub_muscle, secondary_muscles[], body_part, exercise_type }
//
// It uses three layers:
//   1) explicit data from the source (if present)
//   2) name-pattern inference  (regexes based on exercise name)
//   3) biomechanical fallback (movement → muscle map)
//
// Used both at build time (scripts/buildExerciseDatabase) and at runtime
// (exerciseAggregator) so a fresh fetch from any source is auto-classified.

// ============================================================
// MAIN MUSCLE TAXONOMY
// ============================================================

export const MAIN_MUSCLES = [
  'chest',
  'back',
  'shoulders',
  'biceps',
  'triceps',
  'forearms',
  'abs',
  'quads',
  'hamstrings',
  'glutes',
  'calves',
  'abductors',
  'adductors',
  'lower_back',
  'traps',
  'neck',
  'full_body',
  'cardio',
];

// Map of "raw muscle string" → "main_muscle". Covers free-exercise-db,
// wger, ExerciseDB and ad-hoc inputs.
export const RAW_MUSCLE_MAP = {
  // Chest
  chest: 'chest',
  pectorals: 'chest',
  pectoralis: 'chest',
  pecs: 'chest',
  pectoraux: 'chest',
  brust: 'chest',

  // Back
  back: 'back',
  lats: 'back',
  'latissimus dorsi': 'back',
  'middle back': 'back',
  'upper back': 'back',
  rhomboids: 'back',
  'lower back': 'lower_back',
  'erector spinae': 'lower_back',
  spine: 'lower_back',

  // Shoulders
  shoulders: 'shoulders',
  delts: 'shoulders',
  deltoids: 'shoulders',
  schultern: 'shoulders',

  // Arms
  biceps: 'biceps',
  'biceps brachii': 'biceps',
  bicep: 'biceps',
  triceps: 'triceps',
  'triceps brachii': 'triceps',
  tricep: 'triceps',

  forearms: 'forearms',
  forearm: 'forearms',

  // Core
  abs: 'abs',
  abdominals: 'abs',
  abdominal: 'abs',
  core: 'abs',
  obliques: 'abs',
  serratus: 'abs',

  // Legs
  quads: 'quads',
  quadriceps: 'quads',
  hamstrings: 'hamstrings',
  hamstring: 'hamstrings',
  glutes: 'glutes',
  glute: 'glutes',
  gluteus: 'glutes',
  calves: 'calves',
  calf: 'calves',
  gastrocnemius: 'calves',
  soleus: 'calves',

  // Stabilisers
  abductors: 'abductors',
  abductor: 'abductors',
  adductors: 'adductors',
  adductor: 'adductors',

  // Other
  traps: 'traps',
  trapezius: 'traps',
  neck: 'neck',
  cardiovascular: 'cardio',
  cardio: 'cardio',
};

// Body parts (broader than muscle).
export const BODY_PART_MAP = {
  chest: 'upper body',
  back: 'upper body',
  lower_back: 'upper body',
  shoulders: 'upper body',
  biceps: 'upper body',
  triceps: 'upper body',
  forearms: 'upper body',
  traps: 'upper body',
  neck: 'upper body',
  abs: 'core',
  quads: 'lower body',
  hamstrings: 'lower body',
  glutes: 'lower body',
  calves: 'lower body',
  abductors: 'lower body',
  adductors: 'lower body',
  full_body: 'full body',
  cardio: 'cardio',
};

// ============================================================
// SUBGROUP DEFINITIONS
// ============================================================
//
// Each main muscle has an array of subgroups in priority order. The
// "default" key is what we use if no name pattern matches.

export const SUBGROUPS = {
  chest: ['upper_chest', 'mid_chest', 'lower_chest', 'chest_isolation'],
  back: ['lats', 'upper_back', 'middle_back'],
  lower_back: ['lower_back'],
  shoulders: ['front_delts', 'lateral_delts', 'rear_delts'],
  biceps: ['biceps_long_head', 'biceps_short_head', 'brachialis', 'biceps'],
  triceps: ['triceps_long_head', 'triceps_lateral_head', 'triceps_medial_head', 'triceps'],
  forearms: ['forearms'],
  abs: ['abs_upper', 'abs_lower', 'obliques', 'core'],
  quads: ['quads'],
  hamstrings: ['hamstrings_curl', 'hamstrings_hinge', 'hamstrings'],
  glutes: ['glutes_max', 'glutes_med'],
  calves: ['calves_gastrocnemius', 'calves_soleus'],
  abductors: ['abductors'],
  adductors: ['adductors'],
  traps: ['traps'],
  neck: ['neck'],
  full_body: ['full_body'],
  cardio: ['cardio'],
};

const DEFAULT_SUBGROUP = {
  chest: 'mid_chest',
  back: 'middle_back',
  lower_back: 'lower_back',
  shoulders: 'front_delts',
  biceps: 'biceps',
  triceps: 'triceps',
  forearms: 'forearms',
  abs: 'core',
  quads: 'quads',
  hamstrings: 'hamstrings',
  glutes: 'glutes_max',
  calves: 'calves_gastrocnemius',
  abductors: 'abductors',
  adductors: 'adductors',
  traps: 'traps',
  neck: 'neck',
  full_body: 'full_body',
  cardio: 'cardio',
};

// Localized labels — used by the UI.
export const SUBGROUP_LABELS = {
  upper_chest: { en: 'Upper chest', es: 'Pecho superior' },
  mid_chest: { en: 'Mid chest', es: 'Pecho medio' },
  lower_chest: { en: 'Lower chest', es: 'Pecho inferior' },
  chest_isolation: { en: 'Chest isolation', es: 'Aislamiento pecho' },

  lats: { en: 'Lats', es: 'Dorsales' },
  upper_back: { en: 'Upper back', es: 'Espalda alta' },
  middle_back: { en: 'Middle back', es: 'Espalda media' },
  lower_back: { en: 'Lower back', es: 'Espalda baja' },

  front_delts: { en: 'Front delts', es: 'Deltoide frontal' },
  lateral_delts: { en: 'Lateral delts', es: 'Deltoide lateral' },
  rear_delts: { en: 'Rear delts', es: 'Deltoide posterior' },

  biceps_long_head: { en: 'Biceps long head', es: 'Bíceps cabeza larga' },
  biceps_short_head: { en: 'Biceps short head', es: 'Bíceps cabeza corta' },
  brachialis: { en: 'Brachialis', es: 'Braquial' },
  biceps: { en: 'Biceps', es: 'Bíceps' },

  triceps_long_head: { en: 'Triceps long head', es: 'Tríceps cabeza larga' },
  triceps_lateral_head: { en: 'Triceps lateral head', es: 'Tríceps lateral' },
  triceps_medial_head: { en: 'Triceps medial head', es: 'Tríceps medial' },
  triceps: { en: 'Triceps', es: 'Tríceps' },

  forearms: { en: 'Forearms', es: 'Antebrazos' },

  abs_upper: { en: 'Upper abs', es: 'Abdomen superior' },
  abs_lower: { en: 'Lower abs', es: 'Abdomen inferior' },
  obliques: { en: 'Obliques', es: 'Oblicuos' },
  core: { en: 'Core', es: 'Core' },

  quads: { en: 'Quads', es: 'Cuádriceps' },

  hamstrings_curl: { en: 'Hamstring curl', es: 'Femoral (curl)' },
  hamstrings_hinge: { en: 'Hamstring hinge', es: 'Femoral (cadera)' },
  hamstrings: { en: 'Hamstrings', es: 'Femoral' },

  glutes_max: { en: 'Glute max', es: 'Glúteo mayor' },
  glutes_med: { en: 'Glute med', es: 'Glúteo medio' },

  calves_gastrocnemius: { en: 'Gastrocnemius', es: 'Gemelos' },
  calves_soleus: { en: 'Soleus', es: 'Sóleo' },

  abductors: { en: 'Abductors', es: 'Abductores' },
  adductors: { en: 'Adductors', es: 'Aductores' },
  traps: { en: 'Traps', es: 'Trapecio' },
  neck: { en: 'Neck', es: 'Cuello' },
  full_body: { en: 'Full body', es: 'Cuerpo completo' },
  cardio: { en: 'Cardio', es: 'Cardio' },
};

export function localizeSubgroup(key, lang = 'en') {
  if (!key) return null;
  const entry = SUBGROUP_LABELS[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
}

// ============================================================
// NAME-BASED INFERENCE RULES
// ============================================================
// Order matters: more specific patterns first.

const NAME_RULES = [
  // ----- CHEST -----
  { test: /\b(incline)\b|\binclinad/i, main: 'chest', sub: 'upper_chest' },
  { test: /\b(decline)\b|\bdeclinad/i, main: 'chest', sub: 'lower_chest' },
  { test: /\b(fly|flye|flies|peck deck|cable cross|crossover|aperturas|cruce|pec.?deck)\b/i, main: 'chest', sub: 'chest_isolation' },
  { test: /\b(dip|fondos)\b/i, main: 'chest', sub: 'lower_chest' }, // chest-leaning dip
  { test: /\b(bench press|press de banca|press plano|chest press)\b/i, main: 'chest', sub: 'mid_chest' },
  { test: /\b(push.?up|press.?up|lagartija|flexi[oó]n)\b/i, main: 'chest', sub: 'mid_chest' },

  // ----- BACK / LATS / TRAPS -----
  { test: /\b(deadlift|peso muerto|good ?morning|hyperextension|back extension|hiperextensi[oó]n)\b/i, main: 'lower_back', sub: 'lower_back' },
  { test: /\b(rdl|romanian deadlift|stiff.?leg)\b/i, main: 'hamstrings', sub: 'hamstrings_hinge' },
  { test: /\b(shrug|encogimiento|farmer)\b/i, main: 'traps', sub: 'traps' },
  { test: /\bface ?pull\b/i, main: 'shoulders', sub: 'rear_delts' },
  { test: /\b(pull.?up|chin.?up|dominada|pull.?down|jal[oó]n|lat.?pull)\b/i, main: 'back', sub: 'lats' },
  { test: /\b(t.?bar row|pendlay|barbell row)\b/i, main: 'back', sub: 'middle_back' },
  { test: /\b(seated row|cable row|machine row|remo polea|remo sentado)\b/i, main: 'back', sub: 'middle_back' },
  { test: /\b(row|remo)\b/i, main: 'back', sub: 'middle_back' },
  { test: /\b(reverse fly|rear delt fly|p[aá]jaros|posterior fly)\b/i, main: 'shoulders', sub: 'rear_delts' },

  // ----- SHOULDERS -----
  { test: /\b(lateral raise|side raise|elevaci[oó]n lateral|side delt|upright row|remo al ment[oó]n)\b/i, main: 'shoulders', sub: 'lateral_delts' },
  { test: /\b(rear delt|reverse pec|face pull|elevaci[oó]n posterior)\b/i, main: 'shoulders', sub: 'rear_delts' },
  { test: /\b(front raise|elevaci[oó]n frontal)\b/i, main: 'shoulders', sub: 'front_delts' },
  { test: /\b(arnold press)\b/i, main: 'shoulders', sub: 'front_delts' },
  { test: /\b(military press|overhead press|ohp|press militar|shoulder press|press hombro)\b/i, main: 'shoulders', sub: 'front_delts' },

  // ----- BICEPS -----
  { test: /\b(preacher|scott|concentration|spider)\b.*\b(curl|flexi[oó]n)\b/i, main: 'biceps', sub: 'biceps_short_head' },
  { test: /\b(incline)\b.*\b(curl)\b/i, main: 'biceps', sub: 'biceps_long_head' },
  { test: /\b(hammer curl|curl martillo)\b/i, main: 'biceps', sub: 'brachialis' },
  { test: /\bcurl\b|\bbiceps\b|\bb[ií]ceps\b/i, main: 'biceps', sub: 'biceps' },

  // ----- TRICEPS -----
  { test: /\b(skull.?crusher|french press|overhead extension|lying triceps|extensi[oó]n nuca|press franc[eé]s)\b/i, main: 'triceps', sub: 'triceps_long_head' },
  { test: /\b(pushdown|push.?down|jal[oó]n triceps|triceps cable)\b/i, main: 'triceps', sub: 'triceps_lateral_head' },
  { test: /\b(kickback|patada de triceps)\b/i, main: 'triceps', sub: 'triceps_lateral_head' },
  { test: /\b(close.?grip|cierre)\b.*\b(bench|press)\b/i, main: 'triceps', sub: 'triceps_medial_head' },
  { test: /\btriceps?\b|\btr[ií]ceps?\b/i, main: 'triceps', sub: 'triceps' },

  // ----- FOREARMS -----
  { test: /\b(wrist curl|reverse curl|curl invertido|forearm)\b/i, main: 'forearms', sub: 'forearms' },

  // ----- ABS / CORE -----
  { test: /\b(crunch|abdominal)\b/i, main: 'abs', sub: 'abs_upper' },
  { test: /\b(sit.?up|abdominal completo)\b/i, main: 'abs', sub: 'abs_upper' },
  { test: /\b(leg raise|hanging leg|knee raise|reverse crunch|elevaci[oó]n piernas)\b/i, main: 'abs', sub: 'abs_lower' },
  { test: /\b(russian twist|side bend|oblicuo|oblique|woodchop|pallof)\b/i, main: 'abs', sub: 'obliques' },
  { test: /\b(plank|plancha|hollow|dead bug|bird dog|bear crawl)\b/i, main: 'abs', sub: 'core' },

  // ----- QUADS -----
  { test: /\b(leg extension|extensi[oó]n de pierna)\b/i, main: 'quads', sub: 'quads' },
  { test: /\b(hack squat|sissy squat|front squat|squat frontal|sentadilla hack)\b/i, main: 'quads', sub: 'quads' },
  { test: /\b(squat|sentadilla|leg press|prensa|lunge|zancada|step.?up|split squat)\b/i, main: 'quads', sub: 'quads' },

  // ----- HAMSTRINGS -----
  { test: /\b(lying leg curl|curl femoral acostado)\b/i, main: 'hamstrings', sub: 'hamstrings_curl' },
  { test: /\b(seated leg curl|curl femoral sentado)\b/i, main: 'hamstrings', sub: 'hamstrings_curl' },
  { test: /\b(leg curl|hamstring curl|curl femoral|curl de pierna)\b/i, main: 'hamstrings', sub: 'hamstrings_curl' },
  { test: /\b(good morning|nordic curl)\b/i, main: 'hamstrings', sub: 'hamstrings_hinge' },

  // ----- GLUTES -----
  { test: /\b(hip thrust|empuje de cadera|glute bridge|puente|frog pump)\b/i, main: 'glutes', sub: 'glutes_max' },
  { test: /\b(glute kickback|patada de gl[uú]teo|cable kickback|donkey kick)\b/i, main: 'glutes', sub: 'glutes_max' },
  { test: /\b(clamshell|monster walk|hip abduction|abducci[oó]n)\b/i, main: 'glutes', sub: 'glutes_med' },
  { test: /\b(side leg raise|fire hydrant)\b/i, main: 'glutes', sub: 'glutes_med' },

  // ----- CALVES -----
  { test: /\b(seated calf|calf seated|gemelos sentado|s[oó]leo|soleus)\b/i, main: 'calves', sub: 'calves_soleus' },
  { test: /\b(standing calf|calf raise|gemelos de pie|donkey calf)\b/i, main: 'calves', sub: 'calves_gastrocnemius' },
  { test: /\b(calf|gemelo|pantorrilla)\b/i, main: 'calves', sub: 'calves_gastrocnemius' },

  // ----- ABDUCTORS / ADDUCTORS -----
  { test: /\b(hip abduction|abductor|abducci[oó]n|cable abduction)\b/i, main: 'abductors', sub: 'abductors' },
  { test: /\b(hip adduction|adductor|aducci[oó]n)\b/i, main: 'adductors', sub: 'adductors' },

  // ----- CARDIO -----
  { test: /\b(run|jog|sprint|cycling|bike|elliptical|rowing|jump rope|burpee|mountain climber|trotar|correr|elíptica)\b/i, main: 'cardio', sub: 'cardio' },
];

// Compound lift detection — for technique-pairing logic.
const COMPOUND_PATTERNS = [
  /\b(squat|sentadilla|deadlift|peso muerto|bench press|press de banca|overhead press|press militar|barbell row|pendlay|clean|snatch|jerk|thruster|push press)\b/i,
];

export function isCompound(name) {
  if (!name) return false;
  return COMPOUND_PATTERNS.some((re) => re.test(name));
}

// ============================================================
// MAIN CLASSIFY FUNCTION
// ============================================================

/**
 * Classify any exercise. Inputs are loose:
 *   { name, primaryMuscles, secondaryMuscles, equipment, ... }
 * Returns a normalized classification:
 *   { main_muscle, sub_muscle, secondary_muscles[], body_part, exercise_type }
 */
export function classifyExercise(ex) {
  const name = String(ex?.name?.en || ex?.name || ex?.id || '').trim();
  const primaryRaw = (ex?.primaryMuscles || ex?.muscles || []).map((m) => String(m).toLowerCase());
  const secondaryRaw = (ex?.secondaryMuscles || ex?.muscles_secondary || []).map((m) => String(m).toLowerCase());

  // 1) Try name patterns first — they're the most reliable when present.
  let main = null;
  let sub = null;
  for (const rule of NAME_RULES) {
    if (rule.test.test(name)) {
      main = rule.main;
      sub = rule.sub;
      break;
    }
  }

  // 2) If name didn't yield a result, fall back to the source's primary muscle.
  if (!main && primaryRaw.length > 0) {
    main = mapRawMuscle(primaryRaw[0]);
  }

  // 3) Last resort
  if (!main) main = 'full_body';

  // Choose a default subgroup if name didn't pin one down
  if (!sub) sub = DEFAULT_SUBGROUP[main] || main;

  // Secondary muscles → normalized list of MAIN muscles
  const secondary = Array.from(
    new Set(
      [...primaryRaw.slice(1), ...secondaryRaw]
        .map(mapRawMuscle)
        .filter((m) => m && m !== main),
    ),
  );

  // body_part
  const body_part = BODY_PART_MAP[main] || 'other';

  // compound vs isolation — heuristic
  let exercise_type;
  if (isCompound(name)) {
    exercise_type = 'compound';
  } else if (ex?.mechanic === 'compound') {
    exercise_type = 'compound';
  } else if (ex?.mechanic === 'isolation') {
    exercise_type = 'isolation';
  } else {
    // Heuristic: 2+ different MAIN muscle groups touched → compound
    const allMains = new Set([main, ...secondary]);
    exercise_type = allMains.size >= 2 ? 'compound' : 'isolation';
  }

  // movement_pattern (rough)
  let movement_pattern = inferMovementPattern(name, main);

  return {
    main_muscle: main,
    sub_muscle: sub,
    secondary_muscles: secondary,
    body_part,
    exercise_type,
    movement_pattern,
  };
}

function mapRawMuscle(raw) {
  if (!raw) return null;
  const k = String(raw).toLowerCase().trim();
  if (RAW_MUSCLE_MAP[k]) return RAW_MUSCLE_MAP[k];
  // Try partial matches
  for (const key of Object.keys(RAW_MUSCLE_MAP)) {
    if (k.includes(key)) return RAW_MUSCLE_MAP[key];
  }
  return null;
}

function inferMovementPattern(name, main) {
  if (!name) return null;
  const n = name.toLowerCase();
  if (/squat|sentadilla|leg press|lunge|step.?up/.test(n)) return 'squat';
  if (/deadlift|peso muerto|hip hinge|good morning|rdl/.test(n)) return 'hinge';
  if (/bench|press|push.?up/.test(n)) return 'horizontal_push';
  if (/overhead|military|shoulder press|ohp/.test(n)) return 'vertical_push';
  if (/row|remo/.test(n)) return 'horizontal_pull';
  if (/pull.?up|chin.?up|pulldown|dominada|jal[oó]n/.test(n)) return 'vertical_pull';
  if (/curl|extension/.test(n)) return 'isolation';
  if (/twist|woodchop|carry|farmer/.test(n)) return 'rotation_carry';
  return main === 'cardio' ? 'cardio' : 'other';
}

// ============================================================
// EQUIPMENT NORMALIZATION
// ============================================================

export const EQUIPMENT_MAP = {
  // free-exercise-db
  'body only': 'none',
  none: 'none',
  bodyweight: 'none',
  dumbbell: 'dumbbells',
  dumbbells: 'dumbbells',
  barbell: 'barbell',
  'e-z curl bar': 'barbell',
  ez_bar: 'barbell',
  cable: 'cable',
  cables: 'cable',
  machine: 'machine',
  kettlebells: 'kettlebell',
  kettlebell: 'kettlebell',
  bands: 'bands',
  band: 'bands',
  'medicine ball': 'medicine_ball',
  'exercise ball': 'exercise_ball',
  'foam roll': 'foam_roller',
  'foam roller': 'foam_roller',
  // wger ids
  'pull-up bar': 'pull_up_bar',
  'pull up bar': 'pull_up_bar',
  bench: 'bench',
  'incline bench': 'bench',
  'swiss ball': 'exercise_ball',
  'sz-bar': 'barbell',
  other: 'other',
};

export function normalizeEquipment(raw) {
  if (!raw) return 'none';
  const k = String(raw).toLowerCase().trim();
  return EQUIPMENT_MAP[k] || k.replace(/\s+/g, '_');
}
