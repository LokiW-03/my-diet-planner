// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type {
  CategoryId,
  FoodCategory,
  FoodId,
  FoodItem,
  ProfileId,
} from "@/shared/models";
import { useFoodModal } from "@/client/src/hooks/useFoodModal";

const foodId = (s: string) => s as unknown as FoodId;
const categoryId = (s: string) => s as unknown as CategoryId;
const profileId = (s: string) => s as unknown as ProfileId;

function category(v: {
  id: CategoryId;
  name: string;
  order: number;
  enabled: boolean;
}): FoodCategory {
  return {
    id: v.id,
    profileId: profileId("profile:test"),
    name: v.name,
    order: v.order,
    enabled: v.enabled,
    folderId: null,
  };
}

function food(v: {
  id: FoodId;
  name: string;
  categoryId: CategoryId;
  unit: "g" | "pc";
  kcalPerUnit: number;
  proteinPerUnit: number;
  fiberPerUnit: number;
  defaultPortion: number;
}): FoodItem {
  return {
    id: v.id,
    name: v.name,
    categoryId: v.categoryId,
    unit: v.unit,
    kcalPerUnit: v.kcalPerUnit,
    proteinPerUnit: v.proteinPerUnit,
    fiberPerUnit: v.fiberPerUnit,
    defaultPortion: v.defaultPortion,
  };
}

