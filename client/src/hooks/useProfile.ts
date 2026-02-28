"use client";

import { useContext } from "react";
import { ProfileContext, ProfileContextValue } from "@/client/src/profile/ProfileProvider";

export function useProfile(): ProfileContextValue {
    const ctx = useContext(ProfileContext);
    if (!ctx) throw new Error("useProfile must be used within <ProfileProvider />");
    return ctx;
}