"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  CategoryId,
  FoodCategory,
  FoodId,
  FoodItem,
  MealDefinition,
  MealId,
} from "@/shared/models";
import { UNKNOWN_CATEGORY_ID } from "@/shared/defaults";

export function useFoodSelection({
  categories,
  mealDefs,
  onChangeFoodCategory,
  onAddEntryToMeal,
  onRemoveFood,
}: UseFoodSelectionParams) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedFoodIds, setSelectedFoodIds] = useState<Set<FoodId>>(
    () => new Set(),
  );

  const toggleSelectMode = useCallback(() => {
    setIsSelectMode((prev) => {
      const next = !prev;
      if (!next) {
        setSelectedFoodIds(new Set());
      }
      return next;
    });
  }, []);

  const toggleFoodSelected = useCallback((foodId: FoodId) => {
    setSelectedFoodIds((prev) => {
      const next = new Set(prev);
      if (next.has(foodId)) {
        next.delete(foodId);
      } else {
        next.add(foodId);
      }
      return next;
    });
  }, []);

  const toggleSelectAllForCategory = useCallback((items: FoodItem[]) => {
    setSelectedFoodIds((prev) => {
      const next = new Set(prev);
      const allSelected =
        items.length > 0 && items.every((f) => next.has(f.id));

      if (allSelected) {
        for (const f of items) {
          next.delete(f.id as FoodId);
        }
      } else {
        for (const f of items) {
          next.add(f.id as FoodId);
        }
      }

      return next;
    });
  }, []);

  const enabledCategories = useMemo(
    () =>
      Object.values(categories).filter(
        (c) => c.enabled && c.id !== UNKNOWN_CATEGORY_ID,
      ),
    [categories],
  );

  const enabledMealPanels = useMemo(
    () => mealDefs.filter((m) => m.enabled),
    [mealDefs],
  );

  const clearSelection = useCallback(() => {
    setSelectedFoodIds(new Set());
  }, []);

  const handleBulkMoveToCategory = useCallback(
    (categoryId: CategoryId) => {
      const ids = Array.from(selectedFoodIds);
      if (!categoryId || ids.length === 0) return;
      const target = categories[categoryId];
      const label = target?.name ?? "this category";
      const ok = window.confirm(
        `Move ${ids.length} food${ids.length === 1 ? "" : "s"} to "${label}"?`,
      );
      if (!ok) return;
      ids.forEach((id) => onChangeFoodCategory(id, categoryId));
      clearSelection();
    },
    [categories, clearSelection, onChangeFoodCategory, selectedFoodIds],
  );

  const handleBulkAddToMeal = useCallback(
    (mealId: MealId) => {
      const ids = Array.from(selectedFoodIds);
      if (!mealId || ids.length === 0) return;
      const target = mealDefs.find((m) => m.id === mealId);
      const label = target?.name ?? "this meal";
      const ok = window.confirm(
        `Add ${ids.length} food${ids.length === 1 ? "" : "s"} to "${label}"?`,
      );
      if (!ok) return;
      ids.forEach((id) => onAddEntryToMeal(mealId, id));
      clearSelection();
    },
    [clearSelection, mealDefs, onAddEntryToMeal, selectedFoodIds],
  );

  const handleBulkRemoveSelected = useCallback(() => {
    const ids = Array.from(selectedFoodIds);
    if (ids.length === 0) return;
    const ok = window.confirm(
      `Remove ${ids.length} food${ids.length === 1 ? "" : "s"} from library (and any meals)?`,
    );
    if (!ok) return;
    ids.forEach((id) => onRemoveFood(id));
    clearSelection();
  }, [clearSelection, onRemoveFood, selectedFoodIds]);

  return {
    isSelectMode,
    selectedFoodIds,
    toggleSelectMode,
    toggleFoodSelected,
    toggleSelectAllForCategory,
    enabledCategories,
    enabledMealPanels,
    handleBulkMoveToCategory,
    handleBulkAddToMeal,
    handleBulkRemoveSelected,
  } as const;
}

export type UseFoodSelectionParams = {
  categories: Record<CategoryId, FoodCategory>;
  mealDefs: MealDefinition[];
  onChangeFoodCategory: (foodId: FoodId, categoryId: CategoryId) => void;
  onAddEntryToMeal: (mealId: MealId, foodId: FoodId) => void;
  onRemoveFood: (foodId: FoodId) => void;
};
