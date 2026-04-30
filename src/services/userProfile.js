// src/services/userProfile.js
//
// Local-first user profile. Stores the answers to the onboarding flow
// (sex, age, level, goal, equipment) so we don't ask twice and can
// pre-fill the daily/weekly routine builders.

const KEY = 'vigorix.userProfile.v1';

const DEFAULT_PROFILE = {
  sex: null, // 'male' | 'female' | 'other'
  age: null, // number
  goal: null, // 'strength' | 'hypertrophy' | 'endurance' | 'fatloss' | 'mobility' | 'general'
  level: null, // 'beginner' | 'balanced' | 'advanced' | 'gym_rat'
  equipment: [], // array of equipment keys
  conditionKeys: [], // detected condition keys
  conditionText: '', // raw text the user typed (optional)
  completedAt: null, // ISO date when onboarding finished
};

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_PROFILE };
    const obj = JSON.parse(raw);
    return { ...DEFAULT_PROFILE, ...obj };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

function write(profile) {
  try {
    localStorage.setItem(KEY, JSON.stringify(profile));
    return true;
  } catch {
    return false;
  }
}

export function getProfile() {
  return read();
}

export function isOnboarded() {
  const p = read();
  return Boolean(p.sex && p.age && p.goal && p.level && Array.isArray(p.equipment) && p.equipment.length > 0);
}

export function updateProfile(patch) {
  const next = { ...read(), ...patch };
  write(next);
  return next;
}

export function completeOnboarding(profile) {
  const next = { ...read(), ...profile, completedAt: new Date().toISOString() };
  write(next);
  return next;
}

export function resetProfile() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

// Validate age ranges and return localized warnings if any.
// Does NOT block — returns metadata so the UI can decide.
export function ageWarnings(age, lang = 'en') {
  const a = Number(age);
  const out = { isMinor: false, isSenior: false, message: null };
  if (!Number.isFinite(a) || a <= 0) return out;
  if (a < 16) {
    out.isMinor = true;
    out.message =
      lang === 'es'
        ? 'Por seguridad, los menores deben entrenar bajo supervisión de un adulto cualificado. La rutina se ajustará a movimientos suaves.'
        : 'For safety, minors should train under qualified adult supervision. Your routine will be adjusted to lighter movements.';
  } else if (a >= 60) {
    out.isSenior = true;
    out.message =
      lang === 'es'
        ? 'Para mayores de 60 años, ajustamos volumen y descansos. Consulta a tu médico antes de empezar.'
        : 'For people 60+, we adjust volume and rest. Please consult your doctor before starting.';
  }
  return out;
}
