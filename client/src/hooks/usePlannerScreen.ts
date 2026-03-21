"use client";

import { useShallow } from "zustand/shallow";
import { useCallback } from "react";
import { useProfile } from "@/client/src/hooks/useProfile";
import { usePlannerStore } from "@/client/src/hooks/useStore";
import { useFoodModal } from "@/client/src/hooks/useFoodModal";
import { useMealPanel } from "@/client/src/hooks/useMealPanel";
import { useModel } from "@/client/src/hooks/useModel";
import { useTargetModal } from "@/client/src/hooks/useTargetModal";
import type { FoodId, MealId } from "@/shared/models";

export function usePlannerScreen() {
  // external state sources
  const plannerState = usePlannerStore(
    useShallow((s) => ({
      meals: s.meals,
      dayType: s.dayType,
      hiddenMeals: s.hiddenMeals,
      mealPanelOrder: s.mealPanelOrder,
    })),
  );

  //  external state actions
  const plannerActions = usePlannerStore(
    useShallow((s) => ({
      setDayType: s.setDayType,
      resetHiddenMeals: s.resetHiddenMeals,
      setMealPanelOrder: s.setMealPanelOrder,
      resetMealPanelOrder: s.resetMealPanelOrder,
      addEntryToMeal: s.addEntryToMeal,
      removeEntryFromMeal: s.removeEntryFromMeal,
      moveEntry: s.moveEntry,
      setEntryPortion: s.setEntryPortion,
      removeEntriesForFood: s.removeEntriesForFood,
      removeMeal: s.removeMeal,
      clearAllMeals: s.clearAllMeals,
    })),
  );

  // derived data from profile
  const {
    profile,
    addFood,
    updateFood,
    removeFood,
    addTarget,
    updateTarget,
    removeTarget,
    resetTargetsToDefault,
    addMeal,
    disableMeal,
    resetMealPanelsToDefault,
    saveMealPanelsAsDefault,
    saveProfileAsDefault,
  } = useProfile();

  const model = useModel({ profile, plannerState });

  const removeFoodAndEntries = useCallback(
    (foodId: FoodId) => {
      removeFood(foodId);
      plannerActions.removeEntriesForFood(foodId);
    },
    [plannerActions, removeFood],
  );

  const foodModal = useFoodModal({
    foodsById: profile.foods,
    addFood,
    updateFood,
    removeFoodAndEntries,
  });

  const addEntryToMealWithDefaultPortion = useCallback(
    (mealId: MealId, foodId: FoodId) => {
      const food = profile.foods[foodId];
      const portion = food?.defaultPortion ?? 100;
      plannerActions.addEntryToMeal(mealId, foodId, portion);
    },
    [plannerActions, profile.foods],
  );

  const openEditById = useCallback(
    (foodId: FoodId) => {
      const f = profile.foods[foodId];
      if (!f) return;
      foodModal.actions.openEdit(f);
    },
    [foodModal.actions, profile.foods],
  );

  const mealPanel = useMealPanel({
    mealDefs: model.mealDefs,
    addMeal,
    disableMeal,
    resetMealPanelsToDefault,
    saveMealPanelsAsDefault,
    setMealPanelOrder: plannerActions.setMealPanelOrder,
    resetMealPanelOrder: plannerActions.resetMealPanelOrder,
    resetHiddenMeals: plannerActions.resetHiddenMeals,
    removeMeal: plannerActions.removeMeal,
  });

  const targetModal = useTargetModal({
    targetsById: profile.targets,
    dayType: plannerState.dayType,
    setDayType: plannerActions.setDayType,
    addTarget,
    updateTarget,
    removeTarget,
    resetTargetsToDefault,
    saveProfileAsDefault,
  });

  return {
    model,
    ui: foodModal.ui,
    actions: {
      ...plannerActions,
      ...mealPanel.actions,
      ...foodModal.actions,
      ...targetModal.actions,
      // glue actions
      openEditById,
      removeFoodAndEntries,
      addEntryToMealWithDefaultPortion,
      resetMealPanelsToDefault,
    },
  };
}
