// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, screen, waitFor } from "@testing-library/react";

import { usePlannerStore } from "@/client/src/hooks/useStore";
import { defaultMealId, defaultTargetId } from "@/shared/defaults";
import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

const PLANNER_STORAGE_KEY = "diet-planner-v2";

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Hidden meal persistence (UI integration)", () => {
    it("persists hiddenMeals across a simulated reload", async () => {
        const first = renderPlannerHarness();

        const lunchId = defaultMealId("lunch");

        // Hide lunch and verify it disappears.
        act(() => {
            usePlannerStore.getState().hideMealPanel(lunchId);
        });

        await waitFor(() => expect(screen.queryByLabelText("Drag to reorder lunch")).toBeNull());

        // Snapshot storage.
        const raw = window.localStorage.getItem(PLANNER_STORAGE_KEY);
        expect(raw).toBeTruthy();
        expect(raw ?? "").toContain("hiddenMeals");

        // Simulate a reload.
        first.unmount();
        cleanup();

        usePlannerStore.setState({
            meals: {},
            hiddenMeals: {},
            mealPanelOrder: [],
            dayType: defaultTargetId("FULL"),
        });

        // Restore prior snapshot and rehydrate.
        window.localStorage.setItem(PLANNER_STORAGE_KEY, raw as string);
        await usePlannerStore.persist.rehydrate();

        renderPlannerHarness();

        // Lunch stays hidden.
        await waitFor(() => expect(screen.queryByLabelText("Drag to reorder lunch")).toBeNull());
    });
});
