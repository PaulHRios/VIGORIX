// Spanish translations for common exercise names from free-exercise-db.
// The upstream is English-only. We keep curated names and practical Spanish
// instructions for common movements. Everything else falls back gracefully,
// because apparently 800+ exercises were not enough chaos.

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
  Fire_Hydrant: 'Hidrante de cadera',

  // Chest
  'Barbell_Bench_Press_-_Medium_Grip': 'Press de banca con barra',
  'Bench_Press_-_Powerlifting': 'Press de banca',
  Dumbbell_Bench_Press: 'Press de banca con mancuernas',
  Incline_Dumbbell_Press: 'Press inclinado con mancuernas',
  Decline_Dumbbell_Bench_Press: 'Press declinado con mancuernas',
  Dumbbell_Flyes: 'Aperturas con mancuernas',
  Cable_Crossover: 'Cruce de cables',
  Pec_Deck: 'Pec deck',
  Incline_Bench_Press: 'Press inclinado',
  Pushups_With_Feet_Elevated: 'Flexiones con pies elevados',

  // Back
  Bent_Over_Barbell_Row: 'Remo con barra inclinado',
  Bent_Over_Two_Dumbbell_Row: 'Remo con dos mancuernas',
  Pendlay_Rows: 'Remo Pendlay',
  Wide_Grip_Pulldown_Behind_The_Neck: 'Jalón tras nuca',
  Wide_Grip_Lat_Pulldown: 'Jalón al pecho con agarre amplio',
  Lat_Pulldown: 'Jalón al pecho',
  Seated_Cable_Rows: 'Remo sentado en cable',
  'T-Bar_Row_with_Handle': 'Remo en T',
  'One-Arm_Dumbbell_Row': 'Remo con mancuerna a un brazo',
  Hyperextensions_Back_Extensions: 'Hiperextensiones de espalda',

  // Shoulders
  Standing_Military_Press: 'Press militar de pie',
  Barbell_Shoulder_Press: 'Press de hombros con barra',
  Dumbbell_Shoulder_Press: 'Press de hombros con mancuernas',
  Arnold_Dumbbell_Press: 'Press Arnold',
  Side_Lateral_Raise: 'Elevación lateral',
  Front_Dumbbell_Raise: 'Elevación frontal con mancuernas',
  Reverse_Flyes: 'Pájaros / deltoide posterior',
  Face_Pull: 'Face pull',

  // Traps
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
  'Close-Grip_Barbell_Bench_Press': 'Press de banca con agarre cerrado',
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

  // Exercise ball / medicine ball
  Exercise_Ball_Crunch: 'Crunch en pelota de ejercicio',
  Exercise_Ball_Pull_In: 'Encogimiento con pelota de ejercicio',
  Ball_Leg_Curl: 'Curl femoral con pelota',
  Medicine_Ball_Chest_Pass: 'Pase de pecho con balón medicinal',
  Medicine_Ball_Slam: 'Azote con balón medicinal',

  // Stretches
  '90_90_Hamstring': 'Estiramiento de isquios 90/90',
  All_Fours_Quad_Stretch: 'Estiramiento de cuádriceps en cuatro apoyos',
  Standing_Hamstring_Stretch: 'Estiramiento de isquios de pie',
  Childs_Pose: 'Postura del niño',
  Cat_Stretch: 'Estiramiento del gato',
  World_Greatest_Stretch: 'El mejor estiramiento del mundo',
  Cobra_Stretch: 'Estiramiento de cobra',
};

