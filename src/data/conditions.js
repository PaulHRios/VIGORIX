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
      'supine_flexion',
      'prone',
      'high_impact',
      'high_impact_lower',
      'jumping',
      'plyometric',
      'heavy_compound',
      'crunch',
      'twist',
      'rotation',
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
    avoidTags: [
      'high_impact',
      'high_impact_lower',
      'jumping',
      'deep_squat',
      'lunge',
      'plyometric',
    ],
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
    avoidTags: [
      'heavy_compound',
      'spinal_load',
      'crunch',
      'supine_flexion',
      'twist',
      'rotation',
      'deadlift_loaded',
    ],
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
    avoidTags: [
      'overhead_press',
      'overhead',
      'pull_up',
      'bench_press_heavy',
    ],
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
    avoidTags: [
      'high_impact',
      'high_impact_lower',
      'plyometric',
      'heavy_compound',
    ],
    intensityModifier: 0.85,
  },

  // ---- Conditions derived from structured profile answers ----
  // (no keywords — set explicitly, not detected from text)
  senior: {
    label: { en: 'Senior (60+)', es: 'Mayor (60+)' },
    keywords: [],
    avoidTags: [
      'high_impact',
      'high_impact_lower',
      'jumping',
      'plyometric',
      'heavy_compound',
      'breath_hold',
    ],
    intensityModifier: 0.75,
  },

  mobility_mild: {
    label: { en: 'Mild mobility limit', es: 'Limitación leve de movilidad' },
    keywords: [],
    avoidTags: [
      'high_impact',
      'high_impact_lower',
      'jumping',
      'plyometric',
      'heavy_compound',
      'deep_squat',
    ],
    intensityModifier: 0.7,
  },

  mobility_severe: {
    label: { en: 'Severe mobility limit', es: 'Limitación severa de movilidad' },
    keywords: [],
    avoidTags: [
      'high_impact',
      'high_impact_lower',
      'jumping',
      'plyometric',
      'heavy_compound',
      'deep_squat',
      'lunge',
      'overhead_press',
      'pull_up',
      'spinal_load',
      'breath_hold',
    ],
    intensityModifier: 0.55,
  },
};

// =================================================================
// AREA → AVOID-TAG MAP
// Used when the user selects body areas to spare in onboarding
// (e.g. "knees", "lower back", "shoulders"). Each area maps to
// avoidTags that the workout filter already understands.
// =================================================================
export const AREA_AVOID_TAGS = {
  knee: ['high_impact_lower', 'jumping', 'deep_squat', 'lunge', 'plyometric'],
  lower_back: ['heavy_compound', 'spinal_load', 'crunch', 'supine_flexion', 'twist', 'rotation', 'deadlift_loaded'],
  upper_back: ['overhead_press', 'overhead', 'shoulder_shrug'],
  shoulder: ['overhead_press', 'overhead', 'pull_up', 'bench_press_heavy'],
  wrist: ['push_up', 'plank', 'front_rack'],
  elbow: ['close_grip', 'skull_crusher'],
  hip: ['deep_squat', 'lunge', 'high_impact_lower'],
  ankle: ['jumping', 'plyometric', 'high_impact_lower'],
  chest: ['heavy_compound', 'breath_hold', 'high_impact'],
  abdomen: ['crunch', 'supine_flexion', 'twist', 'rotation', 'heavy_compound'],
};

export function tagsForAvoidAreas(areas = []) {
  const tags = new Set();
  for (const a of areas) {
    const list = AREA_AVOID_TAGS[a];
    if (!list) continue;
    list.forEach((t) => tags.add(t));
  }
  return tags;
}

function hasNegationBefore(haystack, keyword) {
  const index = haystack.indexOf(keyword);

  if (index < 0) return false;

  const before = haystack.slice(Math.max(0, index - 35), index);

  return /(sin|no tengo|no hay|without|no)\s+$/i.test(before);
}

function hasGlobalNoConditionPhrase(haystack) {
  return /\b(sin lesiones|sin lesi[oó]n|sin dolor|no injuries|no injury|no pain|no medical condition|sin condici[oó]n médica)\b/i.test(
    haystack,
  );
}

/**
 * Detect conditions from a free-text description.
 * Returns array of condition keys, e.g. ['pregnancy', 'back_pain'].
 */
export function detectConditions(text) {
  if (!text || typeof text !== 'string') return [];

  const haystack = text.toLowerCase();
  const matched = new Set();
  const globalNoCondition = hasGlobalNoConditionPhrase(haystack);

  for (const [key, cfg] of Object.entries(CONDITIONS)) {
    for (const kw of cfg.keywords) {
      if (!haystack.includes(kw)) continue;

      // "sin lesiones" should not trigger general_pain. Revolutionary.
      if (globalNoCondition && key === 'general_pain') continue;

      if (hasNegationBefore(haystack, kw)) continue;

      matched.add(key);
      break;
    }
  }

  // If generic pain is mentioned alongside a specific area, keep the specific one.
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

/**
 * Derive the full set of condition keys from a user profile.
 * Combines the structured answers (pregnancy, mobility, age) with whatever
 * was detected from the optional free-text notes.
 */
export function deriveConditionKeysFromProfile(profile = {}) {
  const keys = new Set();

  if (profile.pregnancy && profile.pregnancy !== 'none') {
    keys.add('pregnancy');
  }

  if (profile.mobility === 'mild') keys.add('mobility_mild');
  else if (profile.mobility === 'severe') keys.add('mobility_severe');

  if (Number(profile.age) >= 60) keys.add('senior');

  if (profile.conditionText) {
    for (const k of detectConditions(profile.conditionText)) keys.add(k);
  }

  // Pre-existing conditionKeys (e.g. set manually via "edit profile") merged in.
  if (Array.isArray(profile.conditionKeys)) {
    profile.conditionKeys.forEach((k) => keys.add(k));
  }

  return Array.from(keys);
}
