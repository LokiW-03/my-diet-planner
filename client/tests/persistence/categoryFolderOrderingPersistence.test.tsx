// @vitest-environment jsdom

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ProfileProvider } from "@/client/src/profile/ProfileProvider";
import { useProfile } from "@/client/src/hooks/useProfile";
import { PlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { defaultCategoryId, defaultProfileId } from "@/shared/defaults";

const PROFILE_STORAGE_KEY = "diet_planner:userProfile:v1";

function getFolderOrder() {
    const buttons = screen.queryAllByLabelText(/Drag to reorder folder /);
    return buttons.map((b) => (b.getAttribute("aria-label") ?? "").replace("Drag to reorder folder ", ""));
}

function getCategoryOrder() {
    // Category drag handles are `Drag to reorder ${category.name}`.
    const buttons = screen.getAllByLabelText(/Drag to reorder (Proteins|Carbs|Veggies|Others)/);
    return buttons.map((b) => (b.getAttribute("aria-label") ?? "").replace("Drag to reorder ", ""));
}

function OrderingControls() {
    const { addFolder, updateCategory, reorderFolders, reorderCategories } = useProfile();

    return (
        <button
            type="button"
            onClick={() => {
                const folderA = addFolder({
                    profileId: defaultProfileId("local"),
                    name: "Folder A",
                    order: 0,
                    enabled: true,
                });
                const folderB = addFolder({
                    profileId: defaultProfileId("local"),
                    name: "Folder B",
                    order: 1,
                    enabled: true,
                });

                // Put categories in folders (one each) so ordering depends on folder order.
                updateCategory(defaultCategoryId("Carbs"), { folderId: folderA });
                updateCategory(defaultCategoryId("Proteins"), { folderId: folderB });

                // Swap folder order.
                reorderFolders([folderB, folderA]);

                // Order categories (folder cats first, then unfiled) should become:
                // Proteins (Folder B), Carbs (Folder A), Veggies, Others.
                reorderCategories([
                    defaultCategoryId("Proteins"),
                    defaultCategoryId("Carbs"),
                    defaultCategoryId("Veggies"),
                    defaultCategoryId("Others"),
                ]);
            }}
        >
            Apply ordering
        </button>
    );
}

beforeEach(() => {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Category + folder ordering persistence (UI integration)", () => {
    it("persists folder and category ordering via profile localStorage", async () => {
        const first = render(
            <ProfileProvider>
                <PlannerHarness />
                <OrderingControls />
            </ProfileProvider>,
        );

        fireEvent.click(screen.getByRole("button", { name: "Apply ordering" }));

        await waitFor(() => {
            expect(getFolderOrder().slice(0, 2)).toEqual(["Folder B", "Folder A"]);
        });

        await waitFor(() => {
            expect(getCategoryOrder().slice(0, 4)).toEqual(["Proteins", "Carbs", "Veggies", "Others"]);
        });

        const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        expect(raw).toBeTruthy();

        first.unmount();
        cleanup();

        // Remount without initialProfile so ProfileProvider reads from localStorage.
        render(
            <ProfileProvider>
                <PlannerHarness />
            </ProfileProvider>,
        );

        await waitFor(() => {
            expect(getFolderOrder().slice(0, 2)).toEqual(["Folder B", "Folder A"]);
        });

        await waitFor(() => {
            expect(getCategoryOrder().slice(0, 4)).toEqual(["Proteins", "Carbs", "Veggies", "Others"]);
        });
    });
});
