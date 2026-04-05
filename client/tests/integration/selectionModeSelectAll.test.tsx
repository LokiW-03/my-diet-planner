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

function getCategorySelectAllCheckbox(categoryHeaderText: string): HTMLInputElement {
    const header = screen.getByText(categoryHeaderText);
    const wrap = header.parentElement;
    expect(wrap).toBeTruthy();
    const el = wrap?.querySelector(
        'input[type="checkbox"][title="Select all foods in this category"]',
    ) as HTMLInputElement | null;
    expect(el).toBeTruthy();
    return el as HTMLInputElement;
}

describe("Selection mode select-all correctness (UI integration)", () => {
    it("select-all selects category foods, indeterminate reflects partial selection, bulk-move affects only selected", async () => {
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        // Enter selection mode.
        fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));
        await screen.findByLabelText("Select Chicken");

        // Proteins defaults: Beef A, Chicken, Shakes, Arla Yogurt.
        const selectAllProteins = getCategorySelectAllCheckbox("Proteins (4)");

        // Select all in Proteins.
        fireEvent.click(selectAllProteins);

        await waitFor(() => {
            expect((screen.getByLabelText("Select Beef A") as HTMLInputElement).checked).toBe(true);
            expect((screen.getByLabelText("Select Chicken") as HTMLInputElement).checked).toBe(true);
            expect((screen.getByLabelText("Select Shakes") as HTMLInputElement).checked).toBe(true);
            expect((screen.getByLabelText("Select Arla Yogurt") as HTMLInputElement).checked).toBe(true);
        });

        // Unselect one item => select-all becomes indeterminate.
        fireEvent.click(screen.getByLabelText("Select Beef A"));

        await waitFor(() => {
            expect((screen.getByLabelText("Select Beef A") as HTMLInputElement).checked).toBe(false);
            expect(selectAllProteins.checked).toBe(false);
            expect(selectAllProteins.indeterminate).toBe(true);
        });

        // Bulk move the remaining selected foods to Veggies.
        fireEvent.click(screen.getByTitle("Move selected foods to this category"));
        fireEvent.click(await screen.findByRole("button", { name: "Veggies" }));

        expect(confirmSpy).toHaveBeenCalled();

        // Only 3 foods moved out of Proteins: Proteins 4 -> 1, Veggies 3 -> 6.
        await waitFor(() => expect(screen.getByText("Proteins (1)")).toBeTruthy());
        await waitFor(() => expect(screen.getByText("Veggies (6)")).toBeTruthy());

        // Ensure Proteins is expanded, then assert the unselected Beef A remains.
        const expandProteinsBtn = screen.queryByLabelText("Expand Proteins");
        if (expandProteinsBtn) {
            fireEvent.click(expandProteinsBtn);
        }

        await waitFor(() => expect(screen.getByLabelText("Select Beef A")).toBeTruthy());
        expect((screen.getByLabelText("Select Beef A") as HTMLInputElement).checked).toBe(false);

        confirmSpy.mockRestore();
    });
});
