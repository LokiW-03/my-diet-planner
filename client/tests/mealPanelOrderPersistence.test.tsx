// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, screen, waitFor } from "@testing-library/react";

import { usePlannerStore } from "@/client/src/hooks/useStore";
import { defaultMealId, defaultTargetId } from "@/shared/defaults";
import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

function getVisibleMealOrder() {
    // Meal panel drag handles have aria-label `Drag to reorder ${title}`.
    // Filtering to known meal names avoids picking up category drag handles.
    const buttons = screen.getAllByLabelText(
        /Drag to reorder (breakfast|lunch|post-workout|dinner)/,
    );
    return buttons.map((b) => (b.getAttribute("aria-label") ?? "").replace("Drag to reorder ", ""));
}

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Meal panel order persistence (UI integration)", () => {
    it("persists meal panel order and restores it after rehydrate", async () => {
        const first = renderPlannerHarness();

        // Initial order should be defaults.
        await waitFor(() => {
            expect(getVisibleMealOrder().slice(0, 2)).toEqual(["breakfast", "lunch"]);
        });

        const breakfastId = defaultMealId("breakfast");
        const lunchId = defaultMealId("lunch");
        const postId = defaultMealId("post-workout");
        const dinnerId = defaultMealId("dinner");

        // Reorder to: lunch, breakfast, post-workout, dinner.
        act(() => {
            usePlannerStore.getState().setMealPanelOrder([lunchId, breakfastId, postId, dinnerId]);
        });

        await waitFor(() => {
            expect(getVisibleMealOrder().slice(0, 2)).toEqual(["lunch", "breakfast"]);
        });

        // Snapshot persisted state.
        const raw = window.localStorage.getItem("diet-planner-v2");
        expect(raw).toBeTruthy();

        // Simulated reload: unmount + reset in-memory persisted fields, then restore snapshot + rehydrate.
        first.unmount();
        cleanup();

        usePlannerStore.setState({
            meals: {},
            hiddenMeals: {},
            mealPanelOrder: [],
            dayType: defaultTargetId("FULL"),
        });

        window.localStorage.setItem("diet-planner-v2", raw as string);
        await usePlannerStore.persist.rehydrate();

        renderPlannerHarness();

        await waitFor(() => {
            expect(getVisibleMealOrder().slice(0, 2)).toEqual(["lunch", "breakfast"]);
        });
    });
});
