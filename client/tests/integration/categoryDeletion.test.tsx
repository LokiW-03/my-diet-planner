// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, screen, waitFor } from "@testing-library/react";

import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";

function queryCategoryCount(name: string) {
    const el = screen.queryByText(new RegExp(`^${name} \\((\\d+)\\)$`));
    if (!el) return null;
    const text = el.textContent ?? "";
    const m = text.match(/\((\d+)\)$/);
    if (!m) return null;
    return Number(m[1]);
}

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Category deletion moves foods to Unknown (UI integration)", () => {
    it("removing a category disables it and moves its foods to Unknown", async () => {
        vi.spyOn(window, "confirm").mockReturnValue(true);
        renderPlannerHarness();

        // Baseline: Others exists and has 2 items by default.
        expect(screen.getByText("Others (2)")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Babybel" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Crisps" })).toBeTruthy();

        const unknownBefore = queryCategoryCount("Unknown") ?? 0;

        // Remove Others.
        fireEvent.click(screen.getByRole("button", { name: "Remove Others" }));

        // Category disappears (disabled).
        await waitFor(() => expect(screen.queryByText("Others (2)")).toBeNull());

        // Foods remain and should now be under Unknown.
        expect(screen.getByRole("button", { name: "Babybel" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Crisps" })).toBeTruthy();

        // Unknown count increases by 2.
        await waitFor(() => {
            const unknownAfter = queryCategoryCount("Unknown");
            expect(unknownAfter).not.toBeNull();
            expect(unknownAfter).toBe(unknownBefore + 2);
        });
    });
});
