// @vitest-environment jsdom

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ProfileProvider } from "@/client/src/profile/ProfileProvider";
import { useProfile } from "@/client/src/hooks/useProfile";
import { PlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { defaultMealId } from "@/shared/defaults";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

const PROFILE_STORAGE_KEY = "diet_planner:userProfile:v1";

function ProfileResetControls() {
    const {
        profile,
        addTarget,
        disableMeal,
        updateMeal,
        resetTargetsToDefault,
        resetMealPanelsToDefault,
    } = useProfile();

    const targetNames = Object.values(profile.targets)
        .map((t) => t.name)
        .slice()
        .sort((a, b) => a.localeCompare(b))
        .join(",");

    return (
        <div>
            <div data-testid="targets">{targetNames}</div>
            <button
                type="button"
                onClick={() => {
                    disableMeal(defaultMealId("lunch"));
                    updateMeal(defaultMealId("breakfast"), { name: "Brunch" });
                    addTarget({ name: "CUT", minKcal: 1000, maxKcal: 1100 });
                }}
            >
                Mutate profile
            </button>
            <button
                type="button"
                onClick={() => {
                    resetTargetsToDefault();
                    resetMealPanelsToDefault();
                }}
            >
                Reset to defaults
            </button>
        </div>
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

describe("Reset-to-default flows (UI integration)", () => {
    it("resets targets and meal panels back to app defaults", async () => {
        render(
            <ProfileProvider>
                <PlannerHarness />
                <ProfileResetControls />
            </ProfileProvider>,
        );

        // Default targets.
        await waitFor(() => expect(screen.getByTestId("targets").textContent).toBe("FULL,HALF,REST"));

        // Lunch exists, breakfast has default name.
        expect(screen.getByLabelText("Drag to reorder breakfast")).toBeTruthy();
        expect(screen.getByLabelText("Drag to reorder lunch")).toBeTruthy();

        // Mutate: disable lunch, rename breakfast, add a custom target.
        fireEvent.click(screen.getByRole("button", { name: "Mutate profile" }));

        await waitFor(() => {
            const txt = screen.getByTestId("targets").textContent ?? "";
            expect(txt).toContain("CUT");
        });

        await waitFor(() => expect(screen.queryByLabelText("Drag to reorder lunch")).toBeNull());
        await waitFor(() => expect(screen.getByLabelText("Drag to reorder Brunch")).toBeTruthy());

        // Reset.
        fireEvent.click(screen.getByRole("button", { name: "Reset to defaults" }));

        await waitFor(() => expect(screen.getByTestId("targets").textContent).toBe("FULL,HALF,REST"));

        // Lunch restored; breakfast restored.
        await waitFor(() => expect(screen.getByLabelText("Drag to reorder lunch")).toBeTruthy());
        await waitFor(() => expect(screen.getByLabelText("Drag to reorder breakfast")).toBeTruthy());
    });
});
