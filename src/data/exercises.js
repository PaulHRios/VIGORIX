// Tiny fallback dataset. Used ONLY when the network is offline AND the
// localStorage cache is empty. Keep this small but representative — most
// users will see the full 800+ catalog from free-exercise-db.
//
// Schema mirrors what exerciseService normalizes upstream entries to.
// Each item must have a non-empty `images` array.

const IMG = (path) =>
  `https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/${path}`;

function ex(id, en, es, primary, equipment, level, tags, instructionsEn, instructionsEs) {
  const images = [IMG(`${id}/0.jpg`), IMG(`${id}/1.jpg`)];
  return {
    id,
    name: { en, es },
    images,
    gif: images[0],
    youtubeQuery: en,
    muscle: primary, // already a flat tag list (we set these manually here)
    primaryMuscles: primary.filter((m) =>
      ['chest', 'back', 'biceps', 'triceps', 'shoulders', 'traps', 'quadriceps',
       'hamstrings', 'glutes', 'calves', 'abdominals', 'lats'].includes(m),
    ),
    equipment,
    rawEquipment: equipment === 'none' ? 'body only' : equipment,
    level,
    category: 'strength',
    tags,
    instructions: { en: instructionsEn, es: instructionsEs },
  };
}

export const FALLBACK_EXERCISES = [
  ex(
    'Pushups',
    'Push-up',
    'Lagartija / Flexión',
    ['chest', 'triceps', 'shoulders', 'upper', 'push'],
    'none',
    'beginner',
    ['prone'],
    [
      'Place hands shoulder-width on the floor, body in a straight line.',
      'Lower your chest toward the floor, elbows ~45°.',
      'Press back up, keep your core braced.',
    ],
    [
      'Manos a la anchura de hombros, cuerpo en línea recta.',
      'Baja el pecho hacia el suelo con los codos a ~45°.',
      'Empuja para subir, mantén el core firme.',
    ],
  ),
  ex(
    'Bodyweight_Squat',
    'Bodyweight Squat',
    'Sentadilla con peso corporal',
    ['quadriceps', 'glutes', 'lower', 'legs'],
    'none',
    'beginner',
    [],
    [
      'Stand with feet shoulder-width, toes slightly out.',
      'Push hips back, bend knees, keep chest up.',
      'Lower until thighs are about parallel to the floor.',
      'Drive through heels to stand.',
    ],
    [
      'De pie, pies a la anchura de los hombros, puntas ligeramente abiertas.',
      'Lleva las caderas atrás, flexiona rodillas, pecho arriba.',
      'Baja hasta que los muslos queden paralelos al suelo.',
      'Empuja con los talones para subir.',
    ],
  ),
  ex(
    'Plank',
    'Plank',
    'Plancha',
    ['abdominals', 'core'],
    'none',
    'beginner',
    ['prone'],
    [
      'Forearms on the floor, elbows under shoulders.',
      'Body straight from head to heels.',
      'Brace abs and glutes, breathe steadily.',
    ],
    [
      'Antebrazos en el suelo, codos bajo los hombros.',
      'Cuerpo recto desde la cabeza a los talones.',
      'Aprieta abdomen y glúteos, respira con calma.',
    ],
  ),
  ex(
    'Glute_Bridge',
    'Glute Bridge',
    'Puente de glúteos',
    ['glutes', 'lower'],
    'none',
    'beginner',
    [],
    [
      'Lie on your back, knees bent, feet flat on the floor.',
      'Drive hips up by squeezing glutes.',
      'Pause briefly at the top, lower under control.',
    ],
    [
      'Tumbado boca arriba, rodillas flexionadas, pies en el suelo.',
      'Empuja la cadera arriba apretando glúteos.',
      'Pausa breve arriba, baja con control.',
    ],
  ),
  ex(
    'Walking_Lunge',
    'Walking Lunge',
    'Zancada caminando',
    ['quadriceps', 'glutes', 'lower', 'legs'],
    'none',
    'beginner',
    ['lunge'],
    [
      'Step forward into a long stride.',
      'Bend both knees to ~90°; back knee hovers above the floor.',
      'Push off the front foot to advance into the next step.',
    ],
    [
      'Da un paso largo al frente.',
      'Flexiona ambas rodillas a ~90°; la trasera casi toca el suelo.',
      'Empuja con el pie delantero para avanzar.',
    ],
  ),
  ex(
    'Crunches',
    'Crunches',
    'Abdominal crunch',
    ['abdominals', 'core'],
    'none',
    'beginner',
    ['supine_flexion'],
    [
      'Lie on your back, knees bent, feet flat.',
      'Hands behind head — do not pull on the neck.',
      'Lift shoulders off the floor by contracting abs.',
      'Lower with control.',
    ],
    [
      'Tumbado boca arriba, rodillas flexionadas, pies apoyados.',
      'Manos detrás de la cabeza, sin tirar del cuello.',
      'Levanta los hombros del suelo contrayendo el abdomen.',
      'Baja con control.',
    ],
  ),
  ex(
    'Mountain_Climber',
    'Mountain Climber',
    'Escaladores',
    ['abdominals', 'core', 'shoulders', 'full_body'],
    'none',
    'beginner',
    ['prone', 'high_impact'],
    [
      'Start in a high plank position.',
      'Drive one knee toward your chest, then quickly switch legs.',
      'Keep hips low and core tight.',
    ],
    [
      'Empieza en posición de plancha alta.',
      'Lleva una rodilla al pecho y cambia de pierna rápidamente.',
      'Mantén la cadera baja y el core firme.',
    ],
  ),
  ex(
    'Dumbbell_Bicep_Curl',
    'Dumbbell Curl',
    'Curl con mancuernas',
    ['biceps', 'upper', 'pull'],
    'dumbbells',
    'beginner',
    [],
    [
      'Stand tall, dumbbell in each hand, palms forward.',
      'Curl weights up by bending at the elbows.',
      'Lower under control to full extension.',
    ],
    [
      'De pie, una mancuerna en cada mano, palmas al frente.',
      'Sube las mancuernas flexionando los codos.',
      'Baja con control hasta la extensión completa.',
    ],
  ),
  ex(
    'Dumbbell_Shoulder_Press',
    'Dumbbell Shoulder Press',
    'Press de hombros con mancuernas',
    ['shoulders', 'triceps', 'upper', 'push'],
    'dumbbells',
    'beginner',
    ['overhead'],
    [
      'Sit or stand with a dumbbell in each hand at shoulder height.',
      'Press the weights overhead until arms are extended.',
      'Lower under control.',
    ],
    [
      'Sentado o de pie con una mancuerna en cada hombro.',
      'Empuja las mancuernas hacia arriba hasta extender los brazos.',
      'Baja con control.',
    ],
  ),
  ex(
    'Bent_Over_Two_Dumbbell_Row',
    'Bent Over Dumbbell Row',
    'Remo con mancuernas',
    ['lats', 'middle back', 'biceps', 'upper', 'pull', 'back'],
    'dumbbells',
    'beginner',
    [],
    [
      'Hinge at the hips, back flat, dumbbells hanging.',
      'Pull elbows back, squeezing the shoulder blades.',
      'Lower under control.',
    ],
    [
      'Inclínate desde la cadera, espalda recta, mancuernas colgando.',
      'Tira los codos hacia atrás, junta los omóplatos.',
      'Baja con control.',
    ],
  ),
  ex(
    'Dumbbell_Shrug',
    'Dumbbell Shrug',
    'Encogimiento de hombros con mancuernas',
    ['traps', 'upper', 'pull', 'back'],
    'dumbbells',
    'beginner',
    [],
    [
      'Stand tall with dumbbells at your sides.',
      'Shrug shoulders straight up toward your ears.',
      'Pause, then lower under control.',
    ],
    [
      'De pie con mancuernas a los lados.',
      'Encoge los hombros hacia las orejas.',
      'Pausa breve, baja con control.',
    ],
  ),
  ex(
    'Romanian_Deadlift',
    'Romanian Deadlift',
    'Peso muerto rumano',
    ['hamstrings', 'glutes', 'lower back', 'lower'],
    'barbell',
    'intermediate',
    [],
    [
      'Stand tall holding a barbell, soft knees.',
      'Hinge at the hips, sliding the bar down your thighs.',
      'Stop when you feel a hamstring stretch; drive hips forward to stand.',
    ],
    [
      'De pie con la barra, rodillas ligeramente flexionadas.',
      'Lleva la cadera atrás, deslizando la barra por los muslos.',
      'Detente cuando sientas el estiramiento de isquios; empuja la cadera al frente para subir.',
    ],
  ),
];