const INSTR_ES = {
  Pushups: [
    'Coloca las manos en el suelo a la anchura de los hombros.',
    'Mantén el cuerpo recto desde la cabeza hasta los talones.',
    'Baja el pecho hacia el suelo con control.',
    'Empuja el suelo para volver a la posición inicial.',
  ],

  Bodyweight_Squat: [
    'Párate con los pies a la anchura de los hombros.',
    'Lleva la cadera hacia atrás y flexiona las rodillas.',
    'Baja hasta que los muslos queden cerca de paralelo al suelo.',
    'Sube empujando con los talones y manteniendo el pecho arriba.',
  ],

  Plank: [
    'Apoya los antebrazos en el suelo con los codos bajo los hombros.',
    'Mantén el cuerpo recto desde la cabeza hasta los talones.',
    'Aprieta abdomen y glúteos.',
    'Respira de forma controlada durante todo el ejercicio.',
  ],

  Glute_Bridge: [
    'Acuéstate boca arriba con las rodillas flexionadas y los pies apoyados.',
    'Empuja la cadera hacia arriba apretando los glúteos.',
    'Haz una pausa breve arriba.',
    'Baja con control hasta volver al inicio.',
  ],

  Walking_Lunge: [
    'Da un paso largo hacia adelante.',
    'Flexiona ambas rodillas hasta formar aproximadamente 90 grados.',
    'Empuja con la pierna delantera para avanzar.',
    'Alterna piernas manteniendo el torso estable.',
  ],

  Crunches: [
    'Acuéstate boca arriba con las rodillas flexionadas.',
    'Coloca las manos detrás de la cabeza sin jalar el cuello.',
    'Eleva los hombros contrayendo el abdomen.',
    'Baja lentamente con control.',
  ],

  Mountain_Climber: [
    'Comienza en posición de plancha alta.',
    'Lleva una rodilla hacia el pecho.',
    'Cambia de pierna de forma controlada o rápida según tu nivel.',
    'Mantén la cadera estable y el abdomen firme.',
  ],

  Dumbbell_Bicep_Curl: [
    'Párate derecho con una mancuerna en cada mano.',
    'Mantén los codos cerca del cuerpo.',
    'Flexiona los codos para subir las mancuernas.',
    'Baja lentamente hasta extender los brazos.',
  ],

  Hammer_Curls: [
    'Sujeta las mancuernas con las palmas mirando hacia dentro.',
    'Mantén los codos pegados al cuerpo.',
    'Sube las mancuernas sin balancear el torso.',
    'Baja con control.',
  ],

  Barbell_Curl: [
    'Toma la barra con agarre supino.',
    'Mantén el torso firme y los codos cerca del cuerpo.',
    'Sube la barra flexionando los codos.',
    'Baja lentamente hasta extender los brazos.',
  ],

  Dumbbell_Shoulder_Press: [
    'Sujeta una mancuerna en cada mano a la altura de los hombros.',
    'Aprieta el abdomen y mantén la espalda estable.',
    'Empuja las mancuernas hacia arriba hasta extender los brazos.',
    'Baja con control a la posición inicial.',
  ],

  Side_Lateral_Raise: [
    'Sujeta una mancuerna en cada mano a los lados del cuerpo.',
    'Eleva los brazos hacia los lados hasta la altura de los hombros.',
    'Mantén una ligera flexión en los codos.',
    'Baja lentamente con control.',
  ],

  Front_Dumbbell_Raise: [
    'Sujeta las mancuernas frente a los muslos.',
    'Eleva los brazos hacia adelante hasta la altura de los hombros.',
    'Evita balancear el cuerpo.',
    'Baja lentamente.',
  ],

  Bent_Over_Two_Dumbbell_Row: [
    'Inclina el torso desde la cadera manteniendo la espalda recta.',
    'Deja las mancuernas colgando debajo de los hombros.',
    'Jala los codos hacia atrás apretando la espalda.',
    'Baja las mancuernas con control.',
  ],

  Bent_Over_Barbell_Row: [
    'Sujeta la barra con las manos algo más abiertas que los hombros.',
    'Inclina el torso manteniendo la espalda recta.',
    'Jala la barra hacia la zona baja del pecho o abdomen.',
    'Baja la barra con control.',
  ],

  'One-Arm_Dumbbell_Row': [
    'Apoya una mano y una rodilla en un banco.',
    'Sujeta una mancuerna con la otra mano.',
    'Jala el codo hacia atrás hasta contraer la espalda.',
    'Baja la mancuerna lentamente.',
  ],

  Lat_Pulldown: [
    'Siéntate frente a la polea y toma la barra con agarre amplio.',
    'Mantén el pecho arriba y el torso estable.',
    'Jala la barra hacia la parte alta del pecho.',
    'Regresa lentamente hasta extender los brazos.',
  ],

  Seated_Cable_Rows: [
    'Siéntate con la espalda recta y toma el agarre.',
    'Jala el cable hacia el torso.',
    'Aprieta los omóplatos al final del movimiento.',
    'Regresa lentamente sin perder postura.',
  ],

  Barbell_Squat: [
    'Coloca la barra sobre la parte alta de la espalda.',
    'Párate con los pies a la anchura de los hombros.',
    'Baja flexionando rodillas y cadera.',
    'Sube empujando con los talones y manteniendo el torso firme.',
  ],

  Goblet_Squat: [
    'Sujeta una mancuerna o kettlebell frente al pecho.',
    'Baja en sentadilla manteniendo el pecho arriba.',
    'Lleva las rodillas en línea con los pies.',
    'Sube empujando con los talones.',
  ],

  Leg_Press: [
    'Coloca los pies sobre la plataforma a una anchura cómoda.',
    'Baja la plataforma flexionando las rodillas con control.',
    'No bloquees las rodillas al extender.',
    'Empuja la plataforma hasta volver al inicio.',
  ],

  Leg_Extensions: [
    'Siéntate en la máquina con la espalda apoyada.',
    'Coloca los tobillos detrás del rodillo.',
    'Extiende las piernas contrayendo los cuádriceps.',
    'Baja lentamente con control.',
  ],

  Romanian_Deadlift: [
    'Sujeta la barra o mancuernas frente a los muslos.',
    'Mantén las rodillas ligeramente flexionadas.',
    'Lleva la cadera hacia atrás bajando el peso por las piernas.',
    'Sube apretando glúteos y femorales.',
  ],

  'Stiff-Legged_Dumbbell_Deadlift': [
    'Sujeta las mancuernas frente a los muslos.',
    'Mantén las piernas casi extendidas, sin bloquear completamente.',
    'Baja desde la cadera manteniendo la espalda recta.',
    'Sube controlando el movimiento.',
  ],

  Lying_Leg_Curls: [
    'Acuéstate boca abajo en la máquina de curl femoral.',
    'Coloca los tobillos bajo el rodillo.',
    'Flexiona las rodillas para llevar los talones hacia los glúteos.',
    'Baja lentamente hasta la posición inicial.',
  ],

  Seated_Leg_Curl: [
    'Siéntate en la máquina con las piernas extendidas.',
    'Ajusta el rodillo sobre los tobillos.',
    'Flexiona las rodillas llevando el rodillo hacia abajo.',
    'Regresa lentamente con control.',
  ],

  Standing_Calf_Raises: [
    'Párate con los pies firmes y el torso estable.',
    'Eleva los talones contrayendo las pantorrillas.',
    'Haz una pausa breve arriba.',
    'Baja lentamente hasta sentir el estiramiento.',
  ],

  Seated_Calf_Raise: [
    'Siéntate con las rodillas flexionadas y los pies apoyados.',
    'Eleva los talones contrayendo las pantorrillas.',
    'Mantén una pausa breve arriba.',
    'Baja lentamente.',
  ],

  Dumbbell_Bench_Press: [
    'Acuéstate en un banco con una mancuerna en cada mano.',
    'Coloca las mancuernas a los lados del pecho.',
    'Empuja hacia arriba hasta extender los brazos.',
    'Baja lentamente manteniendo control.',
  ],

  Incline_Dumbbell_Press: [
    'Acuéstate en un banco inclinado con una mancuerna en cada mano.',
    'Coloca las mancuernas a la altura del pecho superior.',
    'Empuja hacia arriba hasta extender los brazos.',
    'Baja con control para trabajar el pecho superior.',
  ],

  Decline_Dumbbell_Bench_Press: [
    'Acuéstate en un banco declinado con una mancuerna en cada mano.',
    'Baja las mancuernas hacia la parte baja del pecho.',
    'Empuja hacia arriba contrayendo el pecho.',
    'Controla el descenso.',
  ],

  Dumbbell_Flyes: [
    'Acuéstate en un banco con una mancuerna en cada mano.',
    'Abre los brazos con una ligera flexión en los codos.',
    'Siente el estiramiento en el pecho.',
    'Cierra los brazos contrayendo el pecho.',
  ],

  Cable_Crossover: [
    'Colócate entre dos poleas altas.',
    'Toma un agarre en cada mano.',
    'Lleva las manos hacia el centro frente al cuerpo.',
    'Regresa lentamente manteniendo tensión en el pecho.',
  ],

  'Close-Grip_Barbell_Bench_Press': [
    'Acuéstate en un banco y toma la barra con agarre cerrado.',
    'Baja la barra hacia el pecho manteniendo los codos controlados.',
    'Empuja hacia arriba usando pecho y tríceps.',
    'Evita abrir demasiado los codos.',
  ],

  Triceps_Pushdown: [
    'Colócate frente a la polea con los codos pegados al cuerpo.',
    'Empuja el agarre hacia abajo extendiendo los codos.',
    'Aprieta los tríceps al final.',
    'Regresa lentamente sin mover los codos hacia adelante.',
  ],

  Skullcrusher: [
    'Acuéstate en un banco sujetando una barra o mancuernas.',
    'Mantén los brazos apuntando hacia arriba.',
    'Flexiona los codos bajando el peso hacia la frente.',
    'Extiende los codos para volver al inicio.',
  ],

  Tricep_Dumbbell_Kickback: [
    'Inclina el torso hacia adelante con la espalda recta.',
    'Mantén el codo cerca del cuerpo.',
    'Extiende el brazo hacia atrás contrayendo el tríceps.',
    'Regresa lentamente.',
  ],

  Barbell_Shrug: [
    'Sujeta la barra frente al cuerpo.',
    'Eleva los hombros hacia las orejas.',
    'Haz una pausa breve arriba.',
    'Baja lentamente sin girar los hombros.',
  ],

  Dumbbell_Shrug: [
    'Sujeta una mancuerna en cada mano a los lados.',
    'Eleva los hombros hacia arriba.',
    'Aprieta el trapecio en la parte alta.',
    'Baja con control.',
  ],

  Farmers_Walk: [
    'Sujeta una carga pesada en cada mano.',
    'Camina manteniendo el torso erguido.',
    'Aprieta el abdomen y los trapecios.',
    'Mantén pasos controlados durante la distancia indicada.',
  ],

  Exercise_Ball_Crunch: [
    'Acuéstate sobre la pelota con la zona lumbar apoyada.',
    'Coloca los pies firmes en el suelo.',
    'Eleva el torso contrayendo el abdomen.',
    'Baja lentamente manteniendo equilibrio.',
  ],

  Ball_Leg_Curl: [
    'Acuéstate boca arriba con los talones sobre la pelota.',
    'Eleva la cadera formando una línea recta con el cuerpo.',
    'Flexiona las rodillas llevando la pelota hacia ti.',
    'Extiende lentamente sin bajar la cadera.',
  ],

  Medicine_Ball_Chest_Pass: [
    'Sujeta el balón medicinal frente al pecho.',
    'Empuja el balón hacia adelante de forma explosiva.',
    'Mantén el torso firme.',
    'Recibe o recupera el balón con control.',
  ],

  Medicine_Ball_Slam: [
    'Sujeta el balón medicinal por encima de la cabeza.',
    'Contrae el abdomen.',
    'Lanza el balón hacia el suelo con fuerza.',
    'Recógelo con buena postura y repite.',
  ],
};

