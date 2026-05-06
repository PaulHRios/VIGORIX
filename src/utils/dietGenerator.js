// src/utils/dietGenerator.js
//
// Builds a 7-day meal plan from a user's profile + goal. The strategy is:
//   1. Compute a daily kcal target (TDEE * goal multiplier).
//   2. Compute macro split (protein g/kg → fat % of kcal → carbs fill).
//   3. Pick a number of meals (3 main + 1–2 snacks based on kcal target).
//   4. For each day, draft meals from the food DB, scaling servings so we
//      land within ±8% of the daily kcal target and protein floor.
//   5. Allow regenerating one slot at a time (lunch on Tuesday, etc.) or
//      the whole week.
//
// We also expose protein and creatine guidance.

import { FOODS } from '../data/foods.js';
import {
  computeCalorieTarget,
  computeMacros,
} from '../services/userProfile.js';

const DAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const SLOTS = ['breakfast', 'lunch', 'dinner', 'snack'];

function clone(o) {
  return JSON.parse(JSON.stringify(o));
}

function randomChoice(arr, exclude = new Set()) {
  const pool = arr.filter((f) => !exclude.has(f.id));
  if (pool.length === 0) return arr[Math.floor(Math.random() * arr.length)];
  return pool[Math.floor(Math.random() * pool.length)];
}

function mealsForKcal(kcal) {
  if (kcal < 1700) return ['breakfast', 'lunch', 'dinner'];
  if (kcal < 2400) return ['breakfast', 'snack', 'lunch', 'dinner'];
  return ['breakfast', 'snack', 'lunch', 'snack', 'dinner'];
}

// Scale a food's servings so its calories land near a target.
function scaleFood(food, targetKcal) {
  const ratio = Math.max(0.5, Math.min(2.0, targetKcal / food.kcal));
  const rounded = Math.round(ratio * 4) / 4; // 0.25 servings
  const servings = Math.max(0.5, Math.min(2, rounded));
  return {
    ...food,
    servings,
    kcal: Math.round(food.kcal * servings),
    protein: Math.round(food.protein * servings),
    carbs: Math.round(food.carbs * servings),
    fat: Math.round(food.fat * servings),
  };
}

function pickMealForSlot(slot, slotKcal, used) {
  const pool = FOODS[slot] || [];
  const food = randomChoice(pool, used);
  used.add(food.id);
  return scaleFood(food, slotKcal);
}

