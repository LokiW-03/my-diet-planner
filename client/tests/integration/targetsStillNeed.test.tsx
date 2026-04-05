// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";

import { defaultFoodId, defaultFoods, defaultTargetId } from "@/shared/defaults";
import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";
import { usePlannerStore } from "@/client/src/hooks/useStore";

function getTotalCard() {
    const el = screen.getByText("TOTAL").parentElement;
    expect(el).toBeTruthy();
    return el as HTMLElement;
}

function getStillNeedCard() {
    const el = screen.getByText("STILL NEED").parentElement;
    expect(el).toBeTruthy();
    return el as HTMLElement;
}

function expectTotalKcal(kcal: number) {
    const totalCard = getTotalCard();
    expect(within(totalCard).getByText(`${Math.round(kcal)} kcal`)).toBeTruthy();
}

function expectStillNeed(kcal: number) {
    const stillNeedCard = getStillNeedCard();
    expect(within(stillNeedCard).getByText(`${Math.round(kcal)} kcal`)).toBeTruthy();
}

async function bulkAddFoodToMeal(opts: { foodName: string; mealName: string }) {
    fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));
    fireEvent.click(await screen.findByLabelText(`Select ${opts.foodName}`));
    fireEvent.click(screen.getByTitle("Add selected foods to this meal panel"));
    fireEvent.click(await screen.findByRole("button", { name: opts.mealName }));
    fireEvent.click(screen.getByTitle("Exit selection mode"));
}

function selectTarget(name: "FULL" | "HALF" | "REST") {
    // Note: the integration test harness mounts PlannerWorkspace (MealBoard + BottomToolBar + FoodLibrary)
    // but not TopToolBar, so we drive target switching via the store.
    usePlannerStore.getState().setDayType(defaultTargetId(name));
}

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Target switching + STILL NEED (UI integration)", () => {
    it("updates STILL NEED exactly when changing targets; TOTAL kcal stays constant", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        const chicken = defaultFoods[defaultFoodId("Chicken")];
        const totalKcal = Math.round(chicken.defaultPortion * chicken.kcalPerUnit); // 110 * 2.39 = 262.9 -> 263
        expect(totalKcal).toBe(263);

        await bulkAddFoodToMeal({ foodName: "Chicken", mealName: "breakfast" });

        // TOTAL stays constant across target switches.
        await waitFor(() => expectTotalKcal(totalKcal));

        // FULL: min 1500 => 1500 - 263 = 1237
        selectTarget("FULL");
        await waitFor(() => expectStillNeed(1500 - totalKcal));
        await waitFor(() => expectTotalKcal(totalKcal));

        // HALF: min 1400 => 1400 - 263 = 1137
        selectTarget("HALF");
        await waitFor(() => expectStillNeed(1400 - totalKcal));
        await waitFor(() => expectTotalKcal(totalKcal));

        // REST: min 1350 => 1350 - 263 = 1087
        selectTarget("REST");
        await waitFor(() => expectStillNeed(1350 - totalKcal));
        await waitFor(() => expectTotalKcal(totalKcal));
    });
});