const PHRASE_REPLACEMENTS = [
  [/Lie on your back/gi, 'Acuéstate boca arriba'],
  [/Lie face down/gi, 'Acuéstate boca abajo'],
  [/Stand with your feet shoulder-width apart/gi, 'Párate con los pies a la anchura de los hombros'],
  [/Keep your back straight/gi, 'Mantén la espalda recta'],
  [/Keep your core tight/gi, 'Mantén el abdomen firme'],
  [/Keep your chest up/gi, 'Mantén el pecho arriba'],
  [/Lower the weight/gi, 'Baja el peso'],
  [/Press the weight/gi, 'Empuja el peso'],
  [/Return to the starting position/gi, 'Regresa a la posición inicial'],
  [/Repeat for the recommended amount of repetitions/gi, 'Repite por el número recomendado de repeticiones'],
  [/Squeeze your/gi, 'Aprieta tus'],
  [/Pause briefly/gi, 'Haz una pausa breve'],
  [/Slowly/gi, 'Lentamente'],
  [/Control the movement/gi, 'Controla el movimiento'],
  [/your chest/gi, 'tu pecho'],
  [/your shoulders/gi, 'tus hombros'],
  [/your back/gi, 'tu espalda'],
  [/your knees/gi, 'tus rodillas'],
  [/your hips/gi, 'tu cadera'],
  [/your elbows/gi, 'tus codos'],
  [/your glutes/gi, 'tus glúteos'],
  [/your abs/gi, 'tu abdomen'],
  [/the floor/gi, 'el suelo'],
  [/dumbbells/gi, 'mancuernas'],
  [/dumbbell/gi, 'mancuerna'],
  [/barbell/gi, 'barra'],
  [/cable/gi, 'cable'],
  [/machine/gi, 'máquina'],
  [/bench/gi, 'banco'],
];

function fallbackTranslateInstruction(step) {
  if (!step || typeof step !== 'string') return step;

  let translated = step;

  for (const [pattern, replacement] of PHRASE_REPLACEMENTS) {
    translated = translated.replace(pattern, replacement);
  }

  return translated;
}

export function translateExerciseName(id, fallbackEn) {
  return NAME_ES[id] || fallbackEn || id.replace(/_/g, ' ');
}

export function translateInstructions(id, fallbackEn) {
  if (INSTR_ES[id]) return INSTR_ES[id];

  if (!Array.isArray(fallbackEn)) return [];

  return fallbackEn.map(fallbackTranslateInstruction);
}
