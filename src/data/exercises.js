// Fallback exercise dataset. Used when ExerciseDB API is unavailable.
//
// GIF URLs come from a public, free CDN (giphy) of generic motion clips.
// Each entry MUST have a gif — exercises without gifs are filtered out per spec.
// "tags" feed the safety system; see data/conditions.js for what each tag means.
//
// This dataset is intentionally conservative: only common, well-known movements.

export const FALLBACK_EXERCISES = [
  // ---------- BODYWEIGHT / NO EQUIPMENT ----------
  {
    id: 'bw_squat',
    name: { en: 'Bodyweight Squat', es: 'Sentadilla con peso corporal' },
    gif: 'https://media.giphy.com/media/1qfKlNPxguL3UV4o2k/giphy.gif',
    muscle: ['lower', 'legs', 'glutes', 'full_body'],
    equipment: 'none',
    level: 'beginner',
    tags: [],
    instructions: {
      en: [
        'Stand with feet shoulder-width apart, toes slightly out.',
        'Push hips back and bend knees, keeping chest up.',
        'Lower until thighs are roughly parallel to the floor.',
        'Drive through your heels to stand up.',
      ],
      es: [
        'De pie, pies a la anchura de los hombros, puntas ligeramente abiertas.',
        'Lleva las caderas atrás y flexiona rodillas, pecho arriba.',
        'Baja hasta que los muslos queden paralelos al suelo.',
        'Empuja con los talones para subir.',
      ],
    },
  },
  {
    id: 'bw_pushup',
    name: { en: 'Push-up', es: 'Flexión de pecho' },
    gif: 'https://media.giphy.com/media/7Z0lCgVJBhjlS/giphy.gif',
    muscle: ['upper', 'push', 'full_body'],
    equipment: 'none',
    level: 'beginner',
    tags: ['prone'],
    instructions: {
      en: [
        'Place hands slightly wider than shoulders, body in a straight line.',
        'Lower chest toward the floor with elbows at ~45°.',
        'Press back up, keeping core braced.',
      ],
      es: [
        'Manos algo más anchas que los hombros, cuerpo en línea recta.',
        'Baja el pecho al suelo con codos a unos 45°.',
        'Empuja para subir, mantén el core firme.',
      ],
    },
  },
  {
    id: 'bw_lunge',
    name: { en: 'Walking Lunge', es: 'Zancada caminando' },
    gif: 'https://media.giphy.com/media/3o7TKsrfkN7g3vQk6A/giphy.gif',
    muscle: ['lower', 'legs', 'glutes'],
    equipment: 'none',
    level: 'beginner',
    tags: ['lunge'],
    instructions: {
      en: [
        'Step forward into a long stride.',
        'Bend both knees to ~90°; back knee hovers above the floor.',
        'Push off the front foot to bring the back leg through into the next step.',
      ],
      es: [
        'Da un paso largo al frente.',
        'Flexiona ambas rodillas a ~90°; la trasera casi toca el suelo.',
        'Empuja con el pie delantero para avanzar al siguiente paso.',
      ],
    },
  },
  {
    id: 'bw_plank',
    name: { en: 'Plank', es: 'Plancha' },
    gif: 'https://media.giphy.com/media/3o7TKr3nzbh5WgCFxe/giphy.gif',
    muscle: ['core', 'full_body'],
    equipment: 'none',
    level: 'beginner',
    tags: ['prone'],
    instructions: {
      en: [
        'Forearms on the floor, shoulders over elbows.',
        'Body forms a straight line from heels to head.',
        'Brace abs and glutes; breathe steadily.',
      ],
      es: [
        'Antebrazos en el suelo, hombros sobre los codos.',
        'Cuerpo en línea recta desde los talones hasta la cabeza.',
        'Aprieta abdomen y glúteos; respira de forma constante.',
      ],
    },
  },
  {
    id: 'bw_glutebridge',
    name: { en: 'Glute Bridge', es: 'Puente de glúteos' },
    gif: 'https://media.giphy.com/media/3oEjI80rTAvF6CqKWA/giphy.gif',
    muscle: ['glutes', 'lower', 'core'],
    equipment: 'none',
    level: 'beginner',
    tags: ['supine'],
    instructions: {
      en: [
        'Lie on your back with knees bent, feet flat.',
        'Drive heels into the floor and lift hips until shoulders, hips, knees align.',
        'Squeeze glutes at the top, lower with control.',
      ],
      es: [
        'Túmbate boca arriba con rodillas flexionadas, pies en el suelo.',
        'Empuja con los talones y eleva caderas hasta alinear hombros, cadera y rodillas.',
        'Aprieta glúteos arriba y baja con control.',
      ],
    },
  },
  {
    id: 'bw_mountainclimber',
    name: { en: 'Mountain Climber', es: 'Escalador' },
    gif: 'https://media.giphy.com/media/L8K62iTDkzGX6/giphy.gif',
    muscle: ['core', 'full_body'],
    equipment: 'none',
    level: 'intermediate',
    tags: ['prone', 'high_impact'],
    instructions: {
      en: [
        'Start in a high plank.',
        'Drive one knee toward your chest, then quickly switch.',
        'Keep hips low and steady.',
      ],
      es: [
        'Empieza en plancha alta.',
        'Lleva una rodilla al pecho y cambia rápido.',
        'Mantén la cadera baja y estable.',
      ],
    },
  },
  {
    id: 'bw_burpee',
    name: { en: 'Burpee', es: 'Burpee' },
    gif: 'https://media.giphy.com/media/3oEjHUiHRWCUe5h1tm/giphy.gif',
    muscle: ['full_body'],
    equipment: 'none',
    level: 'advanced',
    tags: ['high_impact', 'jumping', 'plyometric'],
    instructions: {
      en: [
        'Squat, place hands on the floor, jump feet back into a plank.',
        'Do a push-up (optional), jump feet forward.',
        'Explode up into a jump, arms overhead.',
      ],
      es: [
        'Sentadilla, manos al suelo, salta con los pies atrás a plancha.',
        'Haz una flexión (opcional), salta con los pies adelante.',
        'Salta arriba con los brazos extendidos.',
      ],
    },
  },
  {
    id: 'bw_crunch',
    name: { en: 'Crunch', es: 'Abdominal crunch' },
    gif: 'https://media.giphy.com/media/3o7TKtnuHOHHUjR38Y/giphy.gif',
    muscle: ['core'],
    equipment: 'none',
    level: 'beginner',
    tags: ['supine', 'crunch'],
    instructions: {
      en: [
        'Lie on your back, knees bent, hands at temples.',
        'Curl shoulders off the floor by contracting abs.',
        'Lower with control. Avoid pulling on the neck.',
      ],
      es: [
        'Túmbate boca arriba, rodillas flexionadas, manos en las sienes.',
        'Eleva los hombros del suelo contrayendo el abdomen.',
        'Baja con control. No tires del cuello.',
      ],
    },
  },
  {
    id: 'bw_jumpsquat',
    name: { en: 'Jump Squat', es: 'Sentadilla con salto' },
    gif: 'https://media.giphy.com/media/l3vR5gLWzg4HBoZWg/giphy.gif',
    muscle: ['lower', 'legs', 'glutes', 'full_body'],
    equipment: 'none',
    level: 'intermediate',
    tags: ['high_impact', 'jumping', 'plyometric', 'deep_squat'],
    instructions: {
      en: [
        'Lower into a squat.',
        'Explode up into a jump, swinging arms for momentum.',
        'Land softly with knees tracking over toes.',
      ],
      es: [
        'Baja a la sentadilla.',
        'Salta hacia arriba impulsando con los brazos.',
        'Aterriza suave con rodillas alineadas con los pies.',
      ],
    },
  },
  {
    id: 'bw_birddog',
    name: { en: 'Bird Dog', es: 'Bird dog' },
    gif: 'https://media.giphy.com/media/3oEjI80rTAvF6CqKWA/giphy.gif',
    muscle: ['core', 'glutes'],
    equipment: 'none',
    level: 'beginner',
    tags: [],
    instructions: {
      en: [
        'Start on hands and knees.',
        'Extend opposite arm and leg until level with the torso.',
        'Pause, return, switch sides.',
      ],
      es: [
        'A cuatro patas.',
        'Estira brazo y pierna contrarios hasta la altura del torso.',
        'Pausa, vuelve y cambia.',
      ],
    },
  },
  {
    id: 'bw_walk',
    name: { en: 'Brisk Walk', es: 'Caminata enérgica' },
    gif: 'https://media.giphy.com/media/3oEjI3Yd6N7QF0v80I/giphy.gif',
    muscle: ['full_body', 'lower'],
    equipment: 'none',
    level: 'beginner',
    tags: ['low_impact'],
    instructions: {
      en: [
        'Walk at a pace where you can talk but not sing.',
        'Land mid-foot, swing arms naturally.',
        'Stay upright, gaze ahead.',
      ],
      es: [
        'Camina a un ritmo en el que puedas hablar pero no cantar.',
        'Apoya el medio pie, balancea los brazos con naturalidad.',
        'Espalda erguida, mirada al frente.',
      ],
    },
  },
  {
    id: 'bw_wallpushup',
    name: { en: 'Wall Push-up', es: 'Flexión en pared' },
    gif: 'https://media.giphy.com/media/26FPq3JzFqEd8cPtu/giphy.gif',
    muscle: ['upper', 'push'],
    equipment: 'none',
    level: 'beginner',
    tags: ['low_impact'],
    instructions: {
      en: [
        'Stand arm-length from a wall, hands at shoulder height.',
        'Bend elbows to bring chest toward the wall.',
        'Press back to start.',
      ],
      es: [
        'Frente a una pared, brazos extendidos, manos a la altura de los hombros.',
        'Flexiona los codos llevando el pecho a la pared.',
        'Empuja para volver.',
      ],
    },
  },

  // ---------- DUMBBELLS ----------
  {
    id: 'db_press',
    name: { en: 'Dumbbell Bench Press', es: 'Press de banca con mancuernas' },
    gif: 'https://media.giphy.com/media/26gscMvMLZWzMyqxa/giphy.gif',
    muscle: ['upper', 'push'],
    equipment: 'dumbbells',
    level: 'intermediate',
    tags: ['supine', 'bench_press_heavy'],
    instructions: {
      en: [
        'Lie on a bench, dumbbells at chest level.',
        'Press up until arms are extended over the chest.',
        'Lower with control to start.',
      ],
      es: [
        'Túmbate en un banco, mancuernas a la altura del pecho.',
        'Empuja hasta extender los brazos sobre el pecho.',
        'Baja con control.',
      ],
    },
  },
  {
    id: 'db_row',
    name: { en: 'Dumbbell Row', es: 'Remo con mancuerna' },
    gif: 'https://media.giphy.com/media/3o7TKsrfkN7g3vQk6A/giphy.gif',
    muscle: ['upper', 'pull'],
    equipment: 'dumbbells',
    level: 'beginner',
    tags: [],
    instructions: {
      en: [
        'Hinge at the hips, one knee on a bench, dumbbell in opposite hand.',
        'Row the weight to your hip, squeezing the back.',
        'Lower with control.',
      ],
      es: [
        'Inclínate hacia delante con una rodilla apoyada en un banco, mancuerna en la mano opuesta.',
        'Lleva la mancuerna hacia la cadera apretando la espalda.',
        'Baja con control.',
      ],
    },
  },
  {
    id: 'db_goblet',
    name: { en: 'Goblet Squat', es: 'Sentadilla goblet' },
    gif: 'https://media.giphy.com/media/1qfKlNPxguL3UV4o2k/giphy.gif',
    muscle: ['lower', 'legs', 'glutes'],
    equipment: 'dumbbells',
    level: 'beginner',
    tags: [],
    instructions: {
      en: [
        'Hold a dumbbell vertically at chest height.',
        'Squat down keeping torso upright.',
        'Drive up through heels.',
      ],
      es: [
        'Sostén una mancuerna vertical a la altura del pecho.',
        'Baja a la sentadilla con el torso erguido.',
        'Sube empujando con los talones.',
      ],
    },
  },
  {
    id: 'db_curl',
    name: { en: 'Dumbbell Curl', es: 'Curl de bíceps con mancuernas' },
    gif: 'https://media.giphy.com/media/26FPq3JzFqEd8cPtu/giphy.gif',
    muscle: ['upper', 'pull'],
    equipment: 'dumbbells',
    level: 'beginner',
    tags: [],
    instructions: {
      en: [
        'Stand tall, dumbbells at sides, palms forward.',
        'Curl the weights to your shoulders.',
        'Lower slowly.',
      ],
      es: [
        'De pie, mancuernas a los lados, palmas al frente.',
        'Sube las mancuernas a los hombros.',
        'Baja despacio.',
      ],
    },
  },
  {
    id: 'db_overhead',
    name: { en: 'Dumbbell Shoulder Press', es: 'Press de hombros con mancuernas' },
    gif: 'https://media.giphy.com/media/3o7TKsrfkN7g3vQk6A/giphy.gif',
    muscle: ['upper', 'push'],
    equipment: 'dumbbells',
    level: 'intermediate',
    tags: ['overhead', 'overhead_press'],
    instructions: {
      en: [
        'Sit or stand, dumbbells at shoulder height, palms forward.',
        'Press overhead until arms are extended.',
        'Lower with control.',
      ],
      es: [
        'Sentado o de pie, mancuernas a la altura de los hombros, palmas al frente.',
        'Empuja sobre la cabeza hasta extender los brazos.',
        'Baja con control.',
      ],
    },
  },
  {
    id: 'db_rdl',
    name: { en: 'Dumbbell Romanian Deadlift', es: 'Peso muerto rumano con mancuernas' },
    gif: 'https://media.giphy.com/media/3o7TKsrfkN7g3vQk6A/giphy.gif',
    muscle: ['lower', 'glutes'],
    equipment: 'dumbbells',
    level: 'intermediate',
    tags: ['deadlift_loaded', 'spinal_load'],
    instructions: {
      en: [
        'Stand with dumbbells in front of thighs, soft knees.',
        'Hinge at the hips, lowering the dumbbells along your legs.',
        'Stand tall by driving hips forward.',
      ],
      es: [
        'De pie con mancuernas frente a los muslos, rodillas suaves.',
        'Bisagra de cadera, baja las mancuernas a lo largo de las piernas.',
        'Sube empujando la cadera al frente.',
      ],
    },
  },

  // ---------- BARBELL ----------
  {
    id: 'bb_squat',
    name: { en: 'Back Squat', es: 'Sentadilla con barra' },
    gif: 'https://media.giphy.com/media/3o7TKsrfkN7g3vQk6A/giphy.gif',
    muscle: ['lower', 'legs', 'glutes'],
    equipment: 'barbell',
    level: 'advanced',
    tags: ['heavy_compound', 'spinal_load', 'deep_squat'],
    instructions: {
      en: [
        'Bar across upper back, feet shoulder-width.',
        'Squat down with chest up.',
        'Drive up through heels to stand.',
      ],
      es: [
        'Barra sobre la espalda alta, pies a la anchura de los hombros.',
        'Baja a la sentadilla con el pecho arriba.',
        'Sube empujando con los talones.',
      ],
    },
  },
  {
    id: 'bb_bench',
    name: { en: 'Bench Press', es: 'Press de banca con barra' },
    gif: 'https://media.giphy.com/media/26gscMvMLZWzMyqxa/giphy.gif',
    muscle: ['upper', 'push'],
    equipment: 'barbell',
    level: 'advanced',
    tags: ['supine', 'bench_press_heavy', 'heavy_compound'],
    instructions: {
      en: [
        'Lie on a bench, grip slightly wider than shoulders.',
        'Lower the bar to mid-chest.',
        'Press back to lockout.',
      ],
      es: [
        'Túmbate en el banco, agarre algo más ancho que los hombros.',
        'Baja la barra al pecho medio.',
        'Empuja hasta extender los brazos.',
      ],
    },
  },
  {
    id: 'bb_deadlift',
    name: { en: 'Conventional Deadlift', es: 'Peso muerto convencional' },
    gif: 'https://media.giphy.com/media/3o7TKsrfkN7g3vQk6A/giphy.gif',
    muscle: ['full_body', 'pull', 'lower', 'glutes'],
    equipment: 'barbell',
    level: 'advanced',
    tags: ['heavy_compound', 'spinal_load', 'deadlift_loaded'],
    instructions: {
      en: [
        'Bar over mid-foot, hinge to grip.',
        'Brace, push the floor away to lift the bar.',
        'Stand tall, then lower with control.',
      ],
      es: [
        'Barra sobre el medio pie, bisagra para agarrar.',
        'Aprieta el core, empuja el suelo para levantar la barra.',
        'De pie, luego baja con control.',
      ],
    },
  },

  // ---------- BANDS ----------
  {
    id: 'band_row',
    name: { en: 'Band Row', es: 'Remo con banda' },
    gif: 'https://media.giphy.com/media/3o7TKsrfkN7g3vQk6A/giphy.gif',
    muscle: ['upper', 'pull'],
    equipment: 'bands',
    level: 'beginner',
    tags: [],
    instructions: {
      en: [
        'Anchor the band at chest height.',
        'Pull handles toward your ribs, squeezing shoulder blades.',
        'Return slowly.',
      ],
      es: [
        'Ancla la banda a la altura del pecho.',
        'Tira de los agarres hacia las costillas, juntando los omóplatos.',
        'Vuelve despacio.',
      ],
    },
  },
  {
    id: 'band_pullapart',
    name: { en: 'Band Pull-apart', es: 'Pull-apart con banda' },
    gif: 'https://media.giphy.com/media/26FPq3JzFqEd8cPtu/giphy.gif',
    muscle: ['upper', 'pull'],
    equipment: 'bands',
    level: 'beginner',
    tags: ['low_impact'],
    instructions: {
      en: [
        'Hold a band in front of you, arms extended.',
        'Pull the band apart by squeezing your upper back.',
        'Return slowly.',
      ],
      es: [
        'Sujeta una banda al frente con los brazos extendidos.',
        'Sepárala apretando la parte alta de la espalda.',
        'Vuelve despacio.',
      ],
    },
  },

  // ---------- KETTLEBELL ----------
  {
    id: 'kb_swing',
    name: { en: 'Kettlebell Swing', es: 'Swing con pesa rusa' },
    gif: 'https://media.giphy.com/media/3o7TKsrfkN7g3vQk6A/giphy.gif',
    muscle: ['full_body', 'glutes', 'lower'],
    equipment: 'kettlebell',
    level: 'intermediate',
    tags: ['heavy_compound', 'spinal_load'],
    instructions: {
      en: [
        'Hinge at hips, kettlebell between legs.',
        'Drive hips forward to swing the bell to chest height.',
        'Let it fall back into the hinge.',
      ],
      es: [
        'Bisagra de cadera, pesa entre las piernas.',
        'Empuja la cadera al frente para llevar la pesa a la altura del pecho.',
        'Déjala volver a la bisagra.',
      ],
    },
  },
];

/**
 * Filter exercises so we only ever return ones that have a GIF.
 */
export const SAFE_EXERCISES = FALLBACK_EXERCISES.filter((e) => !!e.gif);
