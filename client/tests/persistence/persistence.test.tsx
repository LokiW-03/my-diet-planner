// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";

import { usePlannerStore } from "@/client/src/hooks/useStore";
import { defaultFoodId, defaultFoods, defaultTargetId } from "@/shared/defaults";
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

describe("Persistence (smoke)", () => {
    it("restores meals from persisted storage after a simulated reload", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        const first = renderPlannerHarness();

        const chicken = defaultFoods[defaultFoodId("Chicken")];
        const expected = {
            kcal: chicken.defaultPortion * chicken.kcalPerUnit,
            protein: chicken.defaultPortion * chicken.proteinPerUnit,
        };

        await bulkAddFoodToMeal({ foodName: "Chicken", mealName: "breakfast" });

        // Confirm we wrote non-empty state.
        await screen.findByTitle("Click to edit food");
        await waitFor(() => expectDayTotals(expected));

        // Ensure persist wrote something to storage.
        const raw = window.localStorage.getItem("diet-planner-v2");
        expect(raw).toBeTruthy();
        expect(raw ?? "").toContain("meals");

        // Simulate a "reload": unmount UI, clear in-memory state, then rehydrate from storage.
        first.unmount();
        cleanup();

        // Important: do NOT replace the entire Zustand state object (that would drop actions and required fields).
        // Instead, reset the persisted fields back to defaults before rehydrating.
        usePlannerStore.setState({
            meals: {},
            hiddenMeals: {},
            mealPanelOrder: [],
            dayType: defaultTargetId("FULL"),
        });

        // The reset above will also persist the empty state; restore the previous snapshot
        // so `rehydrate()` reads the state from before the simulated reload.
        window.localStorage.setItem("diet-planner-v2", raw as string);
        await usePlannerStore.persist.rehydrate();

        renderPlannerHarness();

        // UI reflects restored state.
        const entryBtn = await screen.findByTitle("Click to edit food");
        expect(entryBtn.textContent ?? "").toContain("Chicken");
        await waitFor(() => expectDayTotals(expected));
    });
});
