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

function footerText(opts: { kcal: number; protein: number }) {
    return `Total: ~${Math.round(opts.kcal)} kcal, ~${Math.round(opts.protein)} g Protein`;
}

function getMealFooterEls() {
    // DOM order matches DEFAULT_MEALS order: breakfast, lunch, post-workout, dinner.
    return screen.getAllByText(/^Total: ~\d+ kcal, ~\d+ g Protein$/);
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

describe("Entry move + food removal (UI integration)", () => {
    it("moves an existing entry from breakfast to lunch and keeps day totals constant", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        const chicken = defaultFoods[defaultFoodId("Chicken")];
        const totals = {
            kcal: chicken.defaultPortion * chicken.kcalPerUnit,
            protein: chicken.defaultPortion * chicken.proteinPerUnit,
        };

        await bulkAddFoodToMeal({ foodName: "Chicken", mealName: "breakfast" });

        await screen.findByTitle("Click to edit food");
        await waitFor(() => expectDayTotals(totals));

        // Breakfast footer should be non-zero, lunch footer should be zero.
        await waitFor(() => {
            const footers = getMealFooterEls();
            expect(footers[0]?.textContent ?? "").toBe(footerText(totals));
            expect(footers[1]?.textContent ?? "").toBe(footerText({ kcal: 0, protein: 0 }));
        });

        const breakfastId = defaultMealId("breakfast");
        const lunchId = defaultMealId("lunch");
        const breakfastEntries = usePlannerStore.getState().meals[breakfastId] ?? [];
        expect(breakfastEntries).toHaveLength(1);
        const entryId = breakfastEntries[0].entryId;

        // The UI doesn't expose a non-dnd move; this calls the same store action drag/drop would use.
        act(() => {
            usePlannerStore.getState().moveEntry(breakfastId, lunchId, entryId);
        });

        // Breakfast becomes 0; lunch gets the totals.
        await waitFor(() => {
            const footers = getMealFooterEls();
            expect(footers[0]?.textContent ?? "").toBe(footerText({ kcal: 0, protein: 0 }));
            expect(footers[1]?.textContent ?? "").toBe(footerText(totals));
        });

        // Day totals unchanged.
        await waitFor(() => expectDayTotals(totals));
    });

    it("removing a food that has meal entries also removes its meal entries and updates totals", async () => {
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        const chicken = defaultFoods[defaultFoodId("Chicken")];
        const totals = {
            kcal: chicken.defaultPortion * chicken.kcalPerUnit,
            protein: chicken.defaultPortion * chicken.proteinPerUnit,
        };

        await bulkAddFoodToMeal({ foodName: "Chicken", mealName: "breakfast" });

        await screen.findByTitle("Click to edit food");
        await waitFor(() => expectDayTotals(totals));

        // Remove Chicken from the library (this flow is supposed to also clear meal entries).
        fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));
        fireEvent.click(await screen.findByLabelText("Select Chicken"));
        fireEvent.click(screen.getByTitle("Remove food from food library and any meals"));

        // Food removed from library UI.
        await waitFor(() => expect(screen.queryByRole("button", { name: "Chicken" })).toBeNull());

        // Entry removed from meal board UI and totals reset.
        await waitFor(() => expect(screen.queryByTitle("Click to edit food")).toBeNull());
        await waitFor(() => expectDayTotals({ kcal: 0, protein: 0 }));

        // Meal footer returns to zero.
        await waitFor(() => {
            const footers = getMealFooterEls();
            expect(footers[0]?.textContent ?? "").toBe(footerText({ kcal: 0, protein: 0 }));
        });

        expect(confirmSpy).toHaveBeenCalled();
        confirmSpy.mockRestore();
    });
});
