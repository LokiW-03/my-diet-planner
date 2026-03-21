"use client";

import { useCallback } from "react";
import type { Target, TargetId } from "@/shared/models";
import { defaultTargetId } from "@/shared/defaults";

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
      const remaining = (Object.keys(targetsById) as TargetId[]).filter(
        (id) => id !== targetId,
      );

      if (targetId === dayType) {
        const preferred = defaultTargetId("FULL");
        const fallback = remaining.includes(preferred)
          ? preferred
          : remaining[0];
        if (fallback) setDayType(fallback);
      }

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
