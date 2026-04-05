// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

async function enterSelectionMode() {
    fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));
    // Selection checkboxes should appear.
    await screen.findByLabelText("Select Chicken");
}

describe("Food library grouping + visibility rules (UI integration)", () => {
    it("hides Unknown when empty; shows it when foods are moved to Unknown; hides it again when emptied", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        // Unknown is hidden initially (defaults have no unknown foods).
        expect(screen.queryByText(/^Unknown \(\d+\)$/)).toBeNull();

        // Deleting a category moves its foods to Unknown, which makes Unknown visible.
        fireEvent.click(screen.getByTitle("Remove Others"));

        await waitFor(() => expect(screen.queryByText(/^Others \(\d+\)$/)).toBeNull());
        await waitFor(() => expect(screen.getByText("Unknown (2)")).toBeTruthy());

        // Those foods are now under Unknown.
        expect(screen.getByRole("button", { name: "Babybel" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Crisps" })).toBeTruthy();

        // Move both Unknown foods into Proteins.
        await enterSelectionMode();
        fireEvent.click(await screen.findByLabelText("Select Babybel"));
        fireEvent.click(await screen.findByLabelText("Select Crisps"));

        fireEvent.click(screen.getByTitle("Move selected foods to this category"));
        fireEvent.click(await screen.findByRole("button", { name: "Proteins" }));

        // Unknown becomes empty again and should disappear.
        await waitFor(() => expect(screen.queryByText(/^Unknown \(\d+\)$/)).toBeNull());

        // Proteins count increases by 2 (defaults: 4 -> 6).
        await waitFor(() => expect(screen.getByText("Proteins (6)")).toBeTruthy());
    });

    it("new empty folders are forced-collapsed and cannot be expanded", async () => {
        renderPlannerHarness();

        // Add a folder. FoodLibrary starts rename mode automatically.
        fireEvent.click(screen.getByTitle("Add new folder"));

        const renameInput = await screen.findByLabelText("Edit folder name for New Folder");
        fireEvent.keyDown(renameInput, { key: "Enter" });

        // Empty folders have disabled toggle (cannot expand).
        const toggleBtn = await screen.findByLabelText("Expand folder New Folder");
        expect(toggleBtn).toBeTruthy();
        expect(toggleBtn.getAttribute("aria-disabled")).toBe("true");
    });
});
