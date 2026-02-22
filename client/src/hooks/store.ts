"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
    CategoryId,
    FoodCategory,
    FoodItem,
    MealEntry,
    MealKey,
    FoodId,
} from "../../../shared/models";
import { CATEGORIES } from "../../../shared/models";
import { uid } from "../../../shared/utils";

const defaultCategoryId = (name: string) => (`cat:${name}` as unknown as CategoryId);

type MealsState = Record<MealKey, MealEntry[]>;

type PlannerState = {
    categories: FoodCategory[]; // <-- ADD THIS
    foods: FoodItem[];
    meals: MealsState;

    dayType: "FULL" | "HALF" | "REST";
    setDayType: (t: "FULL" | "HALF" | "REST") => void;

    addFood: (food: Omit<FoodItem, "id">) => void;
    updateFood: (foodId: FoodId, patch: Partial<Omit<FoodItem, "id">>) => void;
    removeFood: (foodId: FoodId) => void;

    addEntryToMeal: (meal: MealKey, foodId: FoodId, portion?: number) => void;
    removeEntryFromMeal: (meal: MealKey, entryId: string) => void;
    moveEntry: (from: MealKey, to: MealKey, entryId: string) => void;
    setEntryPortion: (meal: MealKey, entryId: string, portion: number) => void;
    clearAllMeals: () => void;
};

const initialCategories: FoodCategory[] = CATEGORIES.map((name, i) => ({
    id: defaultCategoryId(name),
    profileId: "local",
    name,
    order: i,
    enabled: true,
}));

const catIdByName = new Map(initialCategories.map((c) => [c.name, c.id] as const));
const catId = (name: string) => catIdByName.get(name) ?? defaultCategoryId(CATEGORIES[0]);

const initialFoods: FoodItem[] = [
    { id: uid("food") as FoodId, name: "Beef A", categoryId: catId("Proteins"), unit: "g", kcalPerUnit: 3.19, proteinPerUnit: 0.26, defaultPortion: 100 },
    { id: uid("food") as FoodId, name: "Chicken", categoryId: catId("Proteins"), unit: "g", kcalPerUnit: 2.39, proteinPerUnit: 0.27, defaultPortion: 110 },
    { id: uid("food") as FoodId, name: "Shakes", categoryId: catId("Proteins"), unit: "pc", kcalPerUnit: 265, proteinPerUnit: 23, defaultPortion: 1 },

    { id: uid("food") as FoodId, name: "Broccoli", categoryId: catId("Veggies"), unit: "g", kcalPerUnit: 0.34, proteinPerUnit: 0.028, defaultPortion: 100 },
    { id: uid("food") as FoodId, name: "PakChoi", categoryId: catId("Veggies"), unit: "g", kcalPerUnit: 0.13, proteinPerUnit: 0.015, defaultPortion: 100 },
    { id: uid("food") as FoodId, name: "Mixed", categoryId: catId("Veggies"), unit: "g", kcalPerUnit: 0.25, proteinPerUnit: 0.015, defaultPortion: 100 },

    { id: uid("food") as FoodId, name: "Rice", categoryId: catId("Carbs"), unit: "g", kcalPerUnit: 1.30, proteinPerUnit: 0.028, defaultPortion: 80 },
    { id: uid("food") as FoodId, name: "Dumplings", categoryId: catId("Carbs"), unit: "g", kcalPerUnit: 1.90, proteinPerUnit: 0.078, defaultPortion: 40 },
    { id: uid("food") as FoodId, name: "Crackers", categoryId: catId("Carbs"), unit: "pc", kcalPerUnit: 35, proteinPerUnit: 0.7, defaultPortion: 2 },

    { id: uid("food") as FoodId, name: "Babybel", categoryId: catId("Others"), unit: "pc", kcalPerUnit: 70, proteinPerUnit: 5, defaultPortion: 1 },
    { id: uid("food") as FoodId, name: "Crisps", categoryId: catId("Others"), unit: "pc", kcalPerUnit: 150, proteinPerUnit: 2, defaultPortion: 1 },
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
            categories: initialCategories,
            foods: initialFoods,
            meals: emptyMeals,

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

            clearAllMeals: () => set({ meals: emptyMeals }),

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
            version: 4,
            migrate: (persistedState: any, _version: number) => {
                // Allow old state to load; merge() below will enforce defaults / self-heal.
                return persistedState ?? {};
            },
            merge: (persistedState, currentState) => {
                const ps: any = persistedState ?? {};

                // start with normal shallow merge
                const merged: any = { ...currentState, ...ps };

                // ensure defaults when arrays missing/empty
                merged.categories =
                    Array.isArray(ps.categories) && ps.categories.length > 0
                        ? ps.categories
                        : currentState.categories;

                merged.foods =
                    Array.isArray(ps.foods) && ps.foods.length > 0
                        ? ps.foods
                        : currentState.foods;

                merged.meals = ps.meals ?? currentState.meals;
                merged.dayType = ps.dayType ?? currentState.dayType;

                // if foods don’t match any category ids, reset to defaults
                const catIds = new Set(merged.categories.map((c: any) => String(c.id)));
                const hasAtLeastOneValidFoodCategory = merged.foods.some((f: any) =>
                    catIds.has(String(f.categoryId))
                );

                if (!hasAtLeastOneValidFoodCategory) {
                    merged.categories = currentState.categories;
                    merged.foods = currentState.foods;
                }

                return merged;
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