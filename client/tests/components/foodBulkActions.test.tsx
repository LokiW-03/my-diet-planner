// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen, fireEvent, waitFor, cleanup } from "@testing-library/react";
import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Food library bulk actions (UI integration)", () => {
    it("bulk select remove deletes a food from the library UI", async () => {
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        // Baseline.
        expect(screen.getByRole("button", { name: "Chicken" })).toBeTruthy();

        // Enter selection mode.
        fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));

        // Select a food.
        const chickenCheckbox = await screen.findByLabelText("Select Chicken");
        fireEvent.click(chickenCheckbox);

        // Remove selected.
        fireEvent.click(screen.getByTitle("Remove food from food library and any meals"));

        await waitFor(() => expect(screen.queryByRole("button", { name: "Chicken" })).toBeNull());

        confirmSpy.mockRestore();
    });

    it("bulk select move to category updates category grouping", async () => {
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        // Baseline counts (from defaults).
        expect(screen.getByText("Proteins (4)")).toBeTruthy();
        expect(screen.getByText("Veggies (3)")).toBeTruthy();

        // Enter selection mode + select Chicken.
        fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));
        fireEvent.click(await screen.findByLabelText("Select Chicken"));

        // Move to Veggies.
        fireEvent.click(screen.getByTitle("Move selected foods to this category"));
        fireEvent.click(await screen.findByRole("button", { name: "Veggies" }));

        expect(confirmSpy).toHaveBeenCalledOnce();

        // Category counts update after move.
        await waitFor(() => expect(screen.getByText("Proteins (3)")).toBeTruthy());
        await waitFor(() => expect(screen.getByText("Veggies (4)")).toBeTruthy());

        // Food still exists in the library.
        expect(screen.getByLabelText("Select Chicken")).toBeTruthy();

        confirmSpy.mockRestore();
    });

    it("bulk select add to meal adds an entry to the meal board", async () => {
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        // Ensure there are no meal entries yet.
        expect(screen.queryByTitle("Click to edit food")).toBeNull();

        // Enter selection mode + select Chicken.
        fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));
        fireEvent.click(await screen.findByLabelText("Select Chicken"));

        // Add to breakfast.
        fireEvent.click(screen.getByTitle("Add selected foods to this meal panel"));
        fireEvent.click(await screen.findByRole("button", { name: "breakfast" }));

        expect(confirmSpy).toHaveBeenCalledOnce();

        // Meal entry appears.
        const entryBtn = await screen.findByTitle("Click to edit food");
        expect(entryBtn.textContent ?? "").toContain("Chicken");

        confirmSpy.mockRestore();
    });
});
