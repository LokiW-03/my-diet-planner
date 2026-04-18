import { describe, expect, it } from "vitest";

import type { TargetSchedule } from "@/shared/models";
import { defaultTargetId } from "@/shared/defaults";
import {
  asIsoDateString,
  resolveScheduledTargetForDate,
} from "@/client/src/utils/targetSchedule";

function schedule(v?: Partial<TargetSchedule>): TargetSchedule {
  return {
    rules: [],
    overridesByDate: {},
    ...v,
  };
}

describe("targetSchedule", () => {
  it("returns override when present (including null)", () => {
    const date = asIsoDateString("2026-04-18");

    const s = schedule({
      overridesByDate: {
        [date]: null,
      },
    });

    const res = resolveScheduledTargetForDate({ schedule: s, date });
    expect(res.fromOverride).toBe(true);
    expect(res.targetId).toBe(null);
  });

  it("matches a weekly RRULE for that weekday", () => {
    const date = asIsoDateString("2026-04-20"); // Monday

    const s = schedule({
      rules: [
        {
          id: "rule-1",
          targetId: defaultTargetId("FULL"),
          dtstart: asIsoDateString("2026-04-01"),
          rrule: "FREQ=WEEKLY;BYDAY=MO",
          enabled: true,
          priority: 0,
          createdAt: "2026-04-01T00:00:00.000Z",
        },
      ],
    });

    const res = resolveScheduledTargetForDate({ schedule: s, date });
    expect(res.fromOverride).toBe(false);
    expect(res.targetId).toBe(defaultTargetId("FULL"));
    expect(res.ruleId).toBe("rule-1");
  });

  it("uses priority when multiple rules match", () => {
    const date = asIsoDateString("2026-04-20"); // Monday

    const s = schedule({
      rules: [
        {
          id: "low",
          targetId: defaultTargetId("FULL"),
          dtstart: asIsoDateString("2026-04-01"),
          rrule: "FREQ=WEEKLY;BYDAY=MO",
          enabled: true,
          priority: 0,
          createdAt: "2026-04-01T00:00:00.000Z",
        },
        {
          id: "high",
          targetId: defaultTargetId("REST"),
          dtstart: asIsoDateString("2026-04-01"),
          rrule: "FREQ=WEEKLY;BYDAY=MO",
          enabled: true,
          priority: 10,
          createdAt: "2026-04-01T00:00:01.000Z",
        },
      ],
    });

    const res = resolveScheduledTargetForDate({ schedule: s, date });
    expect(res.targetId).toBe(defaultTargetId("REST"));
    expect(res.ruleId).toBe("high");
  });

  it("override beats rules", () => {
    const date = asIsoDateString("2026-04-20"); // Monday

    const s = schedule({
      overridesByDate: {
        [date]: defaultTargetId("HALF"),
      },
      rules: [
        {
          id: "rule-1",
          targetId: defaultTargetId("FULL"),
          dtstart: asIsoDateString("2026-04-01"),
          rrule: "FREQ=WEEKLY;BYDAY=MO",
          enabled: true,
          priority: 0,
          createdAt: "2026-04-01T00:00:00.000Z",
        },
      ],
    });

    const res = resolveScheduledTargetForDate({ schedule: s, date });
    expect(res.fromOverride).toBe(true);
    expect(res.targetId).toBe(defaultTargetId("HALF"));
  });
});
