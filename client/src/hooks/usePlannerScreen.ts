"use client";

import { useShallow } from "zustand/shallow";
import { useCallback } from "react";
import { useProfile } from "@/client/src/hooks/useProfile";
import { usePlannerStore } from "@/client/src/hooks/useStore";
import { useFoodModal } from "@/client/src/hooks/useFoodModal";
import { useMealPanel } from "@/client/src/hooks/useMealPanel";
import { useCategory } from "@/client/src/hooks/useCategory";
import { useFolder } from "@/client/src/hooks/useFolder";
import { useModel } from "@/client/src/hooks/useModel";
import { useTargetModal } from "@/client/src/hooks/useTargetModal";
import type { CategoryId, FoodId, MealId } from "@/shared/models";
import {
  asIsoDateString,
  toIsoDateStringLocalCalendar,
} from "@/client/src/utils/targetSchedule";

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
      hideMealPanel: s.hideMealPanel,
      resetHiddenMeals: s.resetHiddenMeals,
      setMealPanelOrder: s.setMealPanelOrder,
      resetMealPanelOrder: s.resetMealPanelOrder,
      addEntryToMeal: s.addEntryToMeal,
      removeEntryFromMeal: s.removeEntryFromMeal,
      moveEntry: s.moveEntry,
      setEntryPortion: s.setEntryPortion,
      setEntriesPortionForFood: s.setEntriesPortionForFood,
      removeEntriesForFood: s.removeEntriesForFood,
      clearMealFromBoard: s.clearMealFromBoard,
      clearAllMeals: s.clearAllMeals,
    })),
  );

  // derived data from profile
  const {
    profile,
    addFood,
    updateFood,
    removeFood,
    setScheduleOverride,
    addScheduleRule,
    updateScheduleRule,
    removeScheduleRule,
    addTarget,
    updateTarget,
    removeTarget,
    resetTargetsToDefault,
    addMeal,
    updateMeal,
    disableMeal,
    resetMealPanelsToDefault,
    saveMealPanelsAsDefault,
    saveProfileAsDefault,
    updateCategory,
    addCategory,
    removeCategory,
    reorderCategories,
    updateFolder,
    addFolder,
    removeFolder,
    reorderFolders,
  } = useProfile();

  const schedule = {
    actions: {
      addScheduleRule,
      updateScheduleRule,
      removeScheduleRule,
    },
  };

  const model = useModel({ profile, plannerState });

  const setDayTypeFromToolbar = useCallback(
    (next: Parameters<typeof plannerActions.setDayType>[0]) => {
      const hasEnabledScheduleRules = (profile.schedule?.rules ?? []).some(
        (r) => r.enabled,
      );

      if (!hasEnabledScheduleRules) {
        plannerActions.setDayType(next);
        return;
      }

      const today = asIsoDateString(toIsoDateStringLocalCalendar(new Date()));
      setScheduleOverride(today, next);
      plannerActions.setDayType(next);
    },
    [plannerActions, profile.schedule?.rules, setScheduleOverride],
  );

  const removeFoodAndEntries = useCallback(
    (foodId: FoodId) => {
      removeFood(foodId);
      plannerActions.removeEntriesForFood(foodId);
    },
    [plannerActions, removeFood],
  );

  const updateFoodWithMealEntrySync = useCallback(
    (foodId: FoodId, patch: Parameters<typeof updateFood>[1]) => {
      const prev = profile.foods[foodId];
      updateFood(foodId, patch);

      if (!prev) return;
      if (patch.unit && patch.unit !== prev.unit) {
        const nextPortion = patch.defaultPortion ?? prev.defaultPortion;
        plannerActions.setEntriesPortionForFood(foodId, nextPortion);
      }
    },
    [plannerActions, profile.foods, updateFood],
  );

  const foodModal = useFoodModal({
    foodsById: profile.foods,
    categories: model.categories,
    addFood,
    updateFood: updateFoodWithMealEntrySync,
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

  const changeFoodCategory = useCallback(
    (foodId: FoodId, categoryId: CategoryId) => {
      updateFood(foodId, { categoryId });
    },
    [updateFood],
  );

  const mealPanel = useMealPanel({
    mealDefs: model.mealDefs,
    addMeal,
    updateMeal,
    disableMeal,
    resetMealPanelsToDefault,
    saveMealPanelsAsDefault,
    setMealPanelOrder: plannerActions.setMealPanelOrder,
    resetMealPanelOrder: plannerActions.resetMealPanelOrder,
    resetHiddenMeals: plannerActions.resetHiddenMeals,
    hideMealPanel: plannerActions.hideMealPanel,
    clearMealFromBoard: plannerActions.clearMealFromBoard,
  });

  const category = useCategory({
    updateCategory,
    addCategory,
    removeCategory,
    reorderCategories,
  });

  const folder = useFolder({
    updateFolder,
    addFolder,
    removeFolder,
    reorderFolders,
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
      ...category.actions,
      ...folder.actions,
      ...targetModal.actions,
      ...schedule.actions,
      // glue actions
      openEditById,
      removeFoodAndEntries,
      addEntryToMealWithDefaultPortion,
      resetMealPanelsToDefault,
      changeFoodCategory,
      setDayType: setDayTypeFromToolbar,
    },
  };
}
