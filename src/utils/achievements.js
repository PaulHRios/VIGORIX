// src/utils/achievements.js
//
// Streaks, achievements, and "you vs 8 weeks ago" comparisons.
// Built on top of the workout logs + body metrics arrays.

const DAY_MS = 24 * 3600 * 1000;
const dayKey = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
};

/**
 * Count the number of distinct training days in a row, ending today.
 * Resets the moment we hit a day with zero logs (within a 36h grace window
 * so a late-night log on Tuesday doesn't break a Monday streak).
 */
export function trainingStreak(logs) {
  if (!Array.isArray(logs) || logs.length === 0) return 0;
  const trained = new Set();
  for (const l of logs) {
    const k = dayKey(l.logged_at);
    if (k) trained.add(k);
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(today.getTime() - i * DAY_MS);
    const k = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (trained.has(k)) streak++;
    else if (streak > 0 && i === 0) {
      // Allow today to not have a session yet, as long as yesterday did.
      continue;
    } else {
      break;
    }
  }
  return streak;
}

/**
 * Count distinct training days in the last 7 days.
 */
export function sessionsThisWeek(logs) {
  if (!Array.isArray(logs)) return 0;
  const cutoff = Date.now() - 7 * DAY_MS;
  const days = new Set();
  for (const l of logs) {
    const t = new Date(l.logged_at).getTime();
    if (t >= cutoff) days.add(dayKey(l.logged_at));
  }
  return days.size;
}

/**
 * Total reps & total volume (weight × reps, in kg) ever logged.
 */
export function lifetimeTotals(logs) {
  let reps = 0;
  let volume = 0;
  let sets = 0;
  for (const l of logs || []) {
    sets++;
    reps += Number(l.reps) || 0;
    volume += (Number(l.weight) || 0) * (Number(l.reps) || 0);
  }
  return { sets, reps, volume: Math.round(volume) };
}

/**
 * Achievements — "milestones unlocked" view. Returns an array of
 * { id, label, unlocked, value, target } so the UI can render progress.
 */
export function listAchievements(logs, body) {
  const totals = lifetimeTotals(logs);
  const streak = trainingStreak(logs);
  const week = sessionsThisWeek(logs);
  const weighIns = (body || []).length;
  const sessions = new Set((logs || []).map((l) => dayKey(l.logged_at))).size;

  const ach = [
    { id: 'first_set',     value: totals.sets,    target: 1,    label_en: 'First set logged',         label_es: 'Primera serie registrada' },
    { id: 'sets_50',       value: totals.sets,    target: 50,   label_en: '50 sets',                  label_es: '50 series' },
    { id: 'sets_500',      value: totals.sets,    target: 500,  label_en: '500 sets',                 label_es: '500 series' },
    { id: 'reps_1000',     value: totals.reps,    target: 1000, label_en: '1 000 reps',               label_es: '1 000 reps' },
    { id: 'reps_10000',    value: totals.reps,    target: 10000,label_en: '10 000 reps',              label_es: '10 000 reps' },
    { id: 'volume_5t',     value: totals.volume,  target: 5000, label_en: '5 t total volume',         label_es: '5 t volumen total' },
    { id: 'volume_50t',    value: totals.volume,  target: 50000,label_en: '50 t total volume',        label_es: '50 t volumen total' },
    { id: 'streak_3',      value: streak,         target: 3,    label_en: '3-day streak',             label_es: 'Racha de 3 días' },
    { id: 'streak_7',      value: streak,         target: 7,    label_en: '7-day streak',             label_es: 'Racha de 7 días' },
    { id: 'streak_30',     value: streak,         target: 30,   label_en: '30-day streak',            label_es: 'Racha de 30 días' },
    { id: 'week_4',        value: week,           target: 4,    label_en: '4 sessions this week',     label_es: '4 sesiones esta semana' },
    { id: 'sessions_100',  value: sessions,       target: 100,  label_en: '100 training days',        label_es: '100 días entrenando' },
    { id: 'weighin_4',     value: weighIns,       target: 4,    label_en: '4 body-weight check-ins',  label_es: '4 pesajes registrados' },
  ];
  return ach.map((a) => ({ ...a, unlocked: a.value >= a.target }));
}

/**
 * Compare a metric "now" vs "N weeks ago".
 * Returns { now, then, delta, deltaPct } where then is the closest
 * value to N weeks ago within ±2 weeks tolerance.
 */
export function compareWeeksAgo({ values = [], weeks = 8, tolerance = 14 }) {
  // values: array of { date: Date|ISO, value: number } sorted DESC by date.
  if (!values.length) return null;
  const now = values[0]?.value;
  const target = Date.now() - weeks * 7 * DAY_MS;
  const tolMs = tolerance * DAY_MS;
  let then = null;
  let bestDiff = Infinity;
  for (const v of values) {
    const t = new Date(v.date).getTime();
    if (!Number.isFinite(t)) continue;
    const diff = Math.abs(t - target);
    if (diff < bestDiff && diff <= tolMs) {
      bestDiff = diff;
      then = v.value;
    }
  }
  if (then == null) return null;
  const delta = now - then;
  const deltaPct = then === 0 ? 0 : (delta / then) * 100;
  return {
    now,
    then,
    delta: Math.round(delta * 10) / 10,
    deltaPct: Math.round(deltaPct * 10) / 10,
  };
}

/**
 * Body-weight comparison: now vs ~8 weeks ago.
 */
export function bodyWeightVs8w(body) {
  if (!Array.isArray(body) || body.length === 0) return null;
  const values = body.map((b) => ({
    date: b.measured_at,
    value: Number(b.weight) || 0,
  }));
  return compareWeeksAgo({ values, weeks: 8 });
}

/**
 * Best 1RM-style score comparison for a specific exercise.
 * Returns { now, then, delta, deltaPct } in the same shape.
 */
export function exerciseStrengthVs8w(logs, exerciseKey) {
  if (!Array.isArray(logs) || !exerciseKey) return null;
  const matches = logs.filter(
    (l) => l.exercise_id === exerciseKey || l.exercise_name === exerciseKey,
  );
  if (matches.length === 0) return null;
  const values = matches.map((l) => ({
    date: l.logged_at,
    value: (Number(l.weight) || 0) * (Number(l.reps) || 0),
  }));
  return compareWeeksAgo({ values, weeks: 8 });
}
