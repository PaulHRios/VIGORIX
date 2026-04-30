// src/data/translations.js
// All UI strings live here. Add a key once, translate twice.

export const translations = {
  en: {
    appName: 'VIGORIX',
    tagline: 'Smart workouts. Built for your body.',

    nav: {
      builder: 'Builder',
      saved: 'Saved',
      progress: 'Progress',
      account: 'Account',
    },

    common: {
      start: 'Start',
      cancel: 'Cancel',
      save: 'Save',
      saved: 'Saved',
      delete: 'Delete',
      confirm: 'Confirm',
      close: 'Close',
      back: 'Back',
      next: 'Next',
      done: 'Done',
      retry: 'Retry',
      loading: 'Loading…',
      empty: 'Nothing here yet.',
      minutes: 'min',
      seconds: 'sec',
      sets: 'sets',
      reps: 'reps',
      rest: 'rest',
      export: 'Export PDF',
      optional: 'optional',
      continue: 'Continue',
      generate: 'Generate routine',
      day: 'Day',
      days: 'Days',
    },

    onboarding: {
      welcome: 'Welcome to VIGORIX',
      sub: 'Answer 5 quick questions to get a routine built for you.',
      step: 'Step',
      of: 'of',

      sexQ: 'What is your biological sex?',
      sex: {
        male: 'Male',
        female: 'Female',
        other: 'Prefer not to say',
      },

      ageQ: 'How old are you?',
      agePlaceholder: 'Age',
      ageHint: 'Used to adjust intensity, never shared.',
      ageError: 'Please enter a valid age (10-99).',

      goalQ: 'What is your main goal?',
      goals: {
        strength: 'Strength',
        hypertrophy: 'Build muscle',
        endurance: 'Endurance',
        fatloss: 'Lose fat',
        mobility: 'Mobility',
        general: 'Stay in shape',
      },
      goalHint: {
        strength: 'Heavy weights, low reps, long rest.',
        hypertrophy: 'Moderate weights, 8–12 reps, ~75 s rest.',
        endurance: 'Light weights, high reps, short rest.',
        fatloss: 'High volume, short rest.',
        mobility: 'Slow, controlled, no heavy load.',
        general: 'Balanced overall fitness.',
      },

      levelQ: 'What is your training level?',
      levels: {
        beginner: 'Beginner',
        balanced: 'Balanced',
        advanced: 'Advanced',
        gym_rat: 'Gym rat',
      },
      levelHint: {
        beginner: 'Simple movements, no advanced techniques.',
        balanced: 'Moderate volume, all common movements.',
        advanced: 'Higher volume, controlled intensity.',
        gym_rat: 'Supersets, drop sets, max stimulus.',
      },

      equipmentQ: 'What equipment do you have?',
      equipmentHint: 'Pick all that apply. We will only suggest exercises you can actually do.',

      conditionQ: 'Any injury or condition we should know about?',
      conditionPlaceholder: 'e.g. knee pain, pregnancy, lower back. Leave empty if none.',
      conditionSkip: 'Skip',

      finish: 'Save & continue',
    },

    builder: {
      title: 'Plan a workout',
      sub: 'How would you like to train?',

      typeQ: 'Pick a routine type',
      types: {
        single: 'Today\'s routine',
        weekly: 'Weekly plan',
      },
      typeHint: {
        single: 'One workout for right now.',
        weekly: 'A 2–6 day split for the whole week.',
      },

      // Single-day builder
      singleTitle: 'Today\'s routine',
      muscleQ: 'Target muscle group',
      countQ: 'Number of exercises',
      timeQ: 'Time available',
      reviewTitle: 'Ready to generate',

      // Weekly builder
      weeklyTitle: 'Weekly plan',
      daysQ: 'How many days per week will you train?',
      daysHint: 'We pick the optimal split for your level and goal.',
      splitPreview: 'Suggested split',

      profileSummary: 'Your profile',
      editProfile: 'Edit profile',
    },

    loading: {
      analyzing: 'Analyzing your muscles…',
      filtering: 'Filtering exercises…',
      avoidingJunk: 'Avoiding junk routines…',
      balancing: 'Balancing volume across subgroups…',
      finalizing: 'Building your routine…',
    },

    form: {
      goal: 'Goal',
      muscle: 'Muscle group',
      muscles: 'Muscles',
      equipment: 'Equipment',
      time: 'Time',
      level: 'Level',
      condition: 'Conditions',
      conditionPlaceholder: 'Pregnancy, knee pain, back pain, etc. (optional)',

      muscleOptions: {
        full_body: 'Full body',
        upper: 'Upper body',
        lower: 'Lower body',
        core: 'Core',
        push: 'Push (chest/shoulders/triceps)',
        pull: 'Pull (back/biceps)',
        legs: 'Legs',
        glutes: 'Glutes',
        chest: 'Chest',
        back: 'Back',
        lats: 'Lats',
        shoulders: 'Shoulders',
        biceps: 'Biceps',
        triceps: 'Triceps',
        traps: 'Traps',
        forearms: 'Forearms',
        quadriceps: 'Quads',
        hamstrings: 'Hamstrings',
        calves: 'Calves',
        abdominals: 'Abs',
      },

      equipmentOptions: {
        any: 'Any',
        none: 'No equipment',
        dumbbells: 'Dumbbells',
        barbell: 'Barbell',
        bands: 'Bands',
        machines: 'Machines / Cable',
        kettlebell: 'Kettlebell',
        medicine_ball: 'Medicine ball',
        exercise_ball: 'Exercise ball',
        foam_roll: 'Foam roller',
        other: 'Other',
      },
    },

    exercise: {
      instructions: 'Instructions',
      startTimer: 'Start rest',
      timerLabel: 'Rest',
      logSet: 'Log set',
      weight: 'Weight',
      notes: 'Notes',
      kg: 'kg',
      lb: 'lb',
      watchTutorial: 'Watch tutorial on YouTube',
      replace: 'Replace exercise',
      replacing: 'Finding alternative…',
      replaced: 'Swapped',
      noAlternative: 'No alternative found with current filters.',

      primaryMuscle: 'Primary',
      subgroup: 'Subgroup',
      secondaryMuscles: 'Secondary',
      level: 'Level',
      technique: 'Technique',

      techniques: {
        straight: 'Straight sets',
        superset: 'Superset',
        triset: 'Tri-set',
        dropset: 'Drop set',
      },
    },

    safety: {
      bannerTitle: 'Safety notice',
      bannerBody:
        'Based on what you described, this routine has been adjusted to lower-impact options. This is not medical clearance — please consult a qualified professional before exercising.',
      minorWarning: 'You are under 16. Please train under adult supervision.',
      seniorWarning: 'For people 60+, we suggest consulting your doctor first.',
    },

    saved: {
      title: 'Saved routines',
      empty: 'No saved routines yet. Build one and tap Save.',
      saveBtn: 'Save routine',
      named: 'Routine name',
      defaultName: 'Routine',
      weeklyName: 'Weekly plan',
    },

    progress: {
      title: 'Progress',
      empty: 'No logs yet. Log a set after completing an exercise.',
      bodyWeight: 'Body weight',
      addBodyWeight: 'Log body weight',
      recentLogs: 'Recent sets',
      bodyWeightHistory: 'Body weight history',
    },

    auth: {
      title: 'Account',
      sub: 'Sign in to sync routines across devices. Optional — the app works fully without an account.',
      email: 'Email',
      password: 'Password',
      signIn: 'Sign in',
      signUp: 'Create account',
      signOut: 'Sign out',
      signedInAs: 'Signed in as',
      noSupabase:
        'Sign-in is disabled in this build. Your data is stored locally on this device.',
      err: { generic: 'Something went wrong. Please try again.' },

      profile: 'Your profile',
      resetProfile: 'Reset profile',
      resetProfileConfirm: 'Reset your profile and answers?',
    },

    disclaimer: {
      title: 'Important: This is not medical advice',
      body:
        'VIGORIX provides general fitness suggestions for informational purposes only. It is not a substitute for medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before starting any exercise program — especially if you are pregnant, recovering from injury, or have any medical condition. You are solely responsible for your use of this information.',
      ack: 'I understand and accept',
      revisit: 'View disclaimer',
    },

    weekly: {
      title: 'Weekly plan',
      day: 'Day',
      rest: 'Rest day',
      generated: 'Your weekly plan',
      summary: 'Plan summary',
    },

    errors: {
      saveFailed: 'Could not save. Try again.',
    },
  },

  es: {
    appName: 'VIGORIX',
    tagline: 'Entrenamientos inteligentes. Hechos para tu cuerpo.',

    nav: {
      builder: 'Crear',
      saved: 'Guardadas',
      progress: 'Progreso',
      account: 'Cuenta',
    },

    common: {
      start: 'Comenzar',
      cancel: 'Cancelar',
      save: 'Guardar',
      saved: 'Guardado',
      delete: 'Eliminar',
      confirm: 'Confirmar',
      close: 'Cerrar',
      back: 'Volver',
      next: 'Siguiente',
      done: 'Listo',
      retry: 'Reintentar',
      loading: 'Cargando…',
      empty: 'Nada por aquí aún.',
      minutes: 'min',
      seconds: 'seg',
      sets: 'series',
      reps: 'reps',
      rest: 'descanso',
      export: 'Exportar PDF',
      optional: 'opcional',
      continue: 'Continuar',
      generate: 'Generar rutina',
      day: 'Día',
      days: 'Días',
    },

    onboarding: {
      welcome: 'Bienvenido a VIGORIX',
      sub: 'Responde 5 preguntas rápidas para armar tu rutina.',
      step: 'Paso',
      of: 'de',

      sexQ: '¿Cuál es tu sexo biológico?',
      sex: {
        male: 'Masculino',
        female: 'Femenino',
        other: 'Prefiero no decir',
      },

      ageQ: '¿Cuántos años tienes?',
      agePlaceholder: 'Edad',
      ageHint: 'Se usa para ajustar la intensidad. Nunca se comparte.',
      ageError: 'Ingresa una edad válida (10-99).',

      goalQ: '¿Cuál es tu objetivo principal?',
      goals: {
        strength: 'Fuerza',
        hypertrophy: 'Ganar músculo',
        endurance: 'Resistencia',
        fatloss: 'Bajar grasa',
        mobility: 'Movilidad',
        general: 'Mantenerme en forma',
      },
      goalHint: {
        strength: 'Mucho peso, pocas reps, descansos largos.',
        hypertrophy: 'Peso medio, 8–12 reps, ~75 s descanso.',
        endurance: 'Poco peso, muchas reps, descansos cortos.',
        fatloss: 'Volumen alto, descansos cortos.',
        mobility: 'Lento, controlado, sin carga pesada.',
        general: 'Forma física equilibrada.',
      },

      levelQ: '¿Cuál es tu nivel de entrenamiento?',
      levels: {
        beginner: 'Principiante',
        balanced: 'Equilibrado',
        advanced: 'Avanzado',
        gym_rat: 'Gym rat',
      },
      levelHint: {
        beginner: 'Movimientos simples, sin técnicas avanzadas.',
        balanced: 'Volumen moderado, ejercicios comunes.',
        advanced: 'Más volumen, intensidad controlada.',
        gym_rat: 'Bi-series, tri-series, dropsets, máximo estímulo.',
      },

      equipmentQ: '¿Qué equipo tienes disponible?',
      equipmentHint: 'Marca todos los que aplican. Solo te sugerimos lo que puedes hacer.',

      conditionQ: '¿Tienes alguna lesión o condición que debamos saber?',
      conditionPlaceholder: 'Ej.: dolor de rodilla, embarazo, espalda baja. Vacío si nada.',
      conditionSkip: 'Saltar',

      finish: 'Guardar y continuar',
    },

    builder: {
      title: 'Planifica un entrenamiento',
      sub: '¿Cómo te gustaría entrenar?',

      typeQ: 'Elige el tipo de rutina',
      types: {
        single: 'Rutina del día',
        weekly: 'Plan semanal',
      },
      typeHint: {
        single: 'Un entreno para hoy.',
        weekly: 'División de 2 a 6 días para toda la semana.',
      },

      singleTitle: 'Rutina del día',
      muscleQ: 'Grupo muscular objetivo',
      countQ: 'Número de ejercicios',
      timeQ: 'Tiempo disponible',
      reviewTitle: 'Listo para generar',

      weeklyTitle: 'Plan semanal',
      daysQ: '¿Cuántos días por semana entrenarás?',
      daysHint: 'Elegimos la mejor división según tu nivel y objetivo.',
      splitPreview: 'División sugerida',

      profileSummary: 'Tu perfil',
      editProfile: 'Editar perfil',
    },

    loading: {
      analyzing: 'Analizando tus músculos…',
      filtering: 'Filtrando ejercicios…',
      avoidingJunk: 'Evitando rutinas basura…',
      balancing: 'Balanceando volumen entre subgrupos…',
      finalizing: 'Armando tu rutina…',
    },

    form: {
      goal: 'Objetivo',
      muscle: 'Grupo muscular',
      muscles: 'Músculos',
      equipment: 'Equipo',
      time: 'Tiempo',
      level: 'Nivel',
      condition: 'Condiciones',
      conditionPlaceholder: 'Embarazo, dolor de rodilla, espalda, etc. (opcional)',

      muscleOptions: {
        full_body: 'Cuerpo completo',
        upper: 'Tren superior',
        lower: 'Tren inferior',
        core: 'Core',
        push: 'Empuje (pecho/hombros/tríceps)',
        pull: 'Tirón (espalda/bíceps)',
        legs: 'Piernas',
        glutes: 'Glúteos',
        chest: 'Pecho',
        back: 'Espalda',
        lats: 'Dorsales',
        shoulders: 'Hombros',
        biceps: 'Bíceps',
        triceps: 'Tríceps',
        traps: 'Trapecio',
        forearms: 'Antebrazos',
        quadriceps: 'Cuádriceps',
        hamstrings: 'Isquios',
        calves: 'Pantorrillas',
        abdominals: 'Abdominales',
      },

      equipmentOptions: {
        any: 'Cualquiera',
        none: 'Sin equipo',
        dumbbells: 'Mancuernas',
        barbell: 'Barra',
        bands: 'Bandas',
        machines: 'Máquinas / Polea',
        kettlebell: 'Kettlebell',
        medicine_ball: 'Balón medicinal',
        exercise_ball: 'Pelota de ejercicio',
        foam_roll: 'Foam roller',
        other: 'Otro',
      },
    },

    exercise: {
      instructions: 'Instrucciones',
      startTimer: 'Iniciar descanso',
      timerLabel: 'Descanso',
      logSet: 'Registrar serie',
      weight: 'Peso',
      notes: 'Notas',
      kg: 'kg',
      lb: 'lb',
      watchTutorial: 'Ver tutorial en YouTube',
      replace: 'Sustituir ejercicio',
      replacing: 'Buscando alternativa…',
      replaced: 'Sustituido',
      noAlternative: 'No hay alternativa con los filtros actuales.',

      primaryMuscle: 'Principal',
      subgroup: 'Subgrupo',
      secondaryMuscles: 'Secundarios',
      level: 'Nivel',
      technique: 'Técnica',

      techniques: {
        straight: 'Series rectas',
        superset: 'Bi-serie',
        triset: 'Tri-serie',
        dropset: 'Drop set',
      },
    },

    safety: {
      bannerTitle: 'Aviso de seguridad',
      bannerBody:
        'Según lo que describiste, esta rutina se ajustó a opciones de menor impacto. Esto no constituye autorización médica — consulta a un profesional cualificado antes de entrenar.',
      minorWarning: 'Eres menor de 16 años. Entrena bajo supervisión adulta.',
      seniorWarning: 'Para mayores de 60 años, consulta a tu médico antes de empezar.',
    },

    saved: {
      title: 'Rutinas guardadas',
      empty: 'No tienes rutinas guardadas. Genera una y toca Guardar.',
      saveBtn: 'Guardar rutina',
      named: 'Nombre de la rutina',
      defaultName: 'Rutina',
      weeklyName: 'Plan semanal',
    },

    progress: {
      title: 'Progreso',
      empty: 'Sin registros. Registra una serie tras completar un ejercicio.',
      bodyWeight: 'Peso corporal',
      addBodyWeight: 'Registrar peso corporal',
      recentLogs: 'Series recientes',
      bodyWeightHistory: 'Historial de peso corporal',
    },

    auth: {
      title: 'Cuenta',
      sub: 'Inicia sesión para sincronizar rutinas entre dispositivos. Opcional — la app funciona sin cuenta.',
      email: 'Correo',
      password: 'Contraseña',
      signIn: 'Iniciar sesión',
      signUp: 'Crear cuenta',
      signOut: 'Cerrar sesión',
      signedInAs: 'Sesión iniciada como',
      noSupabase:
        'El inicio de sesión está desactivado en esta versión. Tus datos se guardan localmente en este dispositivo.',
      err: { generic: 'Algo salió mal. Inténtalo de nuevo.' },

      profile: 'Tu perfil',
      resetProfile: 'Reiniciar perfil',
      resetProfileConfirm: '¿Reiniciar tu perfil y respuestas?',
    },

    disclaimer: {
      title: 'Importante: esto no es asesoramiento médico',
      body:
        'VIGORIX ofrece sugerencias generales de ejercicio con fines informativos. No sustituye el consejo, diagnóstico o tratamiento médico. Consulta siempre a un profesional de la salud cualificado antes de iniciar cualquier programa de ejercicio — especialmente si estás embarazada, en recuperación de una lesión o tienes alguna condición médica. Eres responsable del uso que hagas de esta información.',
      ack: 'Entiendo y acepto',
      revisit: 'Ver aviso legal',
    },

    weekly: {
      title: 'Plan semanal',
      day: 'Día',
      rest: 'Día de descanso',
      generated: 'Tu plan semanal',
      summary: 'Resumen del plan',
    },

    errors: {
      saveFailed: 'No se pudo guardar. Inténtalo de nuevo.',
    },
  },
};