describe("useFoodModal", () => {
  it("openAdd resets form and opens modal", () => {
    const addFood = vi.fn();
    const updateFood = vi.fn();
    const removeFoodAndEntries = vi.fn();

    const catA = categoryId("cat:a");
    const catB = categoryId("cat:b");

    const { result } = renderHook(() =>
      useFoodModal({
        foodsById: {},
        categories: [
          category({ id: catB, name: "B", order: 1, enabled: true }),
          category({ id: catA, name: "A", order: 0, enabled: true }),
          category({
            id: categoryId("cat:disabled"),
            name: "Disabled",
            order: 999,
            enabled: false,
          }),
        ],
        addFood,
        updateFood,
        removeFoodAndEntries,
      }),
    );

    act(() => {
      result.current.actions.openAdd(catA);
    });

    expect(result.current.ui.foodModalOpen).toBe(true);
    expect(result.current.ui.foodModalMode).toBe("add");
    expect(result.current.ui.editingFoodId).toBeNull();

    const form = result.current.ui.foodForm;
    expect(form.name).toBe("");
    expect(form.categoryId).toBe(catA);
    expect(form.unit).toBe("g");
    expect(form.kcalPerUnit).toBe(0);
    expect(form.proteinPerUnit).toBe(0);
    expect(form.fiberPerUnit).toBe(0);
    expect(form.defaultPortion).toBe(100);
    expect(form.canSave).toBe(false);

    expect(result.current.ui.visibleCategories.map((c) => c.id)).toEqual([
      catA,
      catB,
    ]);
  });

  it("openEdit populates fields from food and opens modal", () => {
    const addFood = vi.fn();
    const updateFood = vi.fn();
    const removeFoodAndEntries = vi.fn();

    const catA = categoryId("cat:a");
    const f1 = food({
      id: foodId("food:1"),
      name: "Chicken",
      categoryId: catA,
      unit: "g",
      kcalPerUnit: 2.39,
      proteinPerUnit: 0.27,
      fiberPerUnit: 0.05,
      defaultPortion: 110,
    });

    const { result } = renderHook(() =>
      useFoodModal({
        foodsById: { [String(f1.id)]: f1 },
        categories: [
          category({ id: catA, name: "A", order: 0, enabled: true }),
        ],
        addFood,
        updateFood,
        removeFoodAndEntries,
      }),
    );

    act(() => {
      result.current.actions.openEdit(f1);
    });

    expect(result.current.ui.foodModalOpen).toBe(true);
    expect(result.current.ui.foodModalMode).toBe("edit");
    expect(result.current.ui.editingFoodId).toBe(f1.id);
    expect(result.current.ui.editingFood).toEqual(f1);

    const form = result.current.ui.foodForm;
    expect(form.name).toBe("Chicken");
    expect(form.categoryId).toBe(catA);
    expect(form.unit).toBe("g");
    expect(form.kcalPerUnit).toBe(2.39);
    expect(form.proteinPerUnit).toBe(0.27);
    expect(form.fiberPerUnit).toBe(0.05);
    expect(form.defaultPortion).toBe(110);
    expect(form.canSave).toBe(true);
  });

  it("saveFood validates required fields and clamps defaultPortion", () => {
    const addFood = vi.fn();
    const updateFood = vi.fn();

    const removeFoodAndEntries = vi.fn();

    const catA = categoryId("cat:a");

    const { result } = renderHook(() =>
      useFoodModal({
        foodsById: {},
        categories: [
          category({ id: catA, name: "A", order: 0, enabled: true }),
        ],
        addFood,
        updateFood,
        removeFoodAndEntries,
      }),
    );

    act(() => {
      result.current.actions.openAdd(catA);
      result.current.actions.setFoodName("   ");
    });

    act(() => {
      result.current.actions.saveFood();
    });

    expect(addFood).not.toHaveBeenCalled();
    expect(result.current.ui.foodModalOpen).toBe(true);

    act(() => {
      result.current.actions.setFoodName("  Apple  ");
      result.current.actions.setFoodDefaultPortion(-10);
    });

    act(() => {
      result.current.actions.saveFood();
    });

    expect(addFood).toHaveBeenCalledWith({
      name: "Apple",
      categoryId: catA,
      unit: "g",
      kcalPerUnit: 0,
      proteinPerUnit: 0,
      fiberPerUnit: 0,
      defaultPortion: 0,
    });
    expect(result.current.ui.foodModalOpen).toBe(false);
  });

  it("saveFood updates existing food when editing", () => {
    const addFood = vi.fn();
    const updateFood = vi.fn();
    const removeFoodAndEntries = vi.fn();

    const catA = categoryId("cat:a");
    const f1 = food({
      id: foodId("food:1"),
      name: "Old",
      categoryId: catA,
      unit: "pc",
      kcalPerUnit: 10,
      proteinPerUnit: 20,
      fiberPerUnit: 7,
      defaultPortion: 1,
    });

    const { result } = renderHook(() =>
      useFoodModal({
        foodsById: { [String(f1.id)]: f1 },
        categories: [
          category({ id: catA, name: "A", order: 0, enabled: true }),
        ],
        addFood,
        updateFood,
        removeFoodAndEntries,
      }),
    );

    act(() => {
      result.current.actions.openEdit(f1);
    });

    act(() => {
      result.current.actions.setFoodName("  New Name ");
      result.current.actions.setFoodDefaultPortion(123.7);
    });

    act(() => {
      result.current.actions.saveFood();
    });

    expect(updateFood).toHaveBeenCalledWith(f1.id, {
      name: "New Name",
      categoryId: catA,
      unit: "pc",
      kcalPerUnit: 10,
      proteinPerUnit: 20,
      fiberPerUnit: 7,
      defaultPortion: 123,
    });
    expect(result.current.ui.foodModalOpen).toBe(false);
  });

  it("deleteEditingFood removes food and closes modal", () => {
    const addFood = vi.fn();
    const updateFood = vi.fn();
    const removeFoodAndEntries = vi.fn();

    const catA = categoryId("cat:a");
    const f1 = food({
      id: foodId("food:1"),
      name: "Delete Me",
      categoryId: catA,
      unit: "g",
      kcalPerUnit: 1,
      proteinPerUnit: 1,
      fiberPerUnit: 0,
      defaultPortion: 100,
    });

    const { result } = renderHook(() =>
      useFoodModal({
        foodsById: { [String(f1.id)]: f1 },
        categories: [
          category({ id: catA, name: "A", order: 0, enabled: true }),
        ],
        addFood,
        updateFood,
        removeFoodAndEntries,
      }),
    );

    act(() => {
      result.current.actions.openEdit(f1);
    });

    act(() => {
      result.current.actions.deleteEditingFood();
    });

    expect(removeFoodAndEntries).toHaveBeenCalledWith(f1.id);
    expect(result.current.ui.foodModalOpen).toBe(false);
  });
});
