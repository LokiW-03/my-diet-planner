// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import React from "react";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

import type { UserProfile } from "@/shared/models";
import { defaultTargetId, defaultUserProfile } from "@/shared/defaults";
import { ProfileProvider } from "@/client/src/profile/ProfileProvider";
import { usePlannerScreen } from "@/client/src/hooks/usePlannerScreen";
import { TopToolBar } from "@/client/src/components/TopToolBar/TopToolBar";
import { resetPlannerStoreForTest } from "@/client/tests/testUtils/resetPlannerStoreForTest";
import { asIsoDateString } from "@/client/src/utils/targetSchedule";

function ToolbarHarness() {
    const { model, actions } = usePlannerScreen();

    return (
        <TopToolBar
            showProfile={false}
            onToggleProfile={() => { }}
            onEditTargets={() => { }}
            onOpenSchedule={() => { }}
            targets={model.targets}
            dayType={model.dayType}
            onDayTypeChange={actions.setDayType}
            onSaveDefaults={() => { }}
            onReset={() => { }}
        />
    );
}

function renderWithProfile(initialProfile: Partial<UserProfile>) {
    return render(
        <ProfileProvider initialProfile={{ ...defaultUserProfile, ...initialProfile }}>
            <ToolbarHarness />
        </ProfileProvider>,
    );
}

describe("Scheduling: effective target + toolbar override", () => {
    beforeEach(() => {
        resetPlannerStoreForTest();
        vi.useFakeTimers();
        // Local calendar date: 2026-04-18
        vi.setSystemTime(new Date(2026, 3, 18, 12, 0, 0));
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it("shows scheduled target and allows same-day override via toolbar", async () => {
        renderWithProfile({
            schedule: {
                rules: [
                    {
                        id: "rule-1",
                        targetId: defaultTargetId("REST"),
                        dtstart: asIsoDateString("2026-04-18"),
                        rrule: "FREQ=DAILY",
                        enabled: true,
                        priority: 0,
                        createdAt: "2026-04-18T00:00:00.000Z",
                    },
                ],
                overridesByDate: {},
            },
        });

        // Scheduled target should win initially.
        expect(screen.getByText("REST")).toBeTruthy();

        // Changing target from toolbar acts as an override when schedules exist.
        fireEvent.click(screen.getByRole("button", { name: /rest/i }));
        fireEvent.click(screen.getByRole("button", { name: "FULL" }));

        expect(screen.getByText("FULL")).toBeTruthy();
    });
});
