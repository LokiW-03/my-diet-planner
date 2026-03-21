import type {
  FoodItem,
  FoodId,
  MealDefinition,
  MealEntry,
  MealId,
} from "@/shared/models";

export function computeMealTotals(
  foods: FoodItem[],
  meals: Record<MealId, MealEntry[]>,
  mealDefs: MealDefinition[],
) {
  const map = new Map<FoodId, FoodItem>(foods.map((f) => [f.id, f]));
  const out = {} as Record<MealId, { kcal: number; protein: number }>;

  for (const m of mealDefs) {
    let kcal = 0,
      protein = 0;
    for (const e of meals[m.id] ?? []) {
      const f = map.get(e.foodId as FoodId);
      if (!f) continue;
      kcal += e.portion * f.kcalPerUnit;
      protein += e.portion * f.proteinPerUnit;
    }
    out[m.id] = { kcal, protein };
  }
  return out;
}

export function computeTotals(
  foods: FoodItem[],
  meals: Record<MealId, MealEntry[]>,
  includeMealIds?: MealId[],
) {
  const foodMap = new Map<FoodId, FoodItem>(foods.map((f) => [f.id, f]));
  let kcal = 0;
  let protein = 0;

  const include = includeMealIds ? new Set(includeMealIds) : null;

  for (const [mealId, entries] of Object.entries(meals) as [
    MealId,
    MealEntry[],
  ][]) {
    if (include && !include.has(mealId)) continue;
    for (const e of entries) {
      const f = foodMap.get(e.foodId);
      if (!f) continue;
      kcal += e.portion * f.kcalPerUnit;
      protein += e.portion * f.proteinPerUnit;
    }
  }

  return { kcal, protein };
}
