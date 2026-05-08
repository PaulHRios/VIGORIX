// src/utils/shoppingList.js
//
// Aggregate every meal in a 7-day diet plan into a shopping list:
//   { food_id: { name, totalServings, kcal, protein } }
// Useful for users to plan their week or do meal-prep.

export function buildShoppingList(plan, lang = 'en') {
  if (!plan?.days) return [];
  const map = new Map();
  for (const day of plan.days) {
    for (const meal of day.meals || []) {
      const key = meal.id || (meal.name?.en || meal.name?.es);
      if (!key) continue;
      if (!map.has(key)) {
        map.set(key, {
          id: key,
          name: meal.name?.[lang] || meal.name?.en || key,
          servings: 0,
          kcal: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
        });
      }
      const entry = map.get(key);
      entry.servings += Number(meal.servings) || 1;
      entry.kcal += Number(meal.kcal) || 0;
      entry.protein += Number(meal.protein) || 0;
      entry.carbs += Number(meal.carbs) || 0;
      entry.fat += Number(meal.fat) || 0;
    }
  }
  // Round servings to .25 precision for display
  for (const e of map.values()) {
    e.servings = Math.round(e.servings * 4) / 4;
    e.kcal = Math.round(e.kcal);
    e.protein = Math.round(e.protein);
    e.carbs = Math.round(e.carbs);
    e.fat = Math.round(e.fat);
  }
  return Array.from(map.values()).sort((a, b) => b.protein - a.protein);
}

/**
 * Plain-text shopping list suitable for sharing or copy-paste.
 */
export function shoppingListAsText(items, lang = 'en') {
  const header = lang === 'es' ? 'Lista de la compra' : 'Shopping list';
  const lines = items.map(
    (i) => `• ${i.name} × ${i.servings}  (${i.protein} g P)`,
  );
  return `${header}\n${'-'.repeat(header.length)}\n${lines.join('\n')}`;
}
