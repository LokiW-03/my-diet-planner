"use client";

import React, { createContext, useCallback, useEffect, useMemo, useState } from "react";
import type { CategoryId, FoodCategory, FoodId, FoodItem, MealDefinition, MealId, Target, TargetId, UserProfile } from "@/shared/models";
import { defaultUserProfile, getInitialProfile } from "@/shared/defaults";
import { uid } from "@/shared/utils";

const STORAGE_KEY = "diet_planner:userProfile:v1";

export type ProfileContextValue = {
    profile: UserProfile;

    // DB actions
    saveProfileAsDefault: () => Promise<void>;
    resetProfileToDBDefault: () => Promise<void>;

    // CRUD for user
    updateUser: (patch: Partial<Pick<UserProfile, "userName" | "weightKg">>) => void;

    // CRUD for targets (local cache)
    addTarget(target: Omit<Target, "id">): TargetId;
    updateTarget(targetId: TargetId, patch: Partial<Omit<Target, "id">>): void;
    removeTarget(targetId: TargetId): void;

    // Reset targets to app defaults (defaults.ts)
    resetTargetsToDefault: () => void;

    // CRUD for meal panels (local cache)
    addMeal: (meal: Omit<MealDefinition, "id">) => MealId;
    updateMeal: (mealId: MealId, patch: Partial<Omit<MealDefinition, "id">>) => void;
    disableMeal: (mealId: MealId) => void;

    // Reset meal panel definitions to DB defaults (placeholder: defaults.ts)
    resetMealPanelsToDefault: () => void;

    // DB action for meal panel defaults
    saveMealPanelsAsDefault: (orderedEnabledMealIds: MealId[]) => Promise<void>;

    // CRUD for foods (local cache)
    addFood: (food: Omit<FoodItem, "id">) => void;
    updateFood: (foodId: FoodId, patch: Partial<Omit<FoodItem, "id">>) => void;
    removeFood: (foodId: FoodId) => void;

    // CRUD action for food library defaults
    updateCategory: (categoryId: CategoryId, patch: Partial<Omit<FoodCategory, "id" | "profileId">>) => void;
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

    // placeholder for now
    const saveProfileAsDefault = useCallback(async () => {
        return Promise.resolve();
    }, []);

    const resetProfileToDBDefault = useCallback(async () => {
        return Promise.resolve();
    }, []);

    const updateUser = useCallback((patch: Partial<Pick<UserProfile, "userName" | "weightKg">>) => {
        setProfile((p) => ({ ...p, ...patch }));
    }, []);

    const addFood = useCallback((food: Omit<FoodItem, "id">) => {
        const id = uid("food") as FoodId;
        setProfile((p) => ({ ...p, foods: { ...p.foods, [id]: { ...food, id } } }));
    }, []);

    const updateFood = useCallback((foodId: FoodId, patch: Partial<Omit<FoodItem, "id">>) => {
        setProfile((p) => ({ ...p, foods: { ...p.foods, [foodId]: { ...p.foods[foodId], ...patch } } }));
    }, []);

    const removeFood = useCallback((foodId: FoodId) => {
        setProfile((p) => {
            const { [foodId]: removed, ...rest } = p.foods;
            void removed;
            return { ...p, foods: rest as UserProfile["foods"] };
        });
    }, []);

    const updateCategory = useCallback((categoryId: CategoryId, patch: Partial<Omit<FoodCategory, "id" | "profileId">>) => {
        setProfile((p) => ({
            ...p,
            categories: {
                ...p.categories,
                [categoryId]: { ...p.categories[categoryId], ...patch },
            },
        }));
    }, []);

    const addTarget = useCallback((target: Omit<Target, "id">): TargetId => {
        const id = uid("target") as TargetId;
        setProfile((p) => ({ ...p, targets: { ...p.targets, [id]: { ...target, id } } }));
        return id;
    }, []);

    const updateTarget = useCallback((targetId: TargetId, patch: Partial<Omit<Target, "id">>) => {
        setProfile((p) => ({ ...p, targets: { ...p.targets, [targetId]: { ...p.targets[targetId], ...patch } } }));
    }, []);

    const removeTarget = useCallback((targetId: TargetId) => {
        setProfile((p) => {
            const { [targetId]: removed, ...rest } = p.targets;
            void removed;
            return { ...p, targets: rest as UserProfile["targets"] };
        });
    }, []);

    const resetTargetsToDefault = useCallback(() => {
        setProfile((p) => ({
            ...p,
            targets: { ...defaultUserProfile.targets },
        }));
    }, []);

    const addMeal = useCallback((meal: Omit<MealDefinition, "id">): MealId => {
        const id = uid("meal") as unknown as MealId;
        setProfile((p) => ({ ...p, meals: { ...p.meals, [id]: { ...meal, id } } }));
        return id;
    }, []);

    const updateMeal = useCallback((mealId: MealId, patch: Partial<Omit<MealDefinition, "id">>) => {
        setProfile((p) => ({
            ...p,
            meals: {
                ...p.meals,
                [mealId]: { ...p.meals[mealId], ...patch },
            },
        }));
    }, []);

    const disableMeal = useCallback((mealId: MealId) => {
        setProfile((p) => ({
            ...p,
            meals: {
                ...p.meals,
                [mealId]: { ...p.meals[mealId], enabled: false },
            },
        }));
    }, []);

    // stab for now
    const resetMealPanelsToDefault = useCallback(() => {
        setProfile((p) => ({
            ...p,
            meals: { ...defaultUserProfile.meals },
        }));
    }, []);

    const saveMealPanelsAsDefault = useCallback(async (orderedEnabledMealIds: MealId[]) => {
        void orderedEnabledMealIds;
        return Promise.resolve();
    }, []);

    const value = useMemo<ProfileContextValue>(
        () => ({
            profile,
            saveProfileAsDefault,
            resetProfileToDBDefault,
            updateUser,
            addTarget,
            updateTarget,
            removeTarget,
            resetTargetsToDefault,
            addMeal,
            updateMeal,
            disableMeal,
            resetMealPanelsToDefault,
            saveMealPanelsAsDefault,
            addFood,
            updateFood,
            removeFood,
            updateCategory,
        }),
        [
            profile,
            saveProfileAsDefault,
            resetProfileToDBDefault,
            updateUser,
            addTarget,
            updateTarget,
            removeTarget,
            resetTargetsToDefault,
            addMeal,
            updateMeal,
            disableMeal,
            resetMealPanelsToDefault,
            saveMealPanelsAsDefault,
            addFood,
            updateFood,
            removeFood,
            updateCategory,
        ]
    );

    return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}