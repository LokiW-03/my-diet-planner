"use client";

import { useCallback } from "react";
import type { MealDefinition, MealId } from "@/shared/models";

export function useMealPanel({
  mealDefs,
  addMeal,
  updateMeal,
  disableMeal,
  resetMealPanelsToDefault,
  saveMealPanelsAsDefault,
  setMealPanelOrder,
  resetMealPanelOrder,
  resetHiddenMeals,
  removeMeal,
}: MealPanelProps) {
  const insertMealPanel = useCallback(
    (index: number) => {
      const newId = addMeal({
        name: "New Meal",
        enabled: true,
        order: 10_000,
      });

      // insert into current visual order
      const ids = mealDefs.map((m) => m.id);
      const clamped = Math.max(0, Math.min(index, ids.length));
      ids.splice(clamped, 0, newId);
      setMealPanelOrder(ids);

      return newId;
    },
    [addMeal, mealDefs, setMealPanelOrder],
  );

  const removeMealPanel = useCallback(
    (mealId: MealId) => {
      disableMeal(mealId);
      removeMeal(mealId);
    },
    [disableMeal, removeMeal],
  );

  const renameMealPanel = useCallback(
    (mealId: MealId, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateMeal(mealId, { name: trimmed });
    },
    [updateMeal],
  );

  const resetAllMealPanels = useCallback(() => {
    resetMealPanelsToDefault();
    resetHiddenMeals();
    resetMealPanelOrder();
  }, [resetHiddenMeals, resetMealPanelOrder, resetMealPanelsToDefault]);

  const saveMealPanelsAsDefaultForCurrentOrder = useCallback(() => {
    void saveMealPanelsAsDefault(mealDefs.map((m) => m.id));
  }, [mealDefs, saveMealPanelsAsDefault]);

  return {
    ui: {},
    actions: {
      insertMealPanel,
      removeMealPanel,
      renameMealPanel,
      resetAllMealPanels,
      saveMealPanelsAsDefaultForCurrentOrder,
    },
  };
}

type MealPanelProps = {
  mealDefs: MealDefinition[];
  addMeal: (meal: Omit<MealDefinition, "id">) => MealId;
  updateMeal: (
    mealId: MealId,
    patch: Partial<Omit<MealDefinition, "id">>,
  ) => void;
  disableMeal: (mealId: MealId) => void;
  resetMealPanelsToDefault: () => void;
  saveMealPanelsAsDefault: (orderedEnabledMealIds: MealId[]) => Promise<void>;
  setMealPanelOrder: (order: MealId[]) => void;
  resetMealPanelOrder: () => void;
  resetHiddenMeals: () => void;
  removeMeal: (mealId: MealId) => void;
};
