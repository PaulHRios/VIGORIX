// src/utils/strength.js
//
// Strength helpers built on top of workout logs:
//   - 1RM estimate (Epley formula).
//   - Plateau detection: compares the best (weight × reps) over the last
//     ~28 days vs the 28 days before that — if no improvement, it's a stall.
//   - Warmup pyramid for compound exercises (40 / 60 / 80 % × 8 / 5 / 3).
//
// All functions accept *raw logs* (the array returned by listLogs) and
// optionally a target exerciseId or name to filter by. Nothing here touches
// state — pure functions, easy to test.

const EPLEY = (weight, reps) => weight * (1 + reps / 30);

export function epley1RM(weight, reps) {
  const w = Number(weight);
  const r = Number(reps);
  if (!Number.isFinite(w) || !Number.isFinite(r) || w <= 0 || r <= 0) return null;
  if (r === 1) return Math.round(w * 10) / 10;
  return Math.round(EPLEY(w, r) * 10) / 10;
}

/**
 * Best estimated 1RM across all sets logged for an exercise.
 * Returns { value, when, set } or null.
 */
export function best1RM(logs, exerciseKey) {
  if (!Array.isArray(logs)) return null;
  let best = null;
  for (const log of logs) {
    const matches = exerciseKey
      ? (log.exercise_id === exerciseKey || log.exercise_name === exerciseKey)
      : true;
    if (!matches) continue;
    const v = epley1RM(log.weight, log.reps);
    if (v == null) continue;
    if (!best || v > best.value) best = { value: v, when: log.logged_at, set: log };
  }
  return best;
}

/**
 * Group logs by exercise_id (falling back to name) for downstream consumers.
 */
export function groupLogsByExercise(logs) {
  const map = new Map();
  for (const log of logs || []) {
    const key = log.exercise_id || log.exercise_name;
    if (!key) continue;
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(log);
  }
  return map;
}

/**
 * Plateau detection. For a given exercise:
 *   - take all logs from the last `window` days (default 28),
 *   - take all logs from the `window` days before that,
 *   - compare the best volume score (kg × reps) of each window.
 * If the recent window's best is ≤ the older window's best, it's a plateau.
 *
 * Returns { plateau, recentBest, previousBest, deltaPct } or null when
 * there are not enough logs to decide.
 */
export function detectPlateau(logs, { windowDays = 28 } = {}) {
  if (!Array.isArray(logs) || logs.length < 4) return null;
  const now = Date.now();
  const ms = windowDays * 24 * 3600 * 1000;
  let recent = -Infinity;
  let prior = -Infinity;
  for (const log of logs) {
    const t = new Date(log.logged_at || log.measured_at || 0).getTime();
    if (!Number.isFinite(t)) continue;
    const w = Number(log.weight) || 0;
    const r = Number(log.reps) || 0;
    if (w <= 0 || r <= 0) continue;
    const score = w * r;
    if (now - t <= ms) recent = Math.max(recent, score);
    else if (now - t <= 2 * ms) prior = Math.max(prior, score);
  }
  if (!Number.isFinite(recent) || !Number.isFinite(prior)) return null;
  const delta = recent - prior;
  const deltaPct = prior > 0 ? (delta / prior) * 100 : 0;
  return {
    plateau: delta <= 0,
    recentBest: recent,
    previousBest: prior,
    deltaPct: Math.round(deltaPct * 10) / 10,
  };
}

/**
 * Build a warmup pyramid from a working weight. Used at the start of each
 * compound exercise — never for isolations.
 *   40% × 8, 60% × 5, 80% × 3, then go to working sets.
 */
export function warmupSets(workingWeight) {
  const w = Number(workingWeight);
  if (!Number.isFinite(w) || w <= 0) return [];
  const round = (x) => Math.round(x * 2) / 2; // half-kg precision
  return [
    { pct: 40, weight: round(w * 0.4), reps: 8 },
    { pct: 60, weight: round(w * 0.6), reps: 5 },
    { pct: 80, weight: round(w * 0.8), reps: 3 },
  ];
}

/**
 * Best heuristic for "the working weight" of an exercise: the latest log,
 * fallback to the heaviest set ever, fallback to null.
 */
export function suggestWorkingWeight(logs, exerciseKey) {
  if (!Array.isArray(logs)) return null;
  const matches = logs.filter(
    (l) =>
      Number(l.weight) > 0 &&
      (l.exercise_id === exerciseKey || l.exercise_name === exerciseKey),
  );
  if (matches.length === 0) return null;
  // matches are already sorted descending by date in our store
  return Number(matches[0].weight) || null;
}

/**
 * Decide if an exercise should get a warmup. Compound moves get one,
 * isolations don't (waste of time and adds 5+ min).
 */
export function shouldWarmup(exercise) {
  if (!exercise) return false;
  if (exercise.exercise_type === 'compound') return true;
  // Some compound moves are tagged differently; whitelist by name fragment.
  const name = String(exercise.name?.en || exercise.id || '').toLowerCase();
  return /squat|deadlift|press|row|pull[- ]?up|chin[- ]?up|clean|snatch/.test(name);
}
