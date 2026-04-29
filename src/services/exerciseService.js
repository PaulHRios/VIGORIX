import { FALLBACK_EXERCISES } from '../data/exercises.js';
import { translateExerciseName, translateInstructions } from '../data/exerciseTranslations.js';

const REMOTE_JSON =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/dist/exercises.json';

const IMAGE_BASE =
  'https://cdn.jsdelivr.net/gh/yuhonas/free-exercise-db@main/exercises/';

const CACHE_KEY = 'vigorix.exerciseCache.v6';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const EQUIPMENT_MAP = {
  'body only': 'none',
  none: 'none',
  dumbbell: 'dumbbells',
  barbell: 'barbell',
  'e-z curl bar': 'barbell',
  cable: 'machines',
  machine: 'machines',
  kettlebells: 'kettlebell',
  bands: 'bands',
  'medicine ball': 'medicine_ball',
  'exercise ball': 'exercise_ball',
  'foam roll': 'foam_roll',
  other: 'other',
};

function muscleToTags(primary, secondary = []) {
  const tags = new Set();
  const add = (m) => tags.add(m);

  const all = [...primary, ...secondary];

  for (const m of all) {
    add(m);

    if (['chest', 'triceps', 'shoulders'].includes(m)) {
      add('upper');
      add('push');
    }

    if (['biceps', 'lats', 'middle back', 'lower back', 'forearms', 'traps'].includes(m)) {
      add('upper');
      add('pull');
      add('back');
    }

    if (['quadriceps', 'hamstrings', 'calves', 'adductors', 'abductors'].includes(m)) {
      add('lower');
      add('legs');
    }

    if (m === 'glutes') {
      add('lower');
      add('glutes');
    }

    if (m === 'abdominals') {
      add('core');
    }

    if (m === 'neck') {
      add('upper');
    }
  }

  return Array.from(tags);
}

function safetyTags(ex) {
  const tags = [];
  const n = (ex.name || '').toLowerCase();

  if (/squat|lunge|jump|burpee|deadlift|pistol/.test(n)) {
    tags.push('high_impact_lower');
  }

  if (/jump|burpee|sprint|hop|plyometric|box/.test(n)) {
    tags.push('plyometric', 'high_impact');
  }

  if (/push.?up|plank|prone/.test(n)) {
    tags.push('prone');
  }

  if (/sit.?up|crunch|leg raise|v-up/.test(n)) {
    tags.push('supine_flexion');
  }

  if (/overhead|press|jerk|snatch|clean/.test(n)) {
    tags.push('overhead');
  }

  if (/twist|russian|woodchop|rotation/.test(n)) {
    tags.push('rotation');
  }

  return tags;
}

function normalize(raw) {
  if (!raw || !raw.id || !Array.isArray(raw.images) || raw.images.length === 0) {
    return null;
  }

  const primaryMuscles = raw.primaryMuscles || [];
  const secondaryMuscles = raw.secondaryMuscles || [];

  if (primaryMuscles.length === 0) return null;

  const images = raw.images.map((p) => `${IMAGE_BASE}${p}`);

  const equipment =
    EQUIPMENT_MAP[(raw.equipment || 'none').toLowerCase()] ||
    (raw.equipment ? 'other' : 'none');

  const enName = raw.name || raw.id.replace(/_/g, ' ');
  const esName = translateExerciseName(raw.id, enName);
  const enInstr = Array.isArray(raw.instructions) ? raw.instructions : [];
  const esInstr = translateInstructions(raw.id, enInstr);

  return {
    id: raw.id,
    name: { en: enName, es: esName },
    images,
    gif: images[0],
    youtubeQuery: enName,
    muscle: muscleToTags(primaryMuscles, secondaryMuscles),
    primaryMuscles,
    secondaryMuscles,
    equipment,
    rawEquipment: raw.equipment || null,
    level: raw.level || 'beginner',
    category: raw.category || 'strength',
    force: raw.force || null,
    mechanic: raw.mechanic || null,
    tags: safetyTags(raw),
    instructions: { en: enInstr, es: esInstr },
  };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);

    if (!raw) return null;

    const obj = JSON.parse(raw);

    if (!obj || !obj.savedAt || !Array.isArray(obj.data)) return null;
    if (Date.now() - obj.savedAt > CACHE_TTL_MS) return null;

    return obj.data;
  } catch {
    return null;
  }
}

function writeCache(data) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ savedAt: Date.now(), data }),
    );
  } catch {
    // localStorage quota, Safari drama, etc.
  }
}

async function fetchRemote() {
  const r = await fetch(REMOTE_JSON, { cache: 'no-cache' });

  if (!r.ok) throw new Error(`HTTP ${r.status}`);

  const arr = await r.json();

  if (!Array.isArray(arr)) throw new Error('Bad payload');

  return arr.map(normalize).filter(Boolean);
}

let inMemoryCache = null;

export async function getExercises() {
  if (inMemoryCache) return inMemoryCache;

  const cached = readCache();

  if (cached && cached.length > 0) {
    inMemoryCache = cached;

    fetchRemote()
      .then((fresh) => {
        if (fresh && fresh.length > 0) {
          writeCache(fresh);
          inMemoryCache = fresh;
        }
      })
      .catch(() => {});

    return inMemoryCache;
  }

  try {
    const fresh = await fetchRemote();

    if (fresh && fresh.length > 0) {
      writeCache(fresh);
      inMemoryCache = fresh;
      return inMemoryCache;
    }
  } catch (e) {
    console.warn('[VIGORIX] Could not load exercise database, using fallback.', e);
  }

  inMemoryCache = FALLBACK_EXERCISES;

  return inMemoryCache;
}

export async function reloadExercises() {
  inMemoryCache = null;

  try {
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }

  return getExercises();
}
