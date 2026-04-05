// @vitest-environment jsdom


import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";

import { ProfileProvider } from "@/client/src/profile/ProfileProvider";
import { useProfile } from "@/client/src/hooks/useProfile";
import { defaultCategoryId } from "@/shared/defaults";

const PROFILE_STORAGE_KEY = "diet_planner:userProfile:v1";

function ProfileProbe() {
    const { profile, updateUser, updateCategory } = useProfile();

    const proteinsId = defaultCategoryId("Proteins");
    const proteinsName = profile.categories[proteinsId]?.name ?? "<missing>";

    return (
        <div>
            <div data-testid="weight">{String(profile.weightKg)}</div>
            <div data-testid="proteinsName">{proteinsName}</div>

            <button
                type="button"
                onClick={() => {
                    updateUser({ weightKg: 70 });
                    updateCategory(proteinsId, { name: "Proteins Renamed" });
                }}
            >
                Update profile
            </button>
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

describe("Profile persistence (localStorage)", () => {
    it("writes changes to localStorage and restores them on remount", async () => {
        const first = render(
            <ProfileProvider>
                <ProfileProbe />
            </ProfileProvider>,
        );

        // Defaults.
        expect(screen.getByTestId("weight").textContent).toBe("68.45");
        expect(screen.getByTestId("proteinsName").textContent).toBe("Proteins");

        fireEvent.click(screen.getByRole("button", { name: "Update profile" }));

        await waitFor(() => expect(screen.getByTestId("weight").textContent).toBe("70"));
        await waitFor(() =>
            expect(screen.getByTestId("proteinsName").textContent).toBe("Proteins Renamed"),
        );

        const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
        expect(raw).toBeTruthy();
        expect(raw ?? "").toContain("\"weightKg\":70");
        expect(raw ?? "").toContain("Proteins Renamed");

        first.unmount();
        cleanup();

        // Remount without initialProfile: should load from localStorage.
        render(
            <ProfileProvider>
                <ProfileProbe />
            </ProfileProvider>,
        );

        await waitFor(() => expect(screen.getByTestId("weight").textContent).toBe("70"));
        await waitFor(() =>
            expect(screen.getByTestId("proteinsName").textContent).toBe("Proteins Renamed"),
        );
    });
});
