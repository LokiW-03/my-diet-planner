"use client";

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { FoodId, FoodItem, UserProfile } from "@/shared/models";
import { defaultUserProfile, getInitialProfile } from "@/shared/defaults";
import { uid } from "@/shared/utils";

const STORAGE_KEY = "diet_planner:userProfile:v1";

export type ProfileContextValue = {
    profile: UserProfile;
    setProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
    resetProfile: () => void;
    addFood: (food: Omit<FoodItem, "id">) => void;
    updateFood: (foodId: FoodId, patch: Partial<Omit<FoodItem, "id">>) => void;
    removeFood: (foodId: FoodId) => void;
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

    const addFood = useCallback((food: Omit<FoodItem, "id">) => {
        const id = uid("food") as FoodId;
        setProfile((p) => ({ ...p, foods: { ...p.foods, [id]: { ...food, id } } }));
    }, []);

    const updateFood = useCallback((foodId: FoodId, patch: Partial<Omit<FoodItem, "id">>) => {
        setProfile((p) => ({ ...p, foods: { ...p.foods, [foodId]: { ...p.foods[foodId], ...patch } } }));
    }, []);

    const removeFood = useCallback((foodId: FoodId) => {
        setProfile((p) => {
            const { [foodId]: _removed, ...rest } = p.foods;
            return { ...p, foods: rest as UserProfile["foods"] };
        });
    }, []);

    const value = useMemo<ProfileContextValue>(
        () => ({
            profile,
            setProfile,
            resetProfile: () => setProfile(defaultUserProfile),
            addFood,
            updateFood,
            removeFood,
        }),
        [profile, addFood, updateFood, removeFood]
    );

    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}