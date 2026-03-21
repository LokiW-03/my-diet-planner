"use client";

import { useCallback } from "react";
import type { MealDefinition, MealId } from "@/shared/models";

export function useMealPanel({
  mealDefs,
  addMeal,
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
      const name = window.prompt("Meal name?");
      if (!name) return;

      const trimmed = name.trim();
      if (!trimmed) return;

      const newId = addMeal({
        name: trimmed,
        enabled: true,
        order: 10_000,
      });

      // insert into current visual order
      const ids = mealDefs.map((m) => String(m.id));
      const clamped = Math.max(0, Math.min(index, ids.length));
      ids.splice(clamped, 0, String(newId));
      setMealPanelOrder(ids);
    },
    [addMeal, mealDefs, setMealPanelOrder],
  );

  const removeMealPanel = useCallback(
    (mealId: MealId) => {
      disableMeal(mealId);
      removeMeal(String(mealId));
    },
    [disableMeal, removeMeal],
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
      resetAllMealPanels,
      saveMealPanelsAsDefaultForCurrentOrder,
    },
  };
}

type MealPanelProps = {
  mealDefs: MealDefinition[];
  addMeal: (meal: Omit<MealDefinition, "id">) => MealId;
  disableMeal: (mealId: MealId) => void;
  resetMealPanelsToDefault: () => void;
  saveMealPanelsAsDefault: (orderedEnabledMealIds: MealId[]) => Promise<void>;
  setMealPanelOrder: (order: string[]) => void;
  resetMealPanelOrder: () => void;
  resetHiddenMeals: () => void;
  removeMeal: (mealId: string) => void;
};
