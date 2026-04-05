// @vitest-environment jsdom

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { MealDefinition, MealId } from "@/shared/models";
import { useMealPanel } from "@/client/src/hooks/useMealPanel";

const mealId = (s: string) => s as unknown as MealId;

function meal(v: {
  id: MealId;
  name: string;
  enabled: boolean;
  order: number;
}): MealDefinition {
  return {
    id: v.id,
    name: v.name,
    enabled: v.enabled,
    order: v.order,
  };
}

describe("useMealPanel", () => {
  it("insertMealPanel inserts at the requested index (clamped)", () => {
    const a = mealId("meal:a");
    const b = mealId("meal:b");
    const newId = mealId("meal:new");

    const addMeal = vi.fn<(meal: Omit<MealDefinition, "id">) => MealId>(
      () => newId,
    );
    const setMealPanelOrder = vi.fn<(order: MealId[]) => void>();

    const { result } = renderHook(() =>
      useMealPanel({
        mealDefs: [
          meal({ id: a, name: "A", enabled: true, order: 0 }),
          meal({ id: b, name: "B", enabled: true, order: 1 }),
        ],
        addMeal,
        updateMeal: vi.fn(),
        disableMeal: vi.fn(),
        resetMealPanelsToDefault: vi.fn(),
        saveMealPanelsAsDefault: vi.fn(async () => {}),
        setMealPanelOrder,
        resetMealPanelOrder: vi.fn(),
        resetHiddenMeals: vi.fn(),
        hideMealPanel: vi.fn(),
        clearMealFromBoard: vi.fn(),
      }),
    );

    act(() => {
      result.current.actions.insertMealPanel(1);
    });

    expect(addMeal).toHaveBeenCalledWith({
      name: "New Meal",
      enabled: true,
      order: 10_000,
    });
    expect(setMealPanelOrder).toHaveBeenCalledWith([a, newId, b]);
  });

  it("removeMealPanel hides the panel and clears the board", () => {
    const a = mealId("meal:a");

    const hideMealPanel = vi.fn<(id: MealId) => void>();
    const clearMealFromBoard = vi.fn<(id: MealId) => void>();

    const { result } = renderHook(() =>
      useMealPanel({
        mealDefs: [],
        addMeal: vi.fn(),
        updateMeal: vi.fn(),
        disableMeal: vi.fn(),
        resetMealPanelsToDefault: vi.fn(),
        saveMealPanelsAsDefault: vi.fn(async () => {}),
        setMealPanelOrder: vi.fn(),
        resetMealPanelOrder: vi.fn(),
        resetHiddenMeals: vi.fn(),
        hideMealPanel,
        clearMealFromBoard,
      }),
    );

    act(() => {
      result.current.actions.removeMealPanel(a);
    });

    expect(hideMealPanel).toHaveBeenCalledWith(a);
    expect(clearMealFromBoard).toHaveBeenCalledWith(a);
  });

  it("renameMealPanel trims and ignores empty names", () => {
    const a = mealId("meal:a");
    const updateMeal =
      vi.fn<(id: MealId, patch: Partial<Omit<MealDefinition, "id">>) => void>();

    const { result } = renderHook(() =>
      useMealPanel({
        mealDefs: [],
        addMeal: vi.fn(),
        updateMeal,
        disableMeal: vi.fn(),
        resetMealPanelsToDefault: vi.fn(),
        saveMealPanelsAsDefault: vi.fn(async () => {}),
        setMealPanelOrder: vi.fn(),
        resetMealPanelOrder: vi.fn(),
        resetHiddenMeals: vi.fn(),
        hideMealPanel: vi.fn(),
        clearMealFromBoard: vi.fn(),
      }),
    );

    act(() => {
      result.current.actions.renameMealPanel(a, "   ");
      result.current.actions.renameMealPanel(a, "  Dinner  ");
    });

    expect(updateMeal).toHaveBeenCalledTimes(1);
    expect(updateMeal).toHaveBeenCalledWith(a, { name: "Dinner" });
  });

  it("resetAllMealPanels resets defs, order, and hidden meals", () => {
    const resetMealPanelsToDefault = vi.fn<() => void>();
    const resetHiddenMeals = vi.fn<() => void>();
    const resetMealPanelOrder = vi.fn<() => void>();

    const { result } = renderHook(() =>
      useMealPanel({
        mealDefs: [],
        addMeal: vi.fn(),
        updateMeal: vi.fn(),
        disableMeal: vi.fn(),
        resetMealPanelsToDefault,
        saveMealPanelsAsDefault: vi.fn(async () => {}),
        setMealPanelOrder: vi.fn(),
        resetMealPanelOrder,
        resetHiddenMeals,
        hideMealPanel: vi.fn(),
        clearMealFromBoard: vi.fn(),
      }),
    );

    act(() => {
      result.current.actions.resetAllMealPanels();
    });

    expect(resetMealPanelsToDefault).toHaveBeenCalled();
    expect(resetHiddenMeals).toHaveBeenCalled();
    expect(resetMealPanelOrder).toHaveBeenCalled();
  });

  it("saveMealPanelsAsDefaultForCurrentOrder passes current IDs", () => {
    const a = mealId("meal:a");
    const b = mealId("meal:b");

    const saveMealPanelsAsDefault = vi.fn<(ids: MealId[]) => Promise<void>>(
      async () => {},
    );

    const { result } = renderHook(() =>
      useMealPanel({
        mealDefs: [
          meal({ id: a, name: "A", enabled: true, order: 0 }),
          meal({ id: b, name: "B", enabled: true, order: 1 }),
        ],
        addMeal: vi.fn(),
        updateMeal: vi.fn(),
        disableMeal: vi.fn(),
        resetMealPanelsToDefault: vi.fn(),
        saveMealPanelsAsDefault,
        setMealPanelOrder: vi.fn(),
        resetMealPanelOrder: vi.fn(),
        resetHiddenMeals: vi.fn(),
        hideMealPanel: vi.fn(),
        clearMealFromBoard: vi.fn(),
      }),
    );

    act(() => {
      result.current.actions.saveMealPanelsAsDefaultForCurrentOrder();
    });

    expect(saveMealPanelsAsDefault).toHaveBeenCalledWith([a, b]);
  });
});
