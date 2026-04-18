"use client";

import { useCallback, useMemo, useState } from "react";
import { FaTrash } from "react-icons/fa";
import type {
    IsoDateString,
    Target,
    TargetId,
    TargetSchedule,
    TargetScheduleRule,
} from "@/shared/models";
import { ModalShell } from "@/client/src/components/ModalShell/ModalShell";
import {
    asIsoDateString,
    parseIsoDateUtc,
    toIsoDateStringLocalCalendar,
} from "@/client/src/utils/targetSchedule";
import styles from "./ScheduleModal.module.scss";

export function ScheduleModal({
    open,
    onClose,
    targets,
    initialTargetId,
    schedule,
    addScheduleRule,
    setScheduleOverride,
    updateScheduleRule,
    removeScheduleRule,
    clearScheduleOverride,
}: ScheduleModalProps) {
    const today = useMemo(
        () => asIsoDateString(toIsoDateStringLocalCalendar(new Date())),
        [],
    );

    const [targetId, setTargetId] = useState<TargetId>(() => initialTargetId);
    const [date, setDate] = useState<IsoDateString>(() => today);
    const [repeat, setRepeat] = useState<RepeatMode>(() => "weekly");
    const [weeklyDays, setWeeklyDays] = useState<WeekdayCode[]>(() => [weekdayFromIsoDate(today)]);

    const monthDay = useMemo(() => parseIsoDateUtc(date).getUTCDate(), [date]);

    const onOk = useCallback(() => {
        if (repeat === "none") {
            setScheduleOverride(date, targetId);
            onClose();
            return;
        }

        const rrule = buildRrule({ repeat, weeklyDays, monthDay });
        addScheduleRule({
            targetId,
            dtstart: date,
            rrule,
            enabled: true,
            priority: 0,
        });
        onClose();
    }, [addScheduleRule, date, monthDay, onClose, repeat, setScheduleOverride, targetId, weeklyDays]);

    const canSave = useMemo(() => {
        if (targets.length === 0) return false;
        if (repeat !== "weekly") return true;
        return weeklyDays.length > 0;
    }, [repeat, targets.length, weeklyDays.length]);

    const hasOverrideForSelectedDate = useMemo(
        () => Object.prototype.hasOwnProperty.call(schedule.overridesByDate, date),
        [date, schedule.overridesByDate],
    );

    const overrideTargetName = useMemo(() => {
        if (!hasOverrideForSelectedDate) return null;
        const id = schedule.overridesByDate[date] ?? null;
        if (!id) return "(none)";
        return targets.find((t) => t.id === id)?.name ?? String(id);
    }, [date, hasOverrideForSelectedDate, schedule.overridesByDate, targets]);

    const sortedRules = useMemo(() => {
        return (schedule.rules ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }, [schedule.rules]);

    return (
        <ModalShell
            open={open}
            title="Schedule"
            onClose={onClose}
            size="md"
            footer={
                <>
                    <button
                        className={styles.btn}
                        type="button"
                        onClick={() => {
                            setDate(today);
                            setRepeat("weekly");
                            setWeeklyDays([weekdayFromIsoDate(today)]);
                        }}
                    >
                        Reset
                    </button>
                    <button
                        className={styles.btnPrimary}
                        type="button"
                        onClick={onOk}
                        disabled={!canSave}
                    >
                        OK
                    </button>
                </>
            }
        >
            <div className={styles.form}>
                <label className={styles.label}>
                    Target
                    <select
                        className={styles.select}
                        value={String(targetId)}
                        onChange={(e) => setTargetId(e.target.value as TargetId)}
                    >
                        {targets.map((t) => (
                            <option key={String(t.id)} value={String(t.id)}>
                                {t.name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className={styles.label}>
                    Date
                    <input
                        className={styles.input}
                        type="date"
                        value={date}
                        onChange={(e) => {
                            const raw = e.target.value;
                            if (!raw) return;
                            const next = asIsoDateString(raw);
                            setDate(next);
                            if (repeat === "weekly") {
                                setWeeklyDays([weekdayFromIsoDate(next)]);
                            }
                        }}
                    />
                </label>

                {hasOverrideForSelectedDate ? (
                    <div className={styles.overrideRow}>
                        <div className={styles.overrideText}>
                            Override for this date: {overrideTargetName}
                        </div>
                        <button
                            type="button"
                            className={styles.btnDanger}
                            onClick={() => clearScheduleOverride(date)}
                            title="Remove override for this date"
                        >
                            Clear override
                        </button>
                    </div>
                ) : null}

                <label className={styles.label}>
                    Repeat
                    <select
                        className={styles.select}
                        value={repeat}
                        onChange={(e) => setRepeat(e.target.value as RepeatMode)}
                    >
                        <option value="none">None (just this day)</option>
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                        <option value="monthly">Monthly</option>
                    </select>
                </label>

                {repeat === "weekly" ? (
                    <div className={styles.weeklyRow}>
                        <div className={styles.weeklyLabel}>Days</div>
                        <div className={styles.weekdayGrid} role="group" aria-label="Weekdays">
                            {WEEKDAYS.map((d) => {
                                const active = weeklyDays.includes(d.code);
                                return (
                                    <button
                                        key={d.code}
                                        type="button"
                                        className={active ? `${styles.dayBtn} ${styles.dayBtnActive}` : styles.dayBtn}
                                        onClick={() => {
                                            setWeeklyDays((cur) => {
                                                if (cur.includes(d.code)) return cur.filter((x) => x !== d.code);
                                                return [...cur, d.code];
                                            });
                                        }}
                                        aria-pressed={active}
                                        aria-label={d.ariaLabel}
                                        title={d.ariaLabel}
                                    >
                                        {d.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : null}

                {repeat === "monthly" ? (
                    <div className={styles.hint}>
                        Repeats on day {monthDay} of each month.
                    </div>
                ) : null}

                <div className={styles.rulesTitle}>Saved rules</div>
                {sortedRules.length === 0 ? (
                    <div className={styles.hint}>No schedule rules yet.</div>
                ) : (
                    <div className={styles.rulesList}>
                        {sortedRules.map((r) => {
                            const name = targets.find((t) => t.id === r.targetId)?.name ?? String(r.targetId);
                            return (
                                <div key={r.id} className={styles.ruleRow}>
                                    <label className={styles.ruleLeft}>
                                        <input
                                            type="checkbox"
                                            checked={r.enabled}
                                            onChange={(e) => updateScheduleRule(r.id, { enabled: e.target.checked })}
                                            aria-label={`Enabled: ${name}`}
                                        />
                                        <div className={styles.ruleText}>
                                            <div className={styles.ruleName}>{name}</div>
                                            <div className={styles.ruleMeta}>
                                                {r.dtstart} · {r.rrule}
                                            </div>
                                        </div>
                                    </label>

                                    <button
                                        type="button"
                                        className={styles.iconDangerBtn}
                                        onClick={() => removeScheduleRule(r.id)}
                                        title="Remove rule"
                                        aria-label="Remove rule"
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </ModalShell>
    );
}

function weekdayFromIsoDate(date: IsoDateString): WeekdayCode {
    const day = parseIsoDateUtc(date).getUTCDay();
    // 0=Sun ... 6=Sat
    if (day === 0) return "SU";
    if (day === 1) return "MO";
    if (day === 2) return "TU";
    if (day === 3) return "WE";
    if (day === 4) return "TH";
    if (day === 5) return "FR";
    return "SA";
}

function buildRrule(opts: {
    repeat: Exclude<RepeatMode, "none">;
    weeklyDays: WeekdayCode[];
    monthDay: number;
}): string {
    const { repeat, weeklyDays, monthDay } = opts;

    if (repeat === "daily") return "FREQ=DAILY";

    if (repeat === "weekly") {
        const days = weeklyDays.length > 0 ? weeklyDays : ["MO"];
        return `FREQ=WEEKLY;BYDAY=${days.join(",")}`;
    }

    return `FREQ=MONTHLY;BYMONTHDAY=${monthDay}`;
}

type ScheduleModalProps = {
    open: boolean;
    onClose: () => void;
    targets: Target[];
    initialTargetId: TargetId;
    schedule: TargetSchedule;
    addScheduleRule: (rule: {
        targetId: TargetId;
        dtstart: IsoDateString;
        rrule: string;
        enabled: boolean;
        priority: number;
    }) => string;
    setScheduleOverride: (date: IsoDateString, targetId: TargetId | null) => void;
    updateScheduleRule: (
        ruleId: string,
        patch: Partial<Omit<TargetScheduleRule, "id" | "createdAt">>,
    ) => void;
    removeScheduleRule: (ruleId: string) => void;
    clearScheduleOverride: (date: IsoDateString) => void;
};

type RepeatMode = "none" | "daily" | "weekly" | "monthly";

type WeekdayCode = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

const WEEKDAYS: Array<{ code: WeekdayCode; label: string; ariaLabel: string }> = [
    { code: "SU", label: "S", ariaLabel: "Sunday" },
    { code: "MO", label: "M", ariaLabel: "Monday" },
    { code: "TU", label: "T", ariaLabel: "Tuesday" },
    { code: "WE", label: "W", ariaLabel: "Wednesday" },
    { code: "TH", label: "T", ariaLabel: "Thursday" },
    { code: "FR", label: "F", ariaLabel: "Friday" },
    { code: "SA", label: "S", ariaLabel: "Saturday" },
];
