// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ProfileProvider } from "@/client/src/profile/ProfileProvider";
import { PlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

const PROFILE_STORAGE_KEY = "diet_planner:userProfile:v1";
const PLANNER_STORAGE_KEY = "diet-planner-v2";

type RenderResult = ReturnType<typeof render>;

function renderWithLocalStorageProfile(): RenderResult {
    return render(
        <ProfileProvider>
            <PlannerHarness />
        </ProfileProvider>,
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

describe("Meal panel rename persistence (UI integration)", () => {
    it("persists meal panel name changes via profile localStorage", async () => {
        const first = renderWithLocalStorageProfile();

        // Rename breakfast -> Brunch.
        fireEvent.click(screen.getByRole("button", { name: "Rename breakfast" }));

        const renameInput = screen.getByLabelText("Edit meal panel name for breakfast") as HTMLInputElement;
        fireEvent.change(renameInput, { target: { value: "Brunch" } });
        fireEvent.keyDown(renameInput, { key: "Enter" });

        await screen.findByText("Brunch");

        // Ensure the profile wrote to storage.
        const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        expect(raw).toBeTruthy();
        expect(raw ?? "").toContain("Brunch");

        // Simulate a reload: unmount and remount ProfileProvider (no initialProfile).
        first.unmount();
        cleanup();

        renderWithLocalStorageProfile();

        await waitFor(() => expect(screen.getByText("Brunch")).toBeTruthy());
        await waitFor(() => expect(screen.getByRole("button", { name: "Rename Brunch" })).toBeTruthy());
    });
});
