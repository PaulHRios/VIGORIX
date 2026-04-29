// Condition tags and the keywords (ES + EN) that trigger them.
// Each condition lists "avoid" tags — exercise tags we will filter out — and
// "intensityModifier" — a multiplier we apply to set/rep volume.

export const CONDITIONS = {
  pregnancy: {
    label: { en: 'Pregnancy', es: 'Embarazo' },
    keywords: [
      'pregnan',
      'pregnancy',
      'expecting',
      'embaraz',
      'gestac',
      'encinta',
      'estoy esperando',
    ],
    avoidTags: [
      'supine',
      'prone',
      'high_impact',
      'jumping',
      'heavy_compound',
      'crunch',
      'twist',
      'breath_hold',
    ],
    intensityModifier: 0.7,
  },
  knee_injury: {
    label: { en: 'Knee injury', es: 'Lesión de rodilla' },
    keywords: [
      'knee',
      'patell',
      'meniscus',
      'acl',
      'mcl',
      'rodilla',
      'menisco',
      'ligamento cruzado',
    ],
    avoidTags: ['high_impact', 'jumping', 'deep_squat', 'lunge', 'plyometric'],
    intensityModifier: 0.8,
  },
  back_pain: {
    label: { en: 'Back pain', es: 'Dolor de espalda' },
    keywords: [
      'back pain',
      'lower back',
      'lumbar',
      'herniat',
      'sciatic',
      'espalda',
      'lumbar',
      'hernia',
      'ciática',
      'ciatica',
    ],
    avoidTags: ['heavy_compound', 'spinal_load', 'crunch', 'twist', 'deadlift_loaded'],
    intensityModifier: 0.75,
  },
  shoulder_injury: {
    label: { en: 'Shoulder injury', es: 'Lesión de hombro' },
    keywords: [
      'shoulder',
      'rotator',
      'rotator cuff',
      'impingement',
      'hombro',
      'manguito',
      'manguito rotador',
    ],
    avoidTags: ['overhead_press', 'overhead', 'pull_up', 'bench_press_heavy'],
    intensityModifier: 0.8,
  },
  general_pain: {
    label: { en: 'General pain', es: 'Dolor general' },
    keywords: [
      'pain',
      'hurt',
      'sore',
      'injur',
      'dolor',
      'duele',
      'lesión',
      'lesion',
      'molestia',
    ],
    avoidTags: ['high_impact', 'plyometric', 'heavy_compound'],
    intensityModifier: 0.85,
  },
};

/**
 * Detect conditions from a free-text description.
 * Returns array of condition keys, e.g. ['pregnancy', 'back_pain'].
 */
export function detectConditions(text) {
  if (!text || typeof text !== 'string') return [];
  const haystack = text.toLowerCase();
  const matched = new Set();

  for (const [key, cfg] of Object.entries(CONDITIONS)) {
    for (const kw of cfg.keywords) {
      if (haystack.includes(kw)) {
        matched.add(key);
        break;
      }
    }
  }

  // If "pain" is mentioned alongside a more specific area, drop the generic flag.
  if (
    matched.has('general_pain') &&
    (matched.has('back_pain') || matched.has('knee_injury') || matched.has('shoulder_injury'))
  ) {
    matched.delete('general_pain');
  }

  return Array.from(matched);
}

/**
 * Aggregate the avoid tags for a list of detected conditions.
 */
export function getAvoidTags(conditionKeys) {
  const tags = new Set();
  for (const key of conditionKeys) {
    const cfg = CONDITIONS[key];
    if (!cfg) continue;
    cfg.avoidTags.forEach((t) => tags.add(t));
  }
  return tags;
}

/**
 * The lowest intensity modifier among detected conditions wins (most conservative).
 */
export function getIntensityModifier(conditionKeys) {
  let mod = 1;
  for (const key of conditionKeys) {
    const cfg = CONDITIONS[key];
    if (cfg && cfg.intensityModifier < mod) mod = cfg.intensityModifier;
  }
  return mod;
}
