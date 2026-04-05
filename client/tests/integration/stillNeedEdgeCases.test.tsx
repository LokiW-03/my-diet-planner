// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, screen, waitFor, within } from "@testing-library/react";

import { usePlannerStore } from "@/client/src/hooks/useStore";
import {
    defaultFoodId,
    defaultFoods,
    defaultMealId,
    defaultTargetId,
} from "@/shared/defaults";
import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

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

function setTarget(name: "FULL") {
    usePlannerStore.getState().setDayType(defaultTargetId(name));
}

function clearMeals() {
    act(() => {
        usePlannerStore.setState({ meals: {} });
    });
}

function addDefaultEntry(opts: { meal: "breakfast"; foodName: string; times?: number }) {
    const mealId = defaultMealId(opts.meal);
    const foodId = defaultFoodId(opts.foodName);
    const food = defaultFoods[foodId];
    const times = opts.times ?? 1;

    act(() => {
        for (let i = 0; i < times; i++) {
            usePlannerStore.getState().addEntryToMeal(mealId, foodId, food.defaultPortion);
        }
    });

    return food.defaultPortion * food.kcalPerUnit * times;
}

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("STILL NEED edge cases (UI integration)", () => {
    it("follows the piecewise rule for FULL target: below min => positive, within => 0, above max => negative", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        setTarget("FULL");

        // Case 1: below min (1500)
        clearMeals();
        const chickenKcal = addDefaultEntry({ meal: "breakfast", foodName: "Chicken" }); // 262.9 -> 263
        const belowMinKcal = Math.round(chickenKcal);
        expect(belowMinKcal).toBe(263);

        await waitFor(() => expectTotalKcal(belowMinKcal));
        await waitFor(() => expectStillNeed(1500 - belowMinKcal));

        // Case 2: within range [1500, 1600] => 0
        // Make 1500 exactly: 4*Shakes + 2*Crisps + 2*Babybel = 1060 + 300 + 140 = 1500
        clearMeals();
        const withinKcal =
            addDefaultEntry({ meal: "breakfast", foodName: "Shakes", times: 4 }) +
            addDefaultEntry({ meal: "breakfast", foodName: "Crisps", times: 2 }) +
            addDefaultEntry({ meal: "breakfast", foodName: "Babybel", times: 2 });
        expect(Math.round(withinKcal)).toBe(1500);

        await waitFor(() => expectTotalKcal(1500));
        await waitFor(() => expectStillNeed(0));

        // Case 3: above max (1600) => negative (max - kcal)
        // Add 1 more Crisps: +150 => 1650, stillNeed = 1600 - 1650 = -50
        addDefaultEntry({ meal: "breakfast", foodName: "Crisps", times: 1 });

        await waitFor(() => expectTotalKcal(1650));
        await waitFor(() => expectStillNeed(1600 - 1650));
    });
});
