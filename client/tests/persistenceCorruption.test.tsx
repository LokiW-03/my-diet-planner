// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, screen, waitFor, within } from "@testing-library/react";

import { renderPlannerHarness } from "@/client/tests/testUtils/renderPlannerHarness";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";
import { usePlannerStore } from "@/client/src/hooks/useStore";

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

beforeEach(() => {
    resetPlannerStoreForTest();
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("Persistence (corruption resilience)", () => {
    it("does not crash when persisted storage contains invalid JSON", async () => {
        // Simulate a user having a corrupted localStorage entry.
        window.localStorage.setItem("diet-planner-v2", "{");

        // Rehydrate should not throw/reject; it should fall back to initial state.
        await usePlannerStore.persist.rehydrate();

        renderPlannerHarness();

        await waitFor(() => expectDayTotals({ kcal: 0, protein: 0 }));
    });

    it("does not crash when persisted storage has an unexpected shape", async () => {
        window.localStorage.setItem("diet-planner-v2", JSON.stringify({ foo: "bar" }));

        await usePlannerStore.persist.rehydrate();

        renderPlannerHarness();

        await waitFor(() => expectDayTotals({ kcal: 0, protein: 0 }));
    });
});
