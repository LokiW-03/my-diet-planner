"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
    FoodCategory,
    FoodItem,
    MealEntry,
    FoodId,
} from "../../../shared/models";
import type { MealKey, TargetName } from "@/shared/defaults";
import { createEmptyMealsState } from "@/shared/defaults";
import { uid } from "../../../shared/utils";
import { DEFAULTS_VERSION, DEFAULT_CATEGORIES, DEFAULT_FOODS } from "@/shared/defaults";

type MealsState = Record<MealKey, MealEntry[]>;

type PlannerState = {
    categories: FoodCategory[];
    foods: FoodItem[];
    meals: MealsState;

    dayType: TargetName;
    setDayType: (t: TargetName) => void;

    addFood: (food: Omit<FoodItem, "id">) => void;
    updateFood: (foodId: FoodId, patch: Partial<Omit<FoodItem, "id">>) => void;
    removeFood: (foodId: FoodId) => void;

    addEntryToMeal: (meal: MealKey, foodId: FoodId, portion?: number) => void;
    removeEntryFromMeal: (meal: MealKey, entryId: string) => void;
    moveEntry: (from: MealKey, to: MealKey, entryId: string) => void;
    setEntryPortion: (meal: MealKey, entryId: string, portion: number) => void;
    clearAllMeals: () => void;
};

const newEmptyMeals = () => createEmptyMealsState();

export const usePlannerStore = create<PlannerState>()(
    persist(
        (set, get) => ({
            seedVersion: DEFAULTS_VERSION,
            categories: DEFAULT_CATEGORIES,
            foods: DEFAULT_FOODS,
            meals: newEmptyMeals(),

            dayType: "FULL",
            setDayType: (t) => set({ dayType: t }),

            addFood: (food) =>
                set((s) => ({ foods: [...s.foods, { ...food, id: uid("food") as FoodId }] })),

            updateFood: (foodId, patch) =>
                set((s) => ({
                    foods: s.foods.map((f) => (f.id === foodId ? { ...f, ...patch } : f)),
                })),

            removeFood: (foodId) =>
                set((s) => ({
                    foods: s.foods.filter((f) => f.id !== foodId),
                    meals: Object.fromEntries(
                        Object.entries(s.meals).map(([k, entries]) => [
                            k,
                            (entries as MealEntry[]).filter((e) => e.foodId !== foodId),
                        ])
                    ) as MealsState,
                })),

            clearAllMeals: () => set({ meals: newEmptyMeals() }),

            addEntryToMeal: (meal, foodId, portion) =>
                set((s) => {
                    const food = s.foods.find((f) => f.id === foodId);
                    if (!food) return s;

                    const entry: MealEntry = {
                        entryId: uid("entry"),
                        foodId,
                        portion: portion ?? food.defaultPortion,
                    };

                    return { meals: { ...s.meals, [meal]: [...s.meals[meal], entry] } };
                }),

            removeEntryFromMeal: (meal, entryId) =>
                set((s) => ({
                    meals: { ...s.meals, [meal]: s.meals[meal].filter((e) => e.entryId !== entryId) },
                })),

            moveEntry: (from, to, entryId) =>
                set((s) => {
                    if (from === to) return s;
                    const fromEntries = s.meals[from];
                    const idx = fromEntries.findIndex((e) => e.entryId === entryId);
                    if (idx === -1) return s;

                    const entry = fromEntries[idx];
                    return {
                        meals: {
                            ...s.meals,
                            [from]: fromEntries.filter((e) => e.entryId !== entryId),
                            [to]: [...s.meals[to], entry],
                        },
                    };
                }),

            setEntryPortion: (meal, entryId, portion) =>
                set((s) => ({
                    meals: {
                        ...s.meals,
                        [meal]: s.meals[meal].map((e) => (e.entryId === entryId ? { ...e, portion } : e)),
                    },
                })),
        }),
        {
            name: "diet-planner-v1",
            version: 1,
            migrate: (ps: any) => ps ?? {},
            merge: (persistedState, currentState) => {
                const ps: any = persistedState ?? {};
                const psSeed = typeof ps.seedVersion === "number" ? ps.seedVersion : 0;

                // Reset stale local storage when defaults change
                if (psSeed !== DEFAULTS_VERSION) return currentState;

                return { ...currentState, ...ps, seedVersion: DEFAULTS_VERSION };
            },
        }
    )
);

// selector helpers
export function computeTotals(foods: FoodItem[], meals: MealsState) {
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