// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor, within } from "@testing-library/react";

import { defaultFoodId, defaultFoods } from "@/shared/defaults";
import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

function getTotalCard() {
    const el = screen.getByText("TOTAL").parentElement;
    expect(el).toBeTruthy();
    return el as HTMLElement;
}

function expectDayTotals(opts: { kcal: number; protein: number }) {
    const totalCard = getTotalCard();
    expect(within(totalCard).getByText(`${Math.round(opts.kcal)} kcal`)).toBeTruthy();
    expect(within(totalCard).getByText(`${Math.round(opts.protein)}g Protein`)).toBeTruthy();
}

function footerText(opts: { kcal: number; protein: number }) {
    return `Total: ~${Math.round(opts.kcal)} kcal, ~${Math.round(opts.protein)} g Protein`;
}

async function bulkAddFoodToMeal(opts: { foodName: string; mealName: string }) {
    // Enter selection mode.
    fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));

    // Select a food.
    fireEvent.click(await screen.findByLabelText(`Select ${opts.foodName}`));

    // Add to meal.
    fireEvent.click(screen.getByTitle("Add selected foods to this meal panel"));
    fireEvent.click(await screen.findByRole("button", { name: opts.mealName }));

    // Exit selection mode (keeps subsequent operations deterministic).
    fireEvent.click(screen.getByTitle("Exit selection mode"));
}

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Totals reactivity (UI integration)", () => {
    it("editing a food's macros updates existing meal + day totals", async () => {
        const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        const chicken = defaultFoods[defaultFoodId("Chicken")];
        const base = {
            kcal: chicken.defaultPortion * chicken.kcalPerUnit,
            protein: chicken.defaultPortion * chicken.proteinPerUnit,
        };

        await bulkAddFoodToMeal({ foodName: "Chicken", mealName: "breakfast" });

        await screen.findByTitle("Click to edit food");
        await waitFor(() => expect(screen.getByText(footerText(base))).toBeTruthy());
        await waitFor(() => expectDayTotals(base));

        // Edit the food from the meal board.
        fireEvent.click(screen.getByTitle("Click to edit food"));
        await screen.findByText("Edit Food");

        // Change macros.
        fireEvent.change(screen.getByLabelText(/Kcal per g/i), { target: { value: "3" } });
        fireEvent.change(screen.getByLabelText(/Protein per g/i), { target: { value: "0.3" } });

        const saveBtn = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
        await waitFor(() => expect(saveBtn.disabled).toBe(false));
        fireEvent.click(saveBtn);

        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

        const updated = {
            kcal: chicken.defaultPortion * 3,
            protein: chicken.defaultPortion * 0.3,
        };

        await waitFor(() => expect(screen.getByText(footerText(updated))).toBeTruthy());
        await waitFor(() => expectDayTotals(updated));

        confirmSpy.mockRestore();
    });

    it("Clear All removes entries and resets day totals to zero", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        const chicken = defaultFoods[defaultFoodId("Chicken")];
        const rice = defaultFoods[defaultFoodId("Rice")];

        await bulkAddFoodToMeal({ foodName: "Chicken", mealName: "breakfast" });
        await bulkAddFoodToMeal({ foodName: "Rice", mealName: "lunch" });

        await screen.findAllByTitle("Click to edit food");

        const before = {
            kcal: chicken.defaultPortion * chicken.kcalPerUnit + rice.defaultPortion * rice.kcalPerUnit,
            protein: chicken.defaultPortion * chicken.proteinPerUnit + rice.defaultPortion * rice.proteinPerUnit,
        };

        await waitFor(() => expectDayTotals(before));

        fireEvent.click(screen.getByTitle("Clear all meals"));

        await waitFor(() => {
            expect(screen.queryByTitle("Click to edit food")).toBeNull();
        });

        await waitFor(() => expectDayTotals({ kcal: 0, protein: 0 }));
    });

    it("renaming and collapsing a meal panel does not change totals", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        const chicken = defaultFoods[defaultFoodId("Chicken")];
        const base = {
            kcal: chicken.defaultPortion * chicken.kcalPerUnit,
            protein: chicken.defaultPortion * chicken.proteinPerUnit,
        };

        await bulkAddFoodToMeal({ foodName: "Chicken", mealName: "breakfast" });

        await waitFor(() => expect(screen.getByText(footerText(base))).toBeTruthy());
        await waitFor(() => expectDayTotals(base));

        // Rename breakfast -> brunch.
        fireEvent.click(screen.getByRole("button", { name: "Rename breakfast" }));
        const renameInput = screen.getByLabelText("Edit meal panel name for breakfast") as HTMLInputElement;
        fireEvent.change(renameInput, { target: { value: "brunch" } });
        fireEvent.keyDown(renameInput, { key: "Enter" });

        await screen.findByText("brunch");

        // Collapse the first meal panel (default order: breakfast/brunch first).
        fireEvent.click(screen.getAllByTitle("Collapse")[0]);

        // Totals remain visible in collapsed info.
        await waitFor(() => {
            expect(screen.getByText(new RegExp(`1 item.*${footerText(base)}`))).toBeTruthy();
        });
        await waitFor(() => expectDayTotals(base));

        // Expand again.
        fireEvent.click(screen.getAllByTitle("Expand")[0]);

        await waitFor(() => expect(screen.getByText(footerText(base))).toBeTruthy());
        await waitFor(() => expectDayTotals(base));
    });
});
