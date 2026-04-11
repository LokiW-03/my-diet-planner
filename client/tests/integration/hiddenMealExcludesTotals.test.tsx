// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";

import { usePlannerStore } from "@/client/src/hooks/useStore";
import { defaultFoodId, defaultFoods, defaultMealId } from "@/shared/defaults";
import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

function getTotalCard() {
    const el = screen.getByText("TOTAL").parentElement;
    expect(el).toBeTruthy();
    return el as HTMLElement;
}

function expectDayTotals(opts: { kcal: number; protein: number }) {
    const totalCard = getTotalCard();
    expect(within(totalCard).getByText(`${Math.round(opts.kcal)} kcal`)).toBeTruthy();
    expect(within(totalCard).getByText(`${Math.round(opts.protein)}g Protein`)).toBeTruthy();
}

async function bulkAddFoodToMeal(opts: { foodName: string; mealName: string }) {
    fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));
    fireEvent.click(await screen.findByLabelText(`Select ${opts.foodName}`));
    fireEvent.click(screen.getByTitle("Add selected foods to this meal panel"));
    fireEvent.click(await screen.findByRole("button", { name: opts.mealName }));
    fireEvent.click(screen.getByTitle("Exit selection mode"));
}

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Hidden meals are excluded from totals (UI integration)", () => {
    it(
        "excludes a hidden meal's entries from day totals, then includes them again when shown",
        async () => {
            vi.spyOn(window, "confirm").mockReturnValue(true);
            renderPlannerHarness();

            const chicken = defaultFoods[defaultFoodId("Chicken")];
            const rice = defaultFoods[defaultFoodId("Rice")];

            const breakfastTotals = {
                kcal: chicken.defaultPortion * chicken.kcalPerUnit,
                protein: chicken.defaultPortion * chicken.proteinPerUnit,
            };
            const lunchTotals = {
                kcal: rice.defaultPortion * rice.kcalPerUnit,
                protein: rice.defaultPortion * rice.proteinPerUnit,
            };

            await bulkAddFoodToMeal({ foodName: "Chicken", mealName: "breakfast" });
            await bulkAddFoodToMeal({ foodName: "Rice", mealName: "lunch" });

            const both = {
                kcal: breakfastTotals.kcal + lunchTotals.kcal,
                protein: breakfastTotals.protein + lunchTotals.protein,
            };

            await waitFor(() => expectDayTotals(both));

            const lunchId = defaultMealId("lunch");

            act(() => {
                usePlannerStore.getState().hideMealPanel(lunchId);
            });

            // Lunch is hidden => day totals reflect breakfast only.
            await waitFor(() => expectDayTotals(breakfastTotals));
            await waitFor(() => expect(screen.queryByLabelText("Drag to reorder lunch")).toBeNull());

            act(() => {
                usePlannerStore.getState().showMealPanel(lunchId);
            });

            // Lunch is visible again => totals include lunch again.
            await waitFor(() => expectDayTotals(both));
            await waitFor(() => expect(screen.getByLabelText("Drag to reorder lunch")).toBeTruthy());
        },
        15000,
    );
});
