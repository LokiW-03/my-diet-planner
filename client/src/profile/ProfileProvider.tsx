"use client";

import React, { createContext, useEffect, useMemo, useState } from "react";
import type { UserProfile } from "@/shared/models";
import { defaultUserProfile, getInitialProfile } from "@/shared/defaults";

const STORAGE_KEY = "diet_planner:userProfile:v1";

export type ProfileContextValue = {
    profile: UserProfile;
    setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    resetProfile: () => void;
};

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({
    children,
    initialProfile,
}: {
    children: React.ReactNode;
    /** later: pass server/db profile here */
    initialProfile?: Partial<UserProfile>;
}) {
    const [profile, setProfile] = useState<UserProfile>(() => {
        if (initialProfile) return getInitialProfile(initialProfile);

        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            return raw ? getInitialProfile(JSON.parse(raw)) : defaultUserProfile;
        } catch {
            return defaultUserProfile;
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
        } catch {
            // ignore storage failures
        }
    }, [profile]);

    const value = useMemo<ProfileContextValue>(
        () => ({
            profile,
            setProfile,
            resetProfile: () => setProfile(defaultUserProfile),
        }),
        [profile]
    );

    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}