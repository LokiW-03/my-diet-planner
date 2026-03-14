"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { FoodItem, MealEntry, FoodId } from "../../../shared/models";
import { defaultTargetId } from "@/shared/defaults";
import { uid } from "../../../shared/utils";

// Meals are keyed by MealId (string) — dynamic, driven by profile
type MealsState = Record<string, MealEntry[]>;

type PlannerState = {
    meals: MealsState;

    // The ID of the currently selected Target (from profile.targets)
    dayType: string;
    setDayType: (targetId: string) => void;

    hiddenMeals: Record<string, true>; // MealIds of meals that are currently hidden in the UI
    hideMealPanel: (mealId: string) => void;
    showMealPanel: (mealId: string) => void;
    resetHiddenMeals: () => void;

    mealPanelOrder: string[];
    setMealPanelOrder: (order: string[]) => void;
    resetMealPanelOrder: () => void;

    addEntryToMeal: (mealId: string, foodId: FoodId, portion: number) => void;
    removeEntryFromMeal: (mealId: string, entryId: string) => void;
    removeMeal: (mealId: string) => void;
    moveEntry: (from: string, to: string, entryId: string) => void;
    setEntryPortion: (mealId: string, entryId: string, portion: number) => void;
    removeEntriesForFood: (foodId: FoodId) => void;
    clearAllMeals: () => void;
};

export const usePlannerStore = create<PlannerState>()(
    persist(
        (set) => ({
            meals: {},
            dayType: defaultTargetId("FULL"),
            hiddenMeals: {} as Record<string, true>,
            hideMealPanel: (mealId: string) => set((s) => ({ hiddenMeals: { ...s.hiddenMeals, [mealId]: true } })),
            showMealPanel: (mealId: string) => set((s) => {
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
                    return { meals: { ...s.meals, [mealId]: [...(s.meals[mealId] ?? []), entry] } };
                }),

            removeEntryFromMeal: (mealId, entryId) =>
                set((s) => ({
                    meals: { ...s.meals, [mealId]: (s.meals[mealId] ?? []).filter((e) => e.entryId !== entryId) },
                })),

            removeMeal: (mealId) =>
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
                        [mealId]: (s.meals[mealId] ?? []).map((e) => (e.entryId === entryId ? { ...e, portion } : e)),
                    },
                })),

            removeEntriesForFood: (foodId) =>
                set((s) => ({
                    meals: Object.fromEntries(
                        Object.entries(s.meals).map(([k, entries]) => [
                            k,
                            entries.filter((e) => e.foodId !== foodId),
                        ])
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
        }
    )
);

// selector helpers
export function computeTotals(foods: FoodItem[], meals: Record<string, MealEntry[]>) {
    const foodMap = new Map<FoodId, FoodItem>(foods.map((f) => [f.id, f]));
    let kcal = 0;
    let protein = 0;

    for (const entries of Object.values(meals)) {
        for (const e of entries) {
            const f = foodMap.get(e.foodId);
            if (!f) continue;
            kcal += e.portion * f.kcalPerUnit;
            protein += e.portion * f.proteinPerUnit;
        }
    }

    return { kcal, protein };
}