// @vitest-environment jsdom

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { screen, fireEvent, waitFor, cleanup, within } from "@testing-library/react";
import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Meal entries add/edit/remove (UI integration)", () => {
    it("adds Chicken to breakfast, edits portion, updates meal + day totals, then removes", async () => {
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        // Baseline: no entries and day totals at zero.
        expect(screen.queryByTitle("Click to edit food")).toBeNull();

        const totalCard = screen.getByText("TOTAL").parentElement;
        expect(totalCard).toBeTruthy();
        expect(within(totalCard as HTMLElement).getByText("0 kcal")).toBeTruthy();
        expect(within(totalCard as HTMLElement).getByText("0g Protein")).toBeTruthy();

        // Add Chicken to breakfast via bulk select (click-driven path).
        fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));
        fireEvent.click(await screen.findByLabelText("Select Chicken"));
        fireEvent.click(screen.getByTitle("Add selected foods to this meal panel"));
        fireEvent.click(await screen.findByRole("button", { name: "breakfast" }));

        expect(confirmSpy).toHaveBeenCalledOnce();

        // Entry appears and meal footer totals update.
        const entryBtn = await screen.findByTitle("Click to edit food");
        expect(entryBtn.textContent ?? "").toContain("Chicken");

        await waitFor(() => {
            expect(screen.getByText("Total: ~263 kcal, ~30 g Protein")).toBeTruthy();
        });

        await waitFor(() => {
            expect(within(totalCard as HTMLElement).getByText("263 kcal")).toBeTruthy();
            expect(within(totalCard as HTMLElement).getByText("30g Protein")).toBeTruthy();
        });

        // Edit portion from 110g -> 220g.
        const entryBox = entryBtn.closest("div");
        expect(entryBox).toBeTruthy();

        const portionInput = (entryBox as HTMLElement).querySelector('input[type="number"]') as HTMLInputElement | null;
        expect(portionInput).toBeTruthy();

        fireEvent.change(portionInput as HTMLInputElement, { target: { value: "220" } });

        await waitFor(() => {
            expect(screen.getByText("Total: ~526 kcal, ~59 g Protein")).toBeTruthy();
        });

        await waitFor(() => {
            expect(within(totalCard as HTMLElement).getByText("526 kcal")).toBeTruthy();
            expect(within(totalCard as HTMLElement).getByText("59g Protein")).toBeTruthy();
        });

        // Remove entry.
        const removeBtn = (entryBox as HTMLElement).querySelector('button[title="Remove"]') as HTMLButtonElement | null;
        expect(removeBtn).toBeTruthy();
        fireEvent.click(removeBtn as HTMLButtonElement);

        await waitFor(() => {
            expect(screen.queryByTitle("Click to edit food")).toBeNull();
        });

        await waitFor(() => {
            expect(within(totalCard as HTMLElement).getByText("0 kcal")).toBeTruthy();
            expect(within(totalCard as HTMLElement).getByText("0g Protein")).toBeTruthy();
        });

        confirmSpy.mockRestore();
    });
});