function buildDay({ kcal, dayKey, dietaryTag }) {
  const slots = mealsForKcal(kcal);
  const used = new Set();
  // Slot kcal allocation (rough split: 25/35/30/10 for 4 meals etc.)
  const splits = {
    3: [0.30, 0.40, 0.30],
    4: [0.28, 0.10, 0.34, 0.28],
    5: [0.25, 0.10, 0.30, 0.10, 0.25],
  }[slots.length] || [0.33, 0.34, 0.33];

  const meals = slots.map((slot, i) => {
    const target = Math.round(kcal * splits[i]);
    const meal = pickMealForSlot(slot, target, used);
    if (dietaryTag && meal.tags && !meal.tags.includes(dietaryTag)) {
      // try to pick a tagged food first
      const tagged = (FOODS[slot] || []).filter((f) => f.tags?.includes(dietaryTag));
      if (tagged.length > 0) {
        const swap = randomChoice(tagged, used);
        used.add(swap.id);
        return scaleFood(swap, target);
      }
    }
    return meal;
  });

  const totals = meals.reduce(
    (acc, m) => {
      acc.kcal += m.kcal;
      acc.protein += m.protein;
      acc.carbs += m.carbs;
      acc.fat += m.fat;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );

  return { dayKey, meals, totals };
}

export function generateDietPlan(profile, options = {}) {
  const targets = computeCalorieTarget({
    weightKg: options.weightKg,
    heightCm: profile.height,
    age: profile.age,
    sex: profile.sex,
    goal: profile.goal,
    level: profile.level,
  });
  if (!targets) return null;

  const macros = computeMacros({ kcal: targets.kcal, weightKg: options.weightKg, goal: profile.goal });

  const days = DAY_KEYS.map((dayKey) =>
    buildDay({ kcal: targets.kcal, dayKey, dietaryTag: options.dietaryTag }),
  );

  return {
    type: 'diet_plan',
    createdAt: new Date().toISOString(),
    goal: profile.goal,
    weightKg: options.weightKg,
    heightCm: profile.height,
    age: profile.age,
    sex: profile.sex,
    level: profile.level,
    dietaryTag: options.dietaryTag || null,
    targets, // { bmr, tdee, kcal }
    macros, // { protein, carbs, fat }
    days,
  };
}

export function regenerateDay(plan, dayIndex) {
  if (!plan || !plan.days?.[dayIndex]) return plan;
  const next = clone(plan);
  next.days[dayIndex] = buildDay({
    kcal: plan.targets.kcal,
    dayKey: plan.days[dayIndex].dayKey,
    dietaryTag: plan.dietaryTag,
  });
  next.updatedAt = new Date().toISOString();
  return next;
}

export function regenerateMeal(plan, dayIndex, mealIndex) {
  if (!plan || !plan.days?.[dayIndex]) return plan;
  const day = plan.days[dayIndex];
  if (!day.meals[mealIndex]) return plan;
  const slots = mealsForKcal(plan.targets.kcal);
  const slot = slots[mealIndex];
  if (!slot) return plan;

  const used = new Set(day.meals.map((m) => m.id));
  used.delete(day.meals[mealIndex].id);
  const splits = {
    3: [0.30, 0.40, 0.30],
    4: [0.28, 0.10, 0.34, 0.28],
    5: [0.25, 0.10, 0.30, 0.10, 0.25],
  }[slots.length] || [0.33, 0.34, 0.33];
  const target = Math.round(plan.targets.kcal * splits[mealIndex]);
  const next = clone(plan);
  next.days[dayIndex].meals[mealIndex] = pickMealForSlot(slot, target, used);
  // Recompute day totals
  const totals = next.days[dayIndex].meals.reduce(
    (acc, m) => {
      acc.kcal += m.kcal;
      acc.protein += m.protein;
      acc.carbs += m.carbs;
      acc.fat += m.fat;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 },
  );
  next.days[dayIndex].totals = totals;
  next.updatedAt = new Date().toISOString();
  return next;
}

// ---------------------------------------------------------------
// SUPPLEMENT GUIDANCE (protein powder + creatine)
// ---------------------------------------------------------------

export function supplementGuidance({ weightKg, goal, lang = 'en' }) {
  const w = Number(weightKg);
  const haveWeight = Number.isFinite(w) && w > 0;
  const proteinPerKg =
    goal === 'fatloss' ? 2.2 :
    goal === 'hypertrophy' || goal === 'strength' ? 2.0 :
    1.6;
  const proteinG = haveWeight ? Math.round(w * proteinPerKg) : null;
  const wheyScoops = haveWeight ? Math.max(1, Math.min(3, Math.round((proteinG - w * 1.2) / 25))) : 2;

  const creatineLoad = lang === 'es'
    ? 'Carga opcional: 5 g, 4 veces al día durante 5–7 días, luego 5 g/día.'
    : 'Optional loading: 5 g, 4× per day for 5–7 days, then 5 g/day.';
  const creatineMaint = lang === 'es'
    ? 'Mantenimiento: 5 g/día, todos los días, con o sin entreno. Puedes mezclarlo con tu shake.'
    : 'Maintenance: 5 g/day, every day, with or without training. Mix it into your shake.';

  return {
    protein: {
      perKg: proteinPerKg,
      grams: proteinG,
      scoops: wheyScoops,
      note: lang === 'es'
        ? `Apunta a ${proteinPerKg} g de proteína por kg al día. Si te cuesta llegar con comida real, ${wheyScoops} scoops de whey aportan ≈ ${wheyScoops * 25} g extra.`
        : `Aim for ${proteinPerKg} g of protein per kg of bodyweight per day. If real food falls short, ${wheyScoops} scoops of whey add ≈ ${wheyScoops * 25} g extra.`,
    },
    creatine: {
      load: creatineLoad,
      maintenance: creatineMaint,
      note: lang === 'es'
        ? 'Creatina monohidrato es el suplemento mejor estudiado: +5–10% de fuerza y volumen muscular en 4–8 semanas. Seguro a largo plazo.'
        : 'Creatine monohydrate is the most-studied supplement: +5–10% strength and muscle size in 4–8 weeks. Safe long-term.',
    },
    extra: {
      en: 'Don\'t forget: 3–5 g/day of omega-3, vitamin D if you don\'t see the sun, and 25–35 g of fiber. Sleep 7–9 h.',
      es: 'No olvides: 3–5 g/día de omega-3, vitamina D si no ves el sol, y 25–35 g de fibra. Duerme 7–9 h.',
    },
  };
}
