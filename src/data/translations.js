// All UI strings live here. Add a key once, translate twice.

export const translations = {
  en: {
    appName: 'VIGORIX',
    tagline: 'Smart workouts. Built for your body.',

    nav: {
      chat: 'Chat',
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
      loading: 'Loading…',
      empty: 'Nothing here yet.',
      minutes: 'min',
      seconds: 'sec',
      sets: 'sets',
      reps: 'reps',
      rest: 'rest',
      export: 'Export PDF',
      done: 'Done',
      next: 'Next',
      retry: 'Retry',
      optional: 'optional',
      loadingExercises: 'Loading exercise database…',
    },

    onboarding: {
      title: 'Welcome to VIGORIX',
      sub: 'Generate safe, structured workouts in seconds. Free, bilingual, no account required.',
      cta: 'Get started',
    },

    disclaimer: {
      title: 'Important: This is not medical advice',
      body:
        'VIGORIX provides general fitness suggestions for informational purposes only. It is not a substitute for medical advice, diagnosis, or treatment. Always consult a qualified healthcare professional before starting any exercise program, especially if you are pregnant, recovering from injury, or have any medical condition. You are solely responsible for your use of this information.',
      ack: 'I understand and accept',
      revisit: 'View disclaimer',
    },

    chat: {
      title: 'Plan a workout',
      placeholder: 'e.g. chest and back, 8 exercises, dumbbells and barbell',
      hintPrompt: 'Or use the guided form',
      generate: 'Generate workout',
      regenerate: 'Regenerate',
      thinking: 'Building your routine…',
      yourRequest: 'Your request',
      generated: 'Your workout',
      clear: 'Clear chat',
      replaceExercise: 'Replace this exercise',
      replacingExercise: 'Finding alternative…',
      noAlternative: 'I could not find a valid alternative with your current filters.',
      noResults:
        "I couldn't find exercises that match all those filters. Try fewer constraints, more equipment options, or a different muscle group.",
      welcome:
        "Hi! Tell me what routine you want and I'll ask what I need to build it properly.",
    },

    form: {
      goal: 'Goal',
      muscle: 'Muscle group',
      muscles: 'Muscle groups',
      equipment: 'Equipment',
      equipmentAvailable: 'Available equipment',
      time: 'Time available',
      exerciseCount: 'Number of exercises',
      level: 'Level',
      condition: 'Physical condition',
      conditionPlaceholder: 'Pregnancy, knee pain, back pain, shoulder pain, etc. (optional)',

      goals: {
        strength: 'Strength',
        hypertrophy: 'Muscle growth',
        endurance: 'Endurance',
        fatloss: 'Fat loss',
        mobility: 'Mobility',
        general: 'General fitness',
      },

      muscles: {
        full_body: 'Full body',
        upper: 'Upper body',
        lower: 'Lower body',
        core: 'Core',
        push: 'Push (chest/shoulders/triceps)',
        pull: 'Pull (back/biceps)',
        legs: 'Complete legs',
        glutes: 'Glutes',
        chest: 'Chest',
        back: 'Back',
        lats: 'Back (lats)',
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

      equipments: {
        any: 'Any',
        none: 'Bodyweight',
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

      levels: {
        beginner: 'Beginner',
        intermediate: 'Intermediate',
        advanced: 'Advanced',
      },
    },

    exercise: {
      instructions: 'Instructions',
      section: 'Section',
      startTimer: 'Start rest',
      timerLabel: 'Rest',
      logSet: 'Log set',
      weight: 'Weight',
      notes: 'Notes',
      kg: 'kg',
      lb: 'lb',
      watchTutorial: 'Watch tutorial on YouTube',
      replace: 'Replace this exercise',
      replacing: 'Finding alternative…',
    },

    safety: {
      bannerTitle: 'Safety notice',
      bannerBody:
        'Based on what you described, this routine has been adjusted to lower-impact options. This is not medical clearance. Please consult a qualified professional before exercising.',
      flagged: 'Flagged for your condition',
      removed: 'Removed for safety',
      adjusted: 'Adjusted intensity',
    },

    saved: {
      title: 'Saved routines',
      empty: 'No saved routines yet. Generate one in Chat and tap Save.',
      saveBtn: 'Save routine',
      named: 'Routine name',
      defaultName: 'Routine',
    },

    progress: {
      title: 'Progress',
      empty: 'No logs yet. Log a set after completing an exercise.',
      bodyWeight: 'Body weight',
      addBodyWeight: 'Log body weight',
      recentLogs: 'Recent sets',
      bodyWeightHistory: 'Body weight history',
      exercise: 'Exercise',
      date: 'Date',
    },

    auth: {
      title: 'Account',
      sub: 'Sign in to sync routines across devices. Optional — the app works fully without an account.',
      email: 'Email',
      password: 'Password',
      signIn: 'Sign in',
      signUp: 'Create account',
      signOut: 'Sign out',
      orContinue: 'Or continue without an account',
      signedInAs: 'Signed in as',
      noSupabase:
        'Supabase is not configured in this build. Sign-in is disabled. Your data is stored locally on this device.',
      err: {
        generic: 'Something went wrong. Please try again.',
      },
    },

    errors: {
      saveFailed: 'Could not save. Try again.',
    },
  },

  es: {
    appName: 'VIGORIX',
    tagline: 'Entrenamientos inteligentes. Hechos para tu cuerpo.',

    nav: {
      chat: 'Chat',
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
      loading: 'Cargando…',
      empty: 'Nada por aquí aún.',
      minutes: 'min',
      seconds: 'seg',
      sets: 'series',
      reps: 'reps',
      rest: 'descanso',
      export: 'Exportar PDF',
      done: 'Listo',
      next: 'Siguiente',
      retry: 'Reintentar',
      optional: 'opcional',
      loadingExercises: 'Cargando base de ejercicios…',
    },

    onboarding: {
      title: 'Bienvenido a VIGORIX',
      sub: 'Genera rutinas seguras y estructuradas en segundos. Gratis, bilingüe, sin cuenta requerida.',
      cta: 'Empezar',
    },

    disclaimer: {
      title: 'Importante: esto no es asesoramiento médico',
      body:
        'VIGORIX ofrece sugerencias generales de ejercicio con fines informativos. No sustituye el consejo, diagnóstico o tratamiento médico. Consulta siempre a un profesional de la salud cualificado antes de iniciar cualquier programa de ejercicio, especialmente si estás embarazada, en recuperación de una lesión o tienes alguna condición médica. Eres responsable del uso que hagas de esta información.',
      ack: 'Entiendo y acepto',
      revisit: 'Ver aviso legal',
    },

    chat: {
      title: 'Planifica un entrenamiento',
      placeholder: 'Ej.: pecho y espalda, 8 ejercicios, mancuernas y barra',
      hintPrompt: 'O usa el formulario guiado',
      generate: 'Generar rutina',
      regenerate: 'Regenerar',
      thinking: 'Armando tu rutina…',
      yourRequest: 'Tu solicitud',
      generated: 'Tu rutina',
      clear: 'Borrar chat',
      replaceExercise: 'Cambiar este ejercicio',
      replacingExercise: 'Buscando alternativa…',
      noAlternative: 'No encontré una alternativa válida con tus filtros actuales.',
      noResults:
        'No encontré ejercicios que coincidan con todos los filtros. Prueba con menos restricciones, más equipo disponible o cambia el grupo muscular.',
      welcome:
        '¡Hola! Dime qué rutina quieres y te voy preguntando lo necesario para armarla bien.',
    },

    form: {
      goal: 'Objetivo',
      muscle: 'Grupo muscular',
      muscles: 'Grupos musculares',
      equipment: 'Equipo',
      equipmentAvailable: 'Equipo disponible',
      time: 'Tiempo disponible',
      exerciseCount: 'Número de ejercicios',
      level: 'Nivel',
      condition: 'Condición física',
      conditionPlaceholder: 'Embarazo, dolor de rodilla, espalda, hombro, etc. (opcional)',

      goals: {
        strength: 'Fuerza',
        hypertrophy: 'Hipertrofia',
        endurance: 'Resistencia',
        fatloss: 'Pérdida de grasa',
        mobility: 'Movilidad',
        general: 'Forma general',
      },

      muscles: {
        full_body: 'Cuerpo completo',
        upper: 'Tren superior',
        lower: 'Tren inferior',
        core: 'Core',
        push: 'Empuje (pecho/hombros/tríceps)',
        pull: 'Tirón (espalda/bíceps)',
        legs: 'Pierna completa',
        glutes: 'Glúteos',
        chest: 'Pecho',
        back: 'Espalda',
        lats: 'Espalda (dorsales)',
        shoulders: 'Hombros',
        biceps: 'Bíceps',
        triceps: 'Tríceps',
        traps: 'Trapecio',
        forearms: 'Antebrazos',
        quadriceps: 'Cuádriceps',
        hamstrings: 'Femoral / isquios',
        calves: 'Pantorrillas',
        abdominals: 'Abdominales',
      },

      equipments: {
        any: 'Cualquiera',
        none: 'Peso corporal',
        dumbbells: 'Mancuernas',
        barbell: 'Barra',
        bands: 'Bandas',
        machines: 'Máquinas / polea',
        kettlebell: 'Pesa rusa',
        medicine_ball: 'Balón medicinal',
        exercise_ball: 'Pelota de ejercicio',
        foam_roll: 'Foam roller',
        other: 'Otro',
      },

      levels: {
        beginner: 'Principiante',
        intermediate: 'Intermedio',
        advanced: 'Avanzado',
      },
    },

    exercise: {
      instructions: 'Instrucciones',
      section: 'Sección',
      startTimer: 'Iniciar descanso',
      timerLabel: 'Descanso',
      logSet: 'Registrar serie',
      weight: 'Peso',
      notes: 'Notas',
      kg: 'kg',
      lb: 'lb',
      watchTutorial: 'Ver tutorial en YouTube',
      replace: 'Cambiar este ejercicio',
      replacing: 'Buscando alternativa…',
    },

    safety: {
      bannerTitle: 'Aviso de seguridad',
      bannerBody:
        'Según lo que describiste, esta rutina se ajustó a opciones de menor impacto. Esto no constituye autorización médica. Consulta a un profesional cualificado antes de entrenar.',
      flagged: 'Marcado por tu condición',
      removed: 'Eliminado por seguridad',
      adjusted: 'Intensidad ajustada',
    },

    saved: {
      title: 'Rutinas guardadas',
      empty: 'No tienes rutinas guardadas. Genera una en el Chat y toca Guardar.',
      saveBtn: 'Guardar rutina',
      named: 'Nombre de la rutina',
      defaultName: 'Rutina',
    },

    progress: {
      title: 'Progreso',
      empty: 'Sin registros. Registra una serie tras completar un ejercicio.',
      bodyWeight: 'Peso corporal',
      addBodyWeight: 'Registrar peso corporal',
      recentLogs: 'Series recientes',
      bodyWeightHistory: 'Historial de peso corporal',
      exercise: 'Ejercicio',
      date: 'Fecha',
    },

    auth: {
      title: 'Cuenta',
      sub: 'Inicia sesión para sincronizar rutinas entre dispositivos. Opcional: la app funciona sin cuenta.',
      email: 'Correo',
      password: 'Contraseña',
      signIn: 'Iniciar sesión',
      signUp: 'Crear cuenta',
      signOut: 'Cerrar sesión',
      orContinue: 'O continúa sin cuenta',
      signedInAs: 'Sesión iniciada como',
      noSupabase:
        'Supabase no está configurado en esta versión. El inicio de sesión está desactivado. Tus datos se guardan localmente en este dispositivo.',
      err: {
        generic: 'Algo salió mal. Inténtalo de nuevo.',
      },
    },

    errors: {
      saveFailed: 'No se pudo guardar. Inténtalo de nuevo.',
    },
  },
};

export const LANGS = ['en', 'es'];
export const DEFAULT_LANG = 'en';
