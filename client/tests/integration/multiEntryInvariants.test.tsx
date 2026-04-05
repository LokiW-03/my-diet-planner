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

function countEntriesInStore(foodId: string) {
    const meals = usePlannerStore.getState().meals;
    return Object.values(meals).flatMap((entries) => entries).filter((e) => e.foodId === foodId).length;
}

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Multi-entry invariants (UI integration)", () => {
    it("deleting a food removes all of its entries across all meals and resets totals", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        const chickenId = defaultFoodId("Chicken");
        const chicken = defaultFoods[chickenId];

        const breakfastId = defaultMealId("breakfast");
        const lunchId = defaultMealId("lunch");
        const dinnerId = defaultMealId("dinner");

        // Create multiple entries for the same food across meals.
        act(() => {
            usePlannerStore.getState().addEntryToMeal(breakfastId, chickenId, chicken.defaultPortion);
            usePlannerStore.getState().addEntryToMeal(breakfastId, chickenId, chicken.defaultPortion);
            usePlannerStore.getState().addEntryToMeal(lunchId, chickenId, chicken.defaultPortion);
            usePlannerStore.getState().addEntryToMeal(lunchId, chickenId, chicken.defaultPortion);
            usePlannerStore.getState().addEntryToMeal(dinnerId, chickenId, chicken.defaultPortion);
        });

        const entryCount = 5;
        expect(countEntriesInStore(chickenId)).toBe(entryCount);

        const expected = {
            kcal: chicken.defaultPortion * chicken.kcalPerUnit * entryCount,
            protein: chicken.defaultPortion * chicken.proteinPerUnit * entryCount,
        };

        // UI reflects totals and multiple entries.
        await waitFor(() => expectDayTotals(expected));
        await waitFor(() => expect(screen.getAllByTitle("Click to edit food")).toHaveLength(entryCount));

        // Remove Chicken from the library (should remove all meal entries).
        fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));
        fireEvent.click(await screen.findByLabelText("Select Chicken"));
        fireEvent.click(screen.getByTitle("Remove food from food library and any meals"));

        // Food removed from library UI.
        await waitFor(() => expect(screen.queryByRole("button", { name: "Chicken" })).toBeNull());

        // All related entries removed.
        await waitFor(() => expect(screen.queryAllByTitle("Click to edit food")).toHaveLength(0));
        await waitFor(() => expectDayTotals({ kcal: 0, protein: 0 }));

        expect(countEntriesInStore(chickenId)).toBe(0);
    });
});
