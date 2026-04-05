// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

function getSearchInput(): HTMLInputElement {
    return screen.getByPlaceholderText("Search for food") as HTMLInputElement;
}

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Search + selection interaction (UI integration)", () => {
    it("disables search in selection mode; search expands categories and filters foods when not selecting", async () => {
        renderPlannerHarness();

        // Collapse Proteins so we can verify search expands categories.
        fireEvent.click(screen.getByLabelText("Collapse Proteins"));
        await waitFor(() => expect(screen.queryByRole("button", { name: "Chicken" })).toBeNull());

        const input = getSearchInput();
        expect(input.disabled).toBe(false);

        // Enter selection mode => search should be disabled.
        fireEvent.click(screen.getByTitle("Enter bulk select foods mode"));
        await screen.findByTitle("Exit selection mode");
        await waitFor(() => expect(getSearchInput().disabled).toBe(true));

        // Exit selection mode => search should be enabled again.
        fireEvent.click(screen.getByTitle("Exit selection mode"));
        await waitFor(() => expect(getSearchInput().disabled).toBe(false));

        // Searching should expand categories and filter items.
        fireEvent.change(getSearchInput(), { target: { value: "chick" } });

        await waitFor(() => expect(screen.getByRole("button", { name: "Chicken" })).toBeTruthy());
        expect(screen.queryByRole("button", { name: "Beef A" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Shakes" })).toBeNull();
    });
});
