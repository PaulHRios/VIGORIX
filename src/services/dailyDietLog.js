// src/services/dailyDietLog.js
//
// Local-first daily food log. The diet plan tells you what to eat in a week;
// this service tracks what the user *actually* ate (extras outside the plan),
// per day. The Diet page shows the remaining kcal/macros vs target.
//
// Schema per entry:
//   { id, dateKey ('YYYY-MM-DD'), name, kcal, protein, carbs, fat, when }

const KEY = 'vigorix.dietLog.v1';

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function read() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

export function listFoodEntries(dateKey = todayKey()) {
  return read().filter((e) => e.dateKey === dateKey);
}

export function addFoodEntry({ name, kcal, protein, carbs, fat }) {
  const list = read();
  const entry = {
    id: `food_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    dateKey: todayKey(),
    name: String(name || '').trim() || '—',
    kcal: Math.max(0, Math.round(Number(kcal) || 0)),
    protein: Math.max(0, Math.round(Number(protein) || 0)),
    carbs: Math.max(0, Math.round(Number(carbs) || 0)),
    fat: Math.max(0, Math.round(Number(fat) || 0)),
    when: new Date().toISOString(),
  };
  list.unshift(entry);
  // keep ~90 days of history (~1500 entries plenty)
  write(list.slice(0, 1500));
  return entry;
}

export function deleteFoodEntry(id) {
  write(read().filter((e) => e.id !== id));
}

export function totalsFor(dateKey = todayKey()) {
  const entries = listFoodEntries(dateKey);
  return entries.reduce(
    (acc, e) => {
      acc.kcal += e.kcal;
      acc.protein += e.protein;
      acc.carbs += e.carbs;
      acc.fat += e.fat;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
}

export { todayKey };
