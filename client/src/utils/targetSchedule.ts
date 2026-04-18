import { RRule, rrulestr } from "rrule";
import type {
  IsoDateString,
  TargetId,
  TargetSchedule,
  TargetScheduleRule,
} from "@/shared/models";

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function asIsoDateString(s: string): IsoDateString {
  if (!ISO_DATE_RE.test(s)) {
    throw new Error(`Invalid ISO date string (expected YYYY-MM-DD): ${s}`);
  }
  return s as IsoDateString;
}

export function toIsoDateStringUtc(d: Date): IsoDateString {
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(d.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}` as IsoDateString;
}

/** Returns the user's local calendar date as YYYY-MM-DD (date-only key). */
export function toIsoDateStringLocalCalendar(d: Date): IsoDateString {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}` as IsoDateString;
}

export function parseIsoDateUtc(date: IsoDateString): Date {
  // Treat schedule as date-only (calendar), and run computations in UTC to avoid DST shifts.
  const [y, m, d] = date.split("-").map((x) => Number(x));
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

export function startOfDayUtc(date: IsoDateString): Date {
  const d = parseIsoDateUtc(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export function endOfDayUtc(date: IsoDateString): Date {
  const d = parseIsoDateUtc(date);
  d.setUTCHours(23, 59, 59, 999);
  return d;
}

export type ResolveScheduledTargetOpts = {
  schedule: TargetSchedule;
  date: IsoDateString;
};

export type ResolveScheduledTargetResult = {
  /** If an override exists for the date, this is true (even if targetId is null). */
  fromOverride: boolean;
  /** The scheduled target for this date. null means "explicitly no scheduled target". */
  targetId: TargetId | null;
  /** The matching rule that produced the result (if any). */
  ruleId?: string;
};

export function resolveScheduledTargetForDate(
  opts: ResolveScheduledTargetOpts,
): ResolveScheduledTargetResult {
  const { schedule, date } = opts;

  if (Object.prototype.hasOwnProperty.call(schedule.overridesByDate, date)) {
    return {
      fromOverride: true,
      targetId: schedule.overridesByDate[date] ?? null,
    };
  }

  const matching = findMatchingRulesForDate({ rules: schedule.rules, date });
  const best = pickBestRule(matching);
  if (!best) {
    return { fromOverride: false, targetId: null };
  }

  return {
    fromOverride: false,
    targetId: best.targetId,
    ruleId: best.id,
  };
}

export function findMatchingRulesForDate(opts: {
  rules: TargetScheduleRule[];
  date: IsoDateString;
}): TargetScheduleRule[] {
  const { rules, date } = opts;

  const from = startOfDayUtc(date);
  const to = endOfDayUtc(date);

  const out: TargetScheduleRule[] = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;

    const dtstart = parseIsoDateUtc(rule.dtstart);
    let rr: RRule;
    try {
      rr = rrulestr(rule.rrule, { dtstart }) as unknown as RRule;
    } catch {
      // Invalid rule string; treat as non-matching.
      continue;
    }

    const occurrences = rr.between(from, to, true);
    if (occurrences.length > 0) out.push(rule);
  }

  return out;
}

export function pickBestRule(
  rules: TargetScheduleRule[],
): TargetScheduleRule | null {
  if (rules.length === 0) return null;

  return rules.slice().sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    // createdAt is ISO datetime; lexical sort works.
    if (a.createdAt !== b.createdAt)
      return b.createdAt.localeCompare(a.createdAt);
    return b.id.localeCompare(a.id);
  })[0];
}
