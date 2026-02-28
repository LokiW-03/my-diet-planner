import type { CategoryId, FoodCategory, FoodId, FoodItem, MealEntry, Target, TargetId } from "./models";

export const DEFAULTS_VERSION = 1;

export const defaultCategoryId = (name: string) => `cat:${name}` as unknown as CategoryId;

export const CATEGORIES = ["Proteins", "Veggies", "Carbs", "Others"] as const;
export type Category = (typeof CATEGORIES)[number];

export const MEALS = ["breakfast", "lunch", "dinner"] as const;
export type MealKey = (typeof MEALS)[number];

export const UNITS = ["g", "pc"] as const;
export type Unit = (typeof UNITS)[number];

const slugify = (s: string) =>
    s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export const defaultFoodId = (name: string) => `food:${slugify(name)}` as unknown as FoodId;

export const DEFAULT_CATEGORIES: FoodCategory[] = CATEGORIES.map((name, i) => ({
    id: defaultCategoryId(name),
    profileId: "local",
    name,
    order: i,
    enabled: true,
}));

const catIdByName = new Map(DEFAULT_CATEGORIES.map((c) => [c.name, c.id] as const));
const catId = (name: string) => catIdByName.get(name) ?? defaultCategoryId(CATEGORIES[0]);

const food = (v: Omit<FoodItem, "id"> & { name: string }): FoodItem => ({
    id: defaultFoodId(v.name),
    ...v,
});

export const DEFAULT_FOODS: FoodItem[] = [
    food({ name: "Beef A", categoryId: catId("Proteins"), unit: "g", kcalPerUnit: 3.19, proteinPerUnit: 0.26, defaultPortion: 100 }),
    food({ name: "Chicken", categoryId: catId("Proteins"), unit: "g", kcalPerUnit: 2.39, proteinPerUnit: 0.27, defaultPortion: 110 }),
    food({ name: "Shakes", categoryId: catId("Proteins"), unit: "pc", kcalPerUnit: 265, proteinPerUnit: 23, defaultPortion: 1 }),
    food({ name: "Broccoli", categoryId: catId("Veggies"), unit: "g", kcalPerUnit: 0.34, proteinPerUnit: 0.028, defaultPortion: 100 }),
    food({ name: "PakChoi", categoryId: catId("Veggies"), unit: "g", kcalPerUnit: 0.13, proteinPerUnit: 0.015, defaultPortion: 100 }),
    food({ name: "Mixed", categoryId: catId("Veggies"), unit: "g", kcalPerUnit: 0.25, proteinPerUnit: 0.015, defaultPortion: 100 }),
    food({ name: "Rice", categoryId: catId("Carbs"), unit: "g", kcalPerUnit: 1.3, proteinPerUnit: 0.028, defaultPortion: 80 }),
    food({ name: "Dumplings", categoryId: catId("Carbs"), unit: "g", kcalPerUnit: 1.9, proteinPerUnit: 0.078, defaultPortion: 40 }),
    food({ name: "Crackers", categoryId: catId("Carbs"), unit: "pc", kcalPerUnit: 35, proteinPerUnit: 0.7, defaultPortion: 2 }),
    food({ name: "Babybel", categoryId: catId("Others"), unit: "pc", kcalPerUnit: 70, proteinPerUnit: 5, defaultPortion: 1 }),
    food({ name: "Crisps", categoryId: catId("Others"), unit: "pc", kcalPerUnit: 150, proteinPerUnit: 2, defaultPortion: 1 }),
    food({ name: "Bread Roll", categoryId: catId("Carbs"), unit: "pc", kcalPerUnit: 128, proteinPerUnit: 2.8, defaultPortion: 1 }),
    food({ name: "Arla Yogurt", categoryId: catId("Proteins"), unit: "pc", kcalPerUnit: 142, proteinPerUnit: 25, defaultPortion: 1 }),
];

export function createEmptyMealsState(): Record<MealKey, MealEntry[]> {
    return Object.fromEntries(MEALS.map((k) => [k, [] as MealEntry[]])) as Record<MealKey, MealEntry[]>;
}

export const defaultTargetId = (name: string) => `target:${name}` as unknown as TargetId;

export const DEFAULT_TARGETS = [
    { id: defaultTargetId("FULL"), name: "FULL", minKcal: 1500, maxKcal: 1600 },
    { id: defaultTargetId("HALF"), name: "HALF", minKcal: 1400, maxKcal: 1500 },
    { id: defaultTargetId("REST"), name: "REST", minKcal: 1350, maxKcal: 1450 },
] as const satisfies readonly Target[];

export type TargetName = (typeof DEFAULT_TARGETS)[number]["name"];

export const TARGETS_BY_NAME = Object.fromEntries(
    DEFAULT_TARGETS.map((t) => [t.name, t] as const)
) as Record<TargetName, Target>;
