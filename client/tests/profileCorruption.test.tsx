// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { ProfileProvider } from "@/client/src/profile/ProfileProvider";
import { useProfile } from "@/client/src/hooks/useProfile";

const PROFILE_STORAGE_KEY = "diet_planner:userProfile:v1";

function ProfileProbe() {
    const { profile } = useProfile();

    return (
        <div>
            <div data-testid="weight">{String(profile.weightKg)}</div>
            <div data-testid="username">{profile.userName}</div>
        </div>
    );
}

beforeEach(() => {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
});

afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
});

describe("ProfileProvider corruption resilience", () => {
    it("falls back to defaults when localStorage contains invalid JSON", () => {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, "{");

        render(
            <ProfileProvider>
                <ProfileProbe />
            </ProfileProvider>,
        );

        // Defaults (mirrors existing profilePersistence.test.tsx expectations).
        expect(screen.getByTestId("weight").textContent).toBe("68.45");
        expect(screen.getByTestId("username").textContent).toBe("Lok");
    });
});
