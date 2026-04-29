// Spanish translations for common exercise names from free-exercise-db.
//
// The upstream is English-only. We can't translate all 800+ entries by hand,
// so we maintain a curated lookup for the most common movements. For
// untranslated entries we fall through to the English name (still usable —
// terms like "burpee" or "plank" are recognized in Spanish anyway).
//
// Keys are the upstream `id` (snake-cased name).

const NAME_ES = {
  // Bodyweight basics
  Pushups: 'Lagartijas / Flexiones',
  Pushups_Close_Triceps_Position: 'Flexión cerrada (tríceps)',
  Wide_Grip_Pushup: 'Flexión con agarre amplio',
  Decline_Pushup: 'Flexión declinada',
  Pullups: 'Dominadas',
  Chinups: 'Dominadas supinas',
  Chin_Up: 'Dominada supina',
  Bodyweight_Squat: 'Sentadilla con peso corporal',
  Sissy_Squat: 'Sentadilla sissy',
  Lunge: 'Zancada',
  Walking_Lunge: 'Zancada caminando',
  Reverse_Lunge: 'Zancada inversa',
  Bench_Dips: 'Fondos en banco',
  Plank: 'Plancha',
  Side_Plank: 'Plancha lateral',
  Burpee: 'Burpee',
  Mountain_Climber: 'Escaladores',
  Jumping_Jacks: 'Saltos de tijera',
  Bodyweight_Lunge: 'Zancada con peso corporal',
  Box_Jump: 'Salto al cajón',
  Jump_Squat: 'Sentadilla con salto',

  // Core
  Crunches: 'Abdominal crunch',
  Decline_Crunch: 'Crunch declinado',
  Bicycle_Crunch: 'Bicicleta abdominal',
  Reverse_Crunch: 'Crunch inverso',
  Hanging_Leg_Raise: 'Elevación de piernas en barra',
  Air_Bike: 'Bicicleta en el aire',
  Russian_Twist: 'Giro ruso',
  Flat_Bench_Lying_Leg_Raise: 'Elevación de piernas en banco',
  '3_4_Sit-Up': 'Abdominal a 3/4',

  // Glutes
  Glute_Bridge: 'Puente de glúteos',
  Hip_Thrust: 'Empuje de cadera',
  Donkey_Kicks: 'Patadas de burro',
  Fire_Hydrant: 'Hidrante (cadera)',

  // Chest (dumbbell/barbell)
  'Barbell_Bench_Press_-_Medium_Grip': 'Press de banca con barra (agarre medio)',
  'Bench_Press_-_Powerlifting': 'Press de banca (powerlifting)',
  Dumbbell_Bench_Press: 'Press de banca con mancuernas',
  Incline_Dumbbell_Press: 'Press inclinado con mancuernas',
  Decline_Dumbbell_Bench_Press: 'Press declinado con mancuernas',
  Dumbbell_Flyes: 'Aperturas con mancuernas',
  Cable_Crossover: 'Cruce de cables',
  Pec_Deck: 'Pec deck',
  Incline_Bench_Press: 'Press inclinado',

  // Back
  Bent_Over_Barbell_Row: 'Remo con barra inclinado',
  Bent_Over_Two_Dumbbell_Row: 'Remo con dos mancuernas',
  Pendlay_Rows: 'Remo Pendlay',
  Wide_Grip_Pulldown_Behind_The_Neck: 'Jalón tras nuca, agarre amplio',
  Wide_Grip_Lat_Pulldown: 'Jalón al pecho, agarre amplio',
  Lat_Pulldown: 'Jalón al pecho',
  Seated_Cable_Rows: 'Remo sentado en cable',
  'T-Bar_Row_with_Handle': 'Remo en T con agarre',
  'One-Arm_Dumbbell_Row': 'Remo con mancuerna a un brazo',

  // Shoulders
  Standing_Military_Press: 'Press militar de pie',
  Barbell_Shoulder_Press: 'Press de hombros con barra',
  Dumbbell_Shoulder_Press: 'Press de hombros con mancuernas',
  Arnold_Dumbbell_Press: 'Press Arnold',
  Side_Lateral_Raise: 'Elevación lateral',
  Front_Dumbbell_Raise: 'Elevación frontal con mancuernas',
  Reverse_Flyes: 'Pájaros (deltoides posterior)',
  Face_Pull: 'Face pull',

  // Traps (trapecio)
  Barbell_Shrug: 'Encogimiento de hombros con barra',
  Dumbbell_Shrug: 'Encogimiento con mancuernas',
  Behind_The_Back_Barbell_Shrug: 'Encogimiento por detrás',
  Cable_Shrugs: 'Encogimiento en polea',
  Upright_Barbell_Row: 'Remo al mentón con barra',
  Upright_Cable_Row: 'Remo al mentón en polea',
  Dumbbell_Upright_Row: 'Remo al mentón con mancuernas',
  Farmers_Walk: 'Paseo del granjero',

  // Biceps
  Barbell_Curl: 'Curl con barra',
  Dumbbell_Bicep_Curl: 'Curl con mancuernas',
  Hammer_Curls: 'Curl martillo',
  Alternate_Hammer_Curl: 'Curl martillo alternado',
  Concentration_Curls: 'Curl concentrado',
  Preacher_Curl: 'Curl predicador',
  Cable_Curl: 'Curl en polea',
  'EZ-Bar_Curl': 'Curl con barra Z',

  // Triceps
  Tricep_Dumbbell_Kickback: 'Patada de tríceps con mancuerna',
  Triceps_Pushdown: 'Extensión de tríceps en polea',
  Skullcrusher: 'Press francés',
  Lying_Triceps_Press: 'Press francés tumbado',
  'Close-Grip_Barbell_Bench_Press': 'Press de banca agarre cerrado',
  Tricep_Dips: 'Fondos de tríceps',
  Overhead_Triceps_Extension: 'Extensión de tríceps por encima de la cabeza',

  // Legs / Quads
  Barbell_Squat: 'Sentadilla con barra',
  Front_Squat: 'Sentadilla frontal',
  Goblet_Squat: 'Sentadilla goblet',
  Leg_Press: 'Prensa de piernas',
  Leg_Extensions: 'Extensión de cuádriceps',
  Hack_Squat: 'Hack squat',
  Bulgarian_Split_Squat: 'Sentadilla búlgara',

  // Hamstrings
  Romanian_Deadlift: 'Peso muerto rumano',
  'Stiff-Legged_Dumbbell_Deadlift': 'Peso muerto rumano con mancuernas',
  Lying_Leg_Curls: 'Curl femoral tumbado',
  Seated_Leg_Curl: 'Curl femoral sentado',
  Good_Morning: 'Buenos días',

  // Calves
  Standing_Calf_Raises: 'Elevación de pantorrillas de pie',
  Seated_Calf_Raise: 'Elevación de pantorrillas sentado',
  Donkey_Calf_Raises: 'Elevación de pantorrilla burro',
  'Calf_Raises_-_With_Bands': 'Elevación de pantorrilla con bandas',

  // Deadlift / Power
  Deadlift: 'Peso muerto',
  Sumo_Deadlift: 'Peso muerto sumo',
  Conventional_Deadlift: 'Peso muerto convencional',
  Power_Clean: 'Cargada de fuerza',
  Hang_Clean: 'Cargada colgada',
  Kettlebell_Swing: 'Swing con kettlebell',

  // Stretches
  '90_90_Hamstring': 'Estiramiento de isquios 90/90',
  All_Fours_Quad_Stretch: 'Estiramiento de cuádriceps en cuatro apoyos',
  Standing_Hamstring_Stretch: 'Estiramiento de isquios de pie',
  Childs_Pose: 'Postura del niño',
  Cat_Stretch: 'Estiramiento del gato',
  World_Greatest_Stretch: 'El mejor estiramiento del mundo',
  Cobra_Stretch: 'Estiramiento de cobra',
};

// Some exercises don't need a translated name (they're identical/loanwords).
// Returns the English name as-is so the UI doesn't show an empty string.
export function translateExerciseName(id, fallbackEn) {
  return NAME_ES[id] || fallbackEn || id.replace(/_/g, ' ');
}

// Instruction translation is intentionally omitted — translating thousands
// of free-form steps machine-perfectly is brittle. We instead show the
// English instructions verbatim for ES users (most fitness terms are
// anglicized in Spanish gym culture). If you want full localization, add
// a per-id `INSTR_ES` map below following the same pattern as NAME_ES.
const INSTR_ES = {
  // Add per-id Spanish instruction arrays here as you curate them.
  // Example:
  // Bodyweight_Squat: [
  //   'De pie, pies a la anchura de los hombros.',
  //   'Lleva las caderas hacia atrás y baja flexionando rodillas.',
  //   'Sube empujando con los talones.',
  // ],
};

export function translateInstructions(id, fallbackEn) {
  return INSTR_ES[id] || fallbackEn || [];
}
