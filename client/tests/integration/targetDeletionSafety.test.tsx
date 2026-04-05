// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { ProfileProvider } from "@/client/src/profile/ProfileProvider";
import { useProfile } from "@/client/src/hooks/useProfile";
import { PlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";
import { defaultFoodId, defaultFoods, defaultTargetId } from "@/shared/defaults";
import { usePlannerStore } from "@/client/src/hooks/useStore";

const PROFILE_STORAGE_KEY = "diet_planner:userProfile:v1";

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

function expectStillNeedKcal(kcal: number) {
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

function TargetRemoveControl() {
    const { removeTarget } = useProfile();
    return (
        <button type="button" onClick={() => removeTarget(defaultTargetId("HALF"))}>
            Remove HALF target
        </button>
    );
}

beforeEach(() => {
    resetPlannerStoreForTest();
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Target deletion safety (UI integration)", () => {
    it("does not crash if the selected target is removed; STILL NEED falls back to 0", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        render(
            <ProfileProvider>
                <PlannerHarness />
                <TargetRemoveControl />
            </ProfileProvider>,
        );

        // Select HALF target via store (TopToolBar isn't mounted in this harness).
        act(() => {
            usePlannerStore.getState().setDayType(defaultTargetId("HALF"));
        });

        const chicken = defaultFoods[defaultFoodId("Chicken")];
        const totalKcal = Math.round(chicken.defaultPortion * chicken.kcalPerUnit); // 263
        expect(totalKcal).toBe(263);

        await bulkAddFoodToMeal({ foodName: "Chicken", mealName: "breakfast" });

        // Sanity: HALF exists initially => still need is 1400 - 263 = 1137.
        await waitFor(() => expectTotalKcal(totalKcal));
        await waitFor(() => expectStillNeedKcal(1400 - totalKcal));

        // Remove the HALF target from profile.
        fireEvent.click(screen.getByRole("button", { name: "Remove HALF target" }));

        // With no matching target, stillNeedKcal should be 0 (safety behavior).
        await waitFor(() => expectStillNeedKcal(0));

        // TOTAL should be unaffected.
        await waitFor(() => expectTotalKcal(totalKcal));
    });
});
