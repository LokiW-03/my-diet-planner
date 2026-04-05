// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

function getVisibleMealOrder() {
    const buttons = screen.getAllByLabelText(/Drag to reorder /).filter((b) => {
        const label = b.getAttribute("aria-label") ?? "";
        return label.includes("breakfast") || label.includes("lunch") || label.includes("post-workout") || label.includes("dinner") || label.includes("New Meal");
    });

    return buttons.map((b) => (b.getAttribute("aria-label") ?? "").replace("Drag to reorder ", ""));
}

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Meal panel insert semantics (UI integration)", () => {
    it("inserts a new meal panel at the clicked insertion position", async () => {
        renderPlannerHarness();

        await waitFor(() => {
            expect(getVisibleMealOrder().slice(0, 2)).toEqual(["breakfast", "lunch"]);
        });

        const insertButtons = screen.getAllByLabelText("Insert meal panel here");
        expect(insertButtons.length).toBeGreaterThan(0);

        // Click the first insertion point (between breakfast and lunch).
        fireEvent.click(insertButtons[0] as HTMLElement);

        await waitFor(() => {
            // Expect breakfast, then the inserted default name, then lunch.
            expect(getVisibleMealOrder().slice(0, 3)).toEqual(["breakfast", "New Meal", "lunch"]);
        });
    });
});
