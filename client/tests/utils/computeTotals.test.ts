import { describe, expect, it } from "vitest";
import type {
  CategoryId,
  FoodId,
  FoodItem,
  MealDefinition,
  MealEntry,
  MealId,
} from "@/shared/models";
import {
  computeMealTotals,
  computeTotals,
} from "@/client/src/utils/computeTotals";

const foodId = (s: string) => s as unknown as FoodId;
const categoryId = (s: string) => s as unknown as CategoryId;
const mealId = (s: string) => s as unknown as MealId;

function food(partial: Omit<FoodItem, "id"> & { id: string }): FoodItem {
  return {
    id: foodId(partial.id),
    name: partial.name,
    categoryId: partial.categoryId,
    unit: partial.unit,
    kcalPerUnit: partial.kcalPerUnit,
    proteinPerUnit: partial.proteinPerUnit,
    fiberPerUnit: partial.fiberPerUnit,
    defaultPortion: partial.defaultPortion,
  };
}

function entry(v: {
  entryId: string;
  foodId: string;
  portion: number;
}): MealEntry {
  return {
    entryId: v.entryId,
    foodId: foodId(v.foodId),
    portion: v.portion,
  };
}

describe("computeTotals", () => {
  it("sums kcal/protein across all meals and ignores missing foods", () => {
    const foods: FoodItem[] = [
      food({
        id: "food:a",
        name: "A",
        categoryId: categoryId("cat:x"),
        unit: "g",
        kcalPerUnit: 2,
        proteinPerUnit: 1,
        fiberPerUnit: 0.1,
        defaultPortion: 100,
      }),
      food({
        id: "food:b",
        name: "B",
        categoryId: categoryId("cat:x"),
        unit: "pc",
        kcalPerUnit: 50,
        proteinPerUnit: 10,
        fiberPerUnit: 5,
        defaultPortion: 1,
      }),
    ];

    const meals: Record<MealId, MealEntry[]> = {
      [mealId("meal:1")]: [
        entry({ entryId: "e1", foodId: "food:a", portion: 100 }), // 200 kcal, 100 protein
        entry({ entryId: "e2", foodId: "food:missing", portion: 10 }),
      ],
      [mealId("meal:2")]: [
        entry({ entryId: "e3", foodId: "food:b", portion: 2 }),
      ], // 100 kcal, 20 protein
    };

    const totals = computeTotals(foods, meals);
    expect(totals).toEqual({ kcal: 300, protein: 120, fiber: 20 });
  });

  it("filters by includeMealIds when provided", () => {
    const foods: FoodItem[] = [
      food({
        id: "food:a",
        name: "A",
        categoryId: categoryId("cat:x"),
        unit: "g",
        kcalPerUnit: 1,
        proteinPerUnit: 2,
        fiberPerUnit: 3,
        defaultPortion: 100,
      }),
    ];

    const meals: Record<MealId, MealEntry[]> = {
      [mealId("meal:1")]: [
        entry({ entryId: "e1", foodId: "food:a", portion: 10 }),
      ],
      [mealId("meal:2")]: [
        entry({ entryId: "e2", foodId: "food:a", portion: 5 }),
      ],
    };

    const totals = computeTotals(foods, meals, [mealId("meal:2")]);
    expect(totals).toEqual({ kcal: 5, protein: 10, fiber: 15 });
  });
});

describe("computeMealTotals", () => {
  it("computes totals per meal def and returns 0 for empty meals", () => {
    const foods: FoodItem[] = [
      food({
        id: "food:a",
        name: "A",
        categoryId: categoryId("cat:x"),
        unit: "g",
        kcalPerUnit: 2,
        proteinPerUnit: 3,
        fiberPerUnit: 0,
        defaultPortion: 100,
      }),
    ];

    const meals: Record<MealId, MealEntry[]> = {
      [mealId("meal:1")]: [
        entry({ entryId: "e1", foodId: "food:a", portion: 10 }),
        entry({ entryId: "e2", foodId: "food:missing", portion: 99 }),
      ],
    };

    const mealDefs: MealDefinition[] = [
      { id: mealId("meal:1"), name: "One", order: 0, enabled: true },
      { id: mealId("meal:2"), name: "Two", order: 1, enabled: true },
    ];

    const out = computeMealTotals(foods, meals, mealDefs);
    expect(out[mealId("meal:1")]).toEqual({ kcal: 20, protein: 30, fiber: 0 });
    expect(out[mealId("meal:2")]).toEqual({ kcal: 0, protein: 0, fiber: 0 });
  });
});
