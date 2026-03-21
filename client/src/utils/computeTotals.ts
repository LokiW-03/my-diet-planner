import type {
  FoodItem,
  FoodId,
  MealDefinition,
  MealEntry,
} from "@/shared/models";

export function computeMealTotals(
  foods: FoodItem[],
  meals: Record<string, MealEntry[]>,
  mealDefs: MealDefinition[],
) {
  const map = new Map<FoodId, FoodItem>(foods.map((f) => [f.id, f]));
  const out = {} as Record<string, { kcal: number; protein: number }>;

  for (const m of mealDefs) {
    const key = String(m.id);
    let kcal = 0,
      protein = 0;
    for (const e of meals[key] ?? []) {
      const f = map.get(e.foodId as FoodId);
      if (!f) continue;
      kcal += e.portion * f.kcalPerUnit;
      protein += e.portion * f.proteinPerUnit;
    }
    out[key] = { kcal, protein };
  }
  return out;
}

export function computeTotals(
  foods: FoodItem[],
  meals: Record<string, MealEntry[]>,
  includeMealIds?: string[],
) {
  const foodMap = new Map<FoodId, FoodItem>(foods.map((f) => [f.id, f]));
  let kcal = 0;
  let protein = 0;

  const include = includeMealIds ? new Set(includeMealIds.map(String)) : null;

  for (const [mealId, entries] of Object.entries(meals)) {
    if (include && !include.has(String(mealId))) continue;
    for (const e of entries) {
      const f = foodMap.get(e.foodId);
      if (!f) continue;
      kcal += e.portion * f.kcalPerUnit;
      protein += e.portion * f.proteinPerUnit;
    }
  }

  return { kcal, protein };
}
