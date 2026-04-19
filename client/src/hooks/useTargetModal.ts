"use client";

import { useCallback } from "react";
import type { Target, TargetId } from "@/shared/models";
import { defaultTargetId } from "@/shared/defaults";

export function useTargetModal({
  targetsById,
  dayType,
  setDayType,
  addTarget,
  updateTarget,
  removeTarget,
  resetTargetsToDefault,
  saveProfileAsDefault,
}: UseTargetModalProps) {
  const removeTargetAndFixDayType = useCallback(
    (targetId: TargetId) => {
      const preferred = defaultTargetId("FULL");
      const fallback = chooseFallbackTargetId(
        targetsById,
        dayType,
        targetId,
        preferred,
      );

      if (fallback) setDayType(fallback);
      removeTarget(targetId);
    },
    [dayType, removeTarget, setDayType, targetsById],
  );

  const resetTargets = useCallback(() => {
    resetTargetsToDefault();
    setDayType(defaultTargetId("FULL"));
  }, [resetTargetsToDefault, setDayType]);

  return {
    actions: {
      addTarget,
      updateTarget,
      removeTargetAndFixDayType,
      resetTargetsToDefault: resetTargets,
      saveTargetsAsDefault: saveProfileAsDefault,
    },
  };
}

function chooseFallbackTargetId(
  targetsById: Record<TargetId, Target>,
  currentDayType: TargetId,
  targetToRemove: TargetId,
  preferredFallbackId: TargetId,
): TargetId | null {
  if (targetToRemove !== currentDayType) return null;

  const remaining = (Object.keys(targetsById) as TargetId[]).filter(
    (id) => id !== targetToRemove,
  );

  const fallback = remaining.includes(preferredFallbackId)
    ? preferredFallbackId
    : remaining[0];

  return fallback ?? null;
}

type UseTargetModalProps = {
  targetsById: Record<TargetId, Target>;
  dayType: TargetId;
  setDayType: (next: TargetId) => void;

  addTarget: (target: Omit<Target, "id">) => TargetId;
  updateTarget: (
    targetId: TargetId,
    patch: Partial<Omit<Target, "id">>,
  ) => void;
  removeTarget: (targetId: TargetId) => void;

  resetTargetsToDefault: () => void;

  saveProfileAsDefault: () => Promise<void>;
};