export const LANGS = ['en', 'es'];
export const DEFAULT_LANG = 'en';

// Localized labels for muscle subgroups (used in ExerciseCard).
// Keys match the SECTION_LABELS in workoutGenerator + raw muscle names.
export const SUBGROUP_LABELS = {
  // Chest sections
  upper_chest: { en: 'Upper chest', es: 'Pecho superior' },
  middle_chest: { en: 'Middle chest', es: 'Pecho medio' },
  lower_chest: { en: 'Lower chest', es: 'Pecho inferior' },
  chest_isolation: { en: 'Chest isolation', es: 'Aislamiento de pecho' },

  // Back
  lats: { en: 'Lats', es: 'Dorsales' },
  middle_back: { en: 'Middle back', es: 'Espalda media' },
  lower_back: { en: 'Lower back', es: 'Espalda baja' },
  traps: { en: 'Traps', es: 'Trapecio' },

  // Legs
  quadriceps: { en: 'Quadriceps', es: 'Cuádriceps' },
  hamstrings: { en: 'Hamstrings', es: 'Femoral' },
  glutes: { en: 'Glutes', es: 'Glúteos' },
  calves: { en: 'Calves', es: 'Pantorrilla' },
  adductors: { en: 'Adductors', es: 'Aductores' },
  abductors: { en: 'Abductors', es: 'Abductores' },

  // Shoulders
  front_delts: { en: 'Front delts', es: 'Deltoide frontal' },
  side_delts: { en: 'Side delts', es: 'Deltoide lateral' },
  rear_delts: { en: 'Rear delts', es: 'Deltoide posterior' },
  shoulders: { en: 'Shoulders', es: 'Hombros' },

  // Arms
  biceps: { en: 'Biceps', es: 'Bíceps' },
  triceps: { en: 'Triceps', es: 'Tríceps' },
  forearms: { en: 'Forearms', es: 'Antebrazos' },

  // Other
  chest: { en: 'Chest', es: 'Pecho' },
  back: { en: 'Back', es: 'Espalda' },
  abdominals: { en: 'Abs', es: 'Abdomen' },
  core: { en: 'Core', es: 'Core' },
  neck: { en: 'Neck', es: 'Cuello' },
  general: { en: 'General', es: 'General' },
};

export function localizeSubgroup(key, lang = 'en') {
  if (!key) return null;
  const entry = SUBGROUP_LABELS[key];
  if (!entry) return key;
  return entry[lang] || entry.en || key;
}
