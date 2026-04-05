// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

import {
    defaultCategoryId,
    defaultProfileId,
    UNKNOWN_CATEGORY_ID,
} from "@/shared/defaults";
import type { FolderId, UserProfile } from "@/shared/models";
import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Folder removal semantics (UI integration)", () => {
    it("removing a folder moves categories out of it and keeps foods unchanged", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);

        const testFolderId = "folder:test" as unknown as FolderId;
        const proteinsId = defaultCategoryId("Proteins");

        const initialProfile: Partial<UserProfile> = {
            folders: {
                [testFolderId]: {
                    id: testFolderId,
                    profileId: defaultProfileId("local"),
                    name: "Test Folder",
                    order: 0,
                    enabled: true,
                },
            },
            categories: {
                // Place Proteins into the folder.
                [proteinsId]: {
                    id: proteinsId,
                    profileId: defaultProfileId("local"),
                    name: "Proteins",
                    order: 0,
                    enabled: true,
                    folderId: testFolderId,
                },
                // Ensure Unknown remains unfiled.
                [UNKNOWN_CATEGORY_ID]: {
                    id: UNKNOWN_CATEGORY_ID,
                    profileId: defaultProfileId("local"),
                    name: "Unknown",
                    order: Infinity,
                    enabled: true,
                    folderId: null,
                },
            },
        };

        renderPlannerHarness({ initialProfile });

        // Folder is visible and non-empty => toggle is enabled.
        const collapseBtn = await screen.findByLabelText("Collapse folder Test Folder");
        expect(collapseBtn.getAttribute("aria-disabled")).not.toBe("true");

        // A known food from Proteins exists.
        expect(screen.getByRole("button", { name: "Chicken" })).toBeTruthy();

        // Remove the folder via UI.
        fireEvent.click(screen.getByLabelText("Remove folder Test Folder"));

        // Folder disappears.
        await waitFor(() => expect(screen.queryByText("Test Folder")).toBeNull());
        await waitFor(() => expect(screen.queryByLabelText("Remove folder Test Folder")).toBeNull());

        // Category still exists, and foods remain.
        await waitFor(() => expect(screen.getByText(/^Proteins \(\d+\)$/)).toBeTruthy());
        expect(screen.getByRole("button", { name: "Chicken" })).toBeTruthy();
    });
});
