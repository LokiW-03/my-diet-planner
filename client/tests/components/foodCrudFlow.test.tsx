// @vitest-environment jsdom

import { describe, it, expect, beforeEach } from "vitest";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

beforeEach(() => {
    resetPlannerStoreForTest();
});

describe("Food add/edit/delete (UI integration)", () => {
    it("adds, edits, and deletes a food and updates the library UI", async () => {
        renderPlannerHarness();

        // Baseline: an existing default food should be visible.
        expect(screen.getByRole("button", { name: "Chicken" })).toBeTruthy();

        // Add new food in Proteins.
        fireEvent.click(screen.getByTitle("Add new food to Proteins"));

        const dialog = await screen.findByRole("dialog");
        expect(screen.getByText("Add Food")).toBeTruthy();

        const nameInput = screen.getByLabelText("Name");
        fireEvent.change(nameInput, { target: { value: "Test Food" } });

        const saveButton = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
        await waitFor(() => expect(saveButton.disabled).toBe(false));
        fireEvent.click(saveButton);

        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
        await screen.findByRole("button", { name: "Test Food" });

        // Edit the food.
        fireEvent.click(screen.getByRole("button", { name: "Test Food" }));
        await screen.findByText("Edit Food");

        fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test Food Updated" } });
        await waitFor(() =>
            expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(false),
        );
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        await screen.findByRole("button", { name: "Test Food Updated" });
        expect(screen.queryByRole("button", { name: "Test Food" })).toBeNull();

        // Delete the food.
        fireEvent.click(screen.getByRole("button", { name: "Test Food Updated" }));
        await screen.findByText("Edit Food");
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));

        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
        await waitFor(() => expect(screen.queryByRole("button", { name: "Test Food Updated" })).toBeNull());

        // Baseline item should still exist.
        expect(screen.getByRole("button", { name: "Chicken" })).toBeTruthy();

        void dialog;
    });
});
