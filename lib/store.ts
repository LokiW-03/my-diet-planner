"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Category, FoodItem, MealEntry, MealKey, Unit } from "./models";
import { uid } from "./utils";

type MealsState = Record<MealKey, MealEntry[]>;

type PlannerState = {
    foods: FoodItem[];
    meals: MealsState;

    // modal helper: remember last day type if you want later; ignore for now
    dayType: "FULL" | "HALF" | "REST";
    setDayType: (t: "FULL" | "HALF" | "REST") => void;

    addFood: (food: Omit<FoodItem, "id">) => void;
    updateFood: (foodId: string, patch: Partial<Omit<FoodItem, "id">>) => void;
    removeFood: (foodId: string) => void;

    addEntryToMeal: (meal: MealKey, foodId: string, portion?: number) => void;
    removeEntryFromMeal: (meal: MealKey, entryId: string) => void;
    moveEntry: (from: MealKey, to: MealKey, entryId: string) => void;
    setEntryPortion: (meal: MealKey, entryId: string, portion: number) => void;
    clearAllMeals: () => void;
};

const initialFoods: FoodItem[] = [
    { id: uid("food"), name: "Beef A", category: "Proteins", unit: "g", kcalPerUnit: 3.19, proteinPerUnit: 0.26, defaultPortion: 100 },
    { id: uid("food"), name: "Chicken", category: "Proteins", unit: "g", kcalPerUnit: 2.39, proteinPerUnit: 0.27, defaultPortion: 110 },
    { id: uid("food"), name: "Shakes", category: "Proteins", unit: "pc", kcalPerUnit: 265, proteinPerUnit: 23, defaultPortion: 1 },

    { id: uid("food"), name: "Broccoli", category: "Veggies", unit: "g", kcalPerUnit: 0.34, proteinPerUnit: 0.028, defaultPortion: 100 },
    { id: uid("food"), name: "PakChoi", category: "Veggies", unit: "g", kcalPerUnit: 0.13, proteinPerUnit: 0.015, defaultPortion: 100 },
    { id: uid("food"), name: "Mixed", category: "Veggies", unit: "g", kcalPerUnit: 0.25, proteinPerUnit: 0.015, defaultPortion: 100 },

    { id: uid("food"), name: "Rice", category: "Carbs", unit: "g", kcalPerUnit: 1.30, proteinPerUnit: 0.028, defaultPortion: 80 },
    { id: uid("food"), name: "Dumplings", category: "Carbs", unit: "g", kcalPerUnit: 1.90, proteinPerUnit: 0.078, defaultPortion: 40 },
    { id: uid("food"), name: "Crackers", category: "Carbs", unit: "pc", kcalPerUnit: 35, proteinPerUnit: 0.7, defaultPortion: 2 },

    { id: uid("food"), name: "Babybel", category: "Others", unit: "pc", kcalPerUnit: 70, proteinPerUnit: 5, defaultPortion: 1 },
    { id: uid("food"), name: "Crisps", category: "Others", unit: "pc", kcalPerUnit: 150, proteinPerUnit: 2, defaultPortion: 1 },
];

const emptyMeals: MealsState = {
    breakfast: [],
    lunch: [],
    postworkout: [],
    dinner: [],
};

export const usePlannerStore = create<PlannerState>()(
    persist(
        (set, get) => ({
            foods: initialFoods,
            meals: emptyMeals,

            dayType: "FULL",
            setDayType: (t) => set({ dayType: t }),

            addFood: (food) =>
                set((s) => ({ foods: [...s.foods, { ...food, id: uid("food") }] })),

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

            clearAllMeals: () =>
                set(() => ({
                    meals: emptyMeals,
                })),

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
                    const nextFrom = fromEntries.filter((e) => e.entryId !== entryId);
                    const nextTo = [...s.meals[to], entry];

                    return { meals: { ...s.meals, [from]: nextFrom, [to]: nextTo } };
                }),

            setEntryPortion: (meal, entryId, portion) =>
                set((s) => ({
                    meals: {
                        ...s.meals,
                        [meal]: s.meals[meal].map((e) => (e.entryId === entryId ? { ...e, portion } : e)),
                    },
                })),
        }),
        { name: "diet-planner-v1" }
    )
);

// selector helpers
export function computeTotals(foods: FoodItem[], meals: MealsState) {
    const foodMap = new Map(foods.map((f) => [f.id, f]));
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
