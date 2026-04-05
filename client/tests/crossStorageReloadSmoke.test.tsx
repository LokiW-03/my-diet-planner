// @vitest-environment jsdom

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { ProfileProvider } from "@/client/src/profile/ProfileProvider";
import { PlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";
import { usePlannerStore } from "@/client/src/hooks/useStore";
import { defaultCategoryId, defaultFoodId, defaultFoods, defaultMealId, defaultTargetId } from "@/shared/defaults";
import { useProfile } from "@/client/src/hooks/useProfile";

const PROFILE_STORAGE_KEY = "diet_planner:userProfile:v1";
const PLANNER_STORAGE_KEY = "diet-planner-v2";

function getTotalCard() {
    const el = screen.getByText("TOTAL").parentElement;
    expect(el).toBeTruthy();
    return el as HTMLElement;
}

function expectTotalKcal(kcal: number) {
    const totalCard = getTotalCard();
    expect(within(totalCard).getByText(`${Math.round(kcal)} kcal`)).toBeTruthy();
}

async function bulkAddFoodToMeal(opts: { foodName: string; mealName: string }) {
    fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));
    fireEvent.click(await screen.findByLabelText(`Select ${opts.foodName}`));
    fireEvent.click(screen.getByTitle("Add selected foods to this meal panel"));
    fireEvent.click(await screen.findByRole("button", { name: opts.mealName }));
    fireEvent.click(screen.getByTitle("Exit selection mode"));
}

function getVisibleMealOrder() {
    const buttons = screen
        .getAllByLabelText(/Drag to reorder /)
        .filter((b) => /Drag to reorder (breakfast|lunch|post-workout|dinner)/.test(b.getAttribute("aria-label") ?? ""));

    return buttons.map((b) => (b.getAttribute("aria-label") ?? "").replace("Drag to reorder ", ""));
}

function ProfileMutator() {
    const { updateCategory } = useProfile();
    return (
        <button
            type="button"
            aria-label="Mutator: Rename Proteins"
            onClick={() => updateCategory(defaultCategoryId("Proteins"), { name: "ProteinsX" })}
        >
            Mutator: Rename Proteins
        </button>
    );
}

beforeEach(() => {
    resetPlannerStoreForTest();
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    window.localStorage.removeItem(PLANNER_STORAGE_KEY);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Cross-storage reload smoke (profile + planner)", () => {
    it("restores both profile (userProfile) and planner (meals/order) after a simulated reload", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        const first = render(
            <ProfileProvider>
                <PlannerHarness />
                <ProfileMutator />
            </ProfileProvider>,
        );

        // Mutate profile.
        fireEvent.click(screen.getByRole("button", { name: "Mutator: Rename Proteins" }));
        await waitFor(() => expect(screen.getByText("ProteinsX (4)")).toBeTruthy());

        // Mutate planner state.
        const chicken = defaultFoods[defaultFoodId("Chicken")];
        const totalKcal = Math.round(chicken.defaultPortion * chicken.kcalPerUnit);
        await bulkAddFoodToMeal({ foodName: "Chicken", mealName: "breakfast" });
        await waitFor(() => expectTotalKcal(totalKcal));

        // Persist a non-default meal order.
        const breakfastId = defaultMealId("breakfast");
        const lunchId = defaultMealId("lunch");
        const postId = defaultMealId("post-workout");
        const dinnerId = defaultMealId("dinner");

        act(() => {
            usePlannerStore.getState().setMealPanelOrder([lunchId, breakfastId, postId, dinnerId]);
        });

        await waitFor(() => expect(getVisibleMealOrder().slice(0, 2)).toEqual(["lunch", "breakfast"]));

        // Snapshot both storages.
        const profileRaw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        const plannerRaw = window.localStorage.getItem(PLANNER_STORAGE_KEY);
        expect(profileRaw).toBeTruthy();
        expect(plannerRaw).toBeTruthy();

        // Simulated reload: unmount UI, reset in-memory persisted fields, restore snapshots, rehydrate.
        first.unmount();
        cleanup();

        usePlannerStore.setState({
            meals: {},
            hiddenMeals: {},
            mealPanelOrder: [],
            dayType: defaultTargetId("FULL"),
        });

        window.localStorage.setItem(PROFILE_STORAGE_KEY, profileRaw as string);
        window.localStorage.setItem(PLANNER_STORAGE_KEY, plannerRaw as string);
        await usePlannerStore.persist.rehydrate();

        render(
            <ProfileProvider>
                <PlannerHarness />
            </ProfileProvider>,
        );

        // Profile restored.
        await waitFor(() => expect(screen.getByText("ProteinsX (4)")).toBeTruthy());

        // Planner restored.
        await waitFor(() => expect(getVisibleMealOrder().slice(0, 2)).toEqual(["lunch", "breakfast"]));
        await waitFor(() => expectTotalKcal(totalKcal));

        // Entry restored.
        const entryBtn = await screen.findByTitle("Click to edit food");
        expect(entryBtn.textContent ?? "").toContain("Chicken");
    });
});
