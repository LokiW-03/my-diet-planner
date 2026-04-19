"use client";

import { useSyncExternalStore } from "react";
import type { IsoDateString } from "@/shared/models";
import {
  asIsoDateString,
  toIsoDateStringLocalCalendar,
} from "@/client/src/utils/targetSchedule";

export function useTodayIsoDate(): IsoDateString | null {
  return useSyncExternalStore<IsoDateString | null>(
    (onStoreChange) => {
      let timeoutId: ReturnType<typeof setTimeout> | null = null;

      const scheduleNext = () => {
        const now = new Date();
        const next = new Date(now);
        next.setHours(24, 0, 0, 0);
        const msUntilNextMidnight = Math.max(0, next.getTime() - now.getTime());

        timeoutId = setTimeout(() => {
          onStoreChange();
          scheduleNext();
        }, msUntilNextMidnight + 25);
      };

      scheduleNext();
      return () => {
        if (timeoutId) clearTimeout(timeoutId);
      };
    },
    () => asIsoDateString(toIsoDateStringLocalCalendar(new Date())),
    () => null,
  );
}
