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

export function toIsoDateStringLocalCalendar(d: Date): IsoDateString {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}` as IsoDateString;
}

export function parseIsoDateUtc(date: IsoDateString): Date {
  const [y, m, d] = date.split("-").map((x) => Number(x));
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
}

export function weekdayCodeFromIsoDate(date: IsoDateString): WeekdayCode {
  const day = parseIsoDateUtc(date).getUTCDay();
  if (day === 0) return "SU";
  if (day === 1) return "MO";
  if (day === 2) return "TU";
  if (day === 3) return "WE";
  if (day === 4) return "TH";
  if (day === 5) return "FR";
  return "SA";
}

export function parseByDayCodesFromRrule(rrule: string): WeekdayCode[] | null {
  const byday = /(?:^|;)BYDAY=([^;]+)/.exec(rrule)?.[1] ?? null;
  if (!byday) return null;

  const allowed: WeekdayCode[] = ["MO", "TU", "WE", "TH", "FR", "SA", "SU"];
  const codes = byday
    .split(",")
    .map((c) => c.trim())
    .filter(Boolean)
    .filter((c): c is WeekdayCode => (allowed as string[]).includes(c));

  return codes.length > 0 ? codes : null;
}

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

  const weekday = weekdayCodeFromIsoDate(date);

  const out: TargetScheduleRule[] = [];
  for (const rule of rules) {
    if (!rule.enabled) continue;

    // dtstart is date-only; lexical comparison is safe for YYYY-MM-DD.
    if (date < rule.dtstart) continue;

    const byday = parseByDayCodesFromRrule(rule.rrule);
    const matches = byday
      ? byday.includes(weekday)
      : weekdayCodeFromIsoDate(rule.dtstart) === weekday;

    if (matches) out.push(rule);
  }

  return out;
}

export function pickBestRule(
  rules: TargetScheduleRule[],
): TargetScheduleRule | null {
  if (rules.length === 0) return null;

  return rules.slice().sort((a, b) => {
    if (a.priority !== b.priority) return b.priority - a.priority;
    if (a.createdAt !== b.createdAt)
      return b.createdAt.localeCompare(a.createdAt);
    return b.id.localeCompare(a.id);
  })[0];
}

export type WeekdayCode = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

export type ResolveScheduledTargetOpts = {
  schedule: TargetSchedule;
  date: IsoDateString;
};

export type ResolveScheduledTargetResult = {
  fromOverride: boolean; // If an override exists for the date, this is true (even if targetId is null)
  targetId: TargetId | null;
  ruleId?: string;
};
