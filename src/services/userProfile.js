// src/services/userProfile.js
//
// Local-first user profile. Stores the answers to the onboarding flow
// (sex, age, height, level, goal, equipment) so we don't ask twice and can
// pre-fill the daily/weekly routine builders. Also exposes BMI and body-fat
// estimators that ride on top of the saved profile.

const KEY = 'vigorix.userProfile.v1';

const DEFAULT_PROFILE = {
  sex: null, // 'male' | 'female' | 'other'
  age: null, // number
  height: null, // number
  heightUnit: 'cm', // 'cm' | 'in'
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
  return Boolean(
    p.sex &&
      p.age &&
      p.height &&
      p.goal &&
      p.level &&
      Array.isArray(p.equipment) &&
      p.equipment.length > 0,
  );
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

// =================================================================
// UNIT CONVERSIONS
// =================================================================
export function toCm(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return unit === 'in' ? n * 2.54 : n;
}

export function toKg(value, unit) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return unit === 'lb' ? n / 2.2046226218 : n;
}

// =================================================================
// HEALTH METRICS
// =================================================================

/**
 * Body Mass Index. Returns { bmi, category, label_en, label_es } or null.
 * Uses standard WHO categories.
 */
export function computeBmi(weightKg, heightCm) {
  const w = Number(weightKg);
  const h = Number(heightCm);
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  const m = h / 100;
  const bmi = w / (m * m);
  const rounded = Math.round(bmi * 10) / 10;
  let category = 'normal';
  if (bmi < 18.5) category = 'under';
  else if (bmi < 25) category = 'normal';
  else if (bmi < 30) category = 'over';
  else if (bmi < 35) category = 'obese1';
  else if (bmi < 40) category = 'obese2';
  else category = 'obese3';
  return { bmi: rounded, category };
}

/**
 * Body-fat estimate using the Deurenberg formula:
 *   BF% = 1.20 * BMI + 0.23 * age − 10.8 * sex − 5.4
 *   (sex = 1 for male, 0 for female; for "other" we average to 0.5)
 *
 * It's an estimate from BMI/age/sex — not as accurate as DEXA or calipers,
 * but good enough for tracking trends. Returns rounded percent or null.
 */
export function computeBodyFat({ bmi, age, sex }) {
  const b = Number(bmi);
  const a = Number(age);
  if (!Number.isFinite(b) || !Number.isFinite(a)) return null;
  const sexFactor = sex === 'male' ? 1 : sex === 'female' ? 0 : 0.5;
  const bf = 1.2 * b + 0.23 * a - 10.8 * sexFactor - 5.4;
  if (!Number.isFinite(bf)) return null;
  const clamped = Math.max(3, Math.min(60, bf));
  return Math.round(clamped * 10) / 10;
}

/**
 * Ideal weight range for a given height (BMI 18.5–24.9), returned in kg.
 */
export function idealWeightRange(heightCm) {
  const h = Number(heightCm);
  if (!Number.isFinite(h) || h <= 0) return null;
  const m = h / 100;
  return {
    min: Math.round(18.5 * m * m * 10) / 10,
    max: Math.round(24.9 * m * m * 10) / 10,
  };
}

/**
 * Mifflin-St Jeor BMR (kcal/day). Returns rounded integer or null.
 */
export function computeBmr({ weightKg, heightCm, age, sex }) {
  const w = Number(weightKg);
  const h = Number(heightCm);
  const a = Number(age);
  if (!Number.isFinite(w) || !Number.isFinite(h) || !Number.isFinite(a)) return null;
  const base = 10 * w + 6.25 * h - 5 * a;
  const adj = sex === 'male' ? 5 : sex === 'female' ? -161 : -78; // average for "other"
  return Math.round(base + adj);
}

/**
 * Daily calorie target from BMR + activity factor + goal.
 * activity ~ 1.4 (light), 1.55 (moderate), 1.725 (very active) — we pick by training level.
 */
export function computeCalorieTarget({ weightKg, heightCm, age, sex, goal, level }) {
  const bmr = computeBmr({ weightKg, heightCm, age, sex });
  if (!bmr) return null;
  const activity =
    level === 'gym_rat' ? 1.725 :
    level === 'advanced' ? 1.6 :
    level === 'balanced' ? 1.475 :
    1.4;
  const tdee = Math.round(bmr * activity);
  let kcal = tdee;
  if (goal === 'fatloss') kcal = Math.round(tdee * 0.8);
  else if (goal === 'hypertrophy') kcal = Math.round(tdee * 1.1);
  else if (goal === 'strength') kcal = Math.round(tdee * 1.05);
  else if (goal === 'endurance') kcal = tdee;
  else kcal = tdee;
  return { bmr, tdee, kcal };
}

/**
 * Macronutrient split (g/day) for a given calorie + bodyweight + goal.
 * Protein scales with goal: hypertrophy/strength = 2 g/kg, fatloss = 2.2,
 * else 1.6. Fat ~25–30% of kcal. Carbs fill the rest.
 */
export function computeMacros({ kcal, weightKg, goal }) {
  const w = Number(weightKg);
  const c = Number(kcal);
  if (!Number.isFinite(c) || c <= 0) return null;
  const proteinPerKg =
    goal === 'fatloss' ? 2.2 :
    goal === 'hypertrophy' || goal === 'strength' ? 2.0 :
    1.6;
  const protein = Math.round((Number.isFinite(w) ? w : 70) * proteinPerKg);
  const fatPct = goal === 'fatloss' ? 0.27 : goal === 'hypertrophy' ? 0.25 : 0.28;
  const fat = Math.round((c * fatPct) / 9);
  const carbs = Math.max(0, Math.round((c - protein * 4 - fat * 9) / 4));
  return { protein, fat, carbs };
}

// Validate age ranges and return localized warnings if any.
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
