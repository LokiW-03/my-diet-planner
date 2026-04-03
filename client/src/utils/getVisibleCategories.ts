import type { CategoryId, FoodCategory, FoodItem } from "@/shared/models";
import { UNKNOWN_CATEGORY_ID } from "@/shared/defaults";

export function getVisibleCategories(
  categories: Record<CategoryId, FoodCategory>,
  foods: FoodItem[],
): FoodCategory[] {
  const foodsByCategory = new Map<CategoryId, FoodItem[]>();
  for (const f of foods) {
    if (!foodsByCategory.has(f.categoryId)) {
      foodsByCategory.set(f.categoryId, []);
    }
    foodsByCategory.get(f.categoryId)!.push(f);
  }

  return Object.values(categories)
    .filter((c) => {
      if (!c.enabled) return false;
      if (c.id === UNKNOWN_CATEGORY_ID) {
        return (foodsByCategory.get(c.id)?.length ?? 0) > 0;
      }
      return true;
    })
    .sort((a, b) => a.order - b.order);
}
