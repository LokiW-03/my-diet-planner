"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MealEntry, FoodId, MealId, TargetId } from "@/shared/models";
import { defaultTargetId } from "@/shared/defaults";
import { uid } from "@/shared/utils";

export const usePlannerStore = create<PlannerState>()(
  persist(
    (set) => ({
      meals: {} as MealsState,
      dayType: defaultTargetId("FULL"),
      hiddenMeals: {} as Record<MealId, true>,
      hideMealPanel: (mealId: MealId) =>
        set((s) => ({ hiddenMeals: { ...s.hiddenMeals, [mealId]: true } })),
      showMealPanel: (mealId: MealId) =>
        set((s) => {
          const newHidden = { ...s.hiddenMeals };
          delete newHidden[mealId];
          return { hiddenMeals: newHidden };
        }),
      resetHiddenMeals: () => set({ hiddenMeals: {} }),

      mealPanelOrder: [],
      setMealPanelOrder: (order) => set({ mealPanelOrder: order }),
      resetMealPanelOrder: () => set({ mealPanelOrder: [] }),

      setDayType: (t) => set({ dayType: t }),

      addEntryToMeal: (mealId, foodId, portion) =>
        set((s) => {
          const entry: MealEntry = { entryId: uid("entry"), foodId, portion };
          return {
            meals: {
              ...s.meals,
              [mealId]: [...(s.meals[mealId] ?? []), entry],
            },
          };
        }),

      removeEntryFromMeal: (mealId, entryId) =>
        set((s) => ({
          meals: {
            ...s.meals,
            [mealId]: (s.meals[mealId] ?? []).filter(
              (e) => e.entryId !== entryId,
            ),
          },
        })),

      clearMealFromBoard: (mealId) =>
        set((s) => {
          const newMeals = { ...s.meals };
          delete newMeals[mealId];
          return { meals: newMeals };
        }),

      moveEntry: (from, to, entryId) =>
        set((s) => {
          if (from === to) return s;
          const fromEntries = s.meals[from] ?? [];
          const idx = fromEntries.findIndex((e) => e.entryId === entryId);
          if (idx === -1) return s;
          const entry = fromEntries[idx];
          return {
            meals: {
              ...s.meals,
              [from]: fromEntries.filter((e) => e.entryId !== entryId),
              [to]: [...(s.meals[to] ?? []), entry],
            },
          };
        }),

      setEntryPortion: (mealId, entryId, portion) =>
        set((s) => ({
          meals: {
            ...s.meals,
            [mealId]: (s.meals[mealId] ?? []).map((e) =>
              e.entryId === entryId ? { ...e, portion } : e,
            ),
          },
        })),

      removeEntriesForFood: (foodId) =>
        set((s) => ({
          meals: Object.fromEntries(
            Object.entries(s.meals).map(([k, entries]) => [
              k,
              entries.filter((e) => e.foodId !== foodId),
            ]),
          ) as MealsState,
        })),

      clearAllMeals: () => set({ meals: {} }),
    }),
    {
      name: "diet-planner-v2",
      partialize: (s) => ({
        meals: s.meals,
        dayType: s.dayType,
        hiddenMeals: s.hiddenMeals,
        mealPanelOrder: s.mealPanelOrder,
      }),
    },
  ),
);

// Meals are keyed by MealId (string) — dynamic, driven by profile
type MealsState = Record<MealId, MealEntry[]>;

type PlannerState = {
  meals: MealsState;

  // The ID of the currently selected Target (from profile.targets)
  dayType: TargetId;
  setDayType: (targetId: TargetId) => void;

  hiddenMeals: Record<MealId, true>; // MealIds of meals that are currently hidden in the UI
  hideMealPanel: (mealId: MealId) => void;
  showMealPanel: (mealId: MealId) => void;
  resetHiddenMeals: () => void;

  mealPanelOrder: MealId[];
  setMealPanelOrder: (order: MealId[]) => void;
  resetMealPanelOrder: () => void;

  addEntryToMeal: (mealId: MealId, foodId: FoodId, portion: number) => void;
  removeEntryFromMeal: (mealId: MealId, entryId: string) => void;
  clearMealFromBoard: (mealId: MealId) => void;
  moveEntry: (from: MealId, to: MealId, entryId: string) => void;
  setEntryPortion: (mealId: MealId, entryId: string, portion: number) => void;
  removeEntriesForFood: (foodId: FoodId) => void;
  clearAllMeals: () => void;
};
