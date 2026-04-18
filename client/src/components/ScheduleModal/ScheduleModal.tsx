"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { IsoDateString, Target, TargetId } from "@/shared/models";
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
    addScheduleRule,
    setScheduleOverride,
}: ScheduleModalProps) {
    const today = useMemo(
        () => asIsoDateString(toIsoDateStringLocalCalendar(new Date())),
        [],
    );

    const [targetId, setTargetId] = useState<TargetId>(initialTargetId);
    const [date, setDate] = useState<IsoDateString>(today);
    const [repeat, setRepeat] = useState<RepeatMode>("weekly");
    const [weeklyDays, setWeeklyDays] = useState<WeekdayCode[]>(() => {
        return [weekdayFromIsoDate(today)];
    });

    useEffect(() => {
        if (!open) return;

        setTargetId(initialTargetId);
        setDate(today);
        setRepeat("weekly");
        setWeeklyDays([weekdayFromIsoDate(today)]);
    }, [initialTargetId, open, today]);

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
                        Clear
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
                            const next = asIsoDateString(e.target.value);
                            setDate(next);
                            if (repeat === "weekly") {
                                setWeeklyDays([weekdayFromIsoDate(next)]);
                            }
                        }}
                    />
                </label>

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
                                        title={d.code}
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
    addScheduleRule: (rule: {
        targetId: TargetId;
        dtstart: IsoDateString;
        rrule: string;
        enabled: boolean;
        priority: number;
    }) => string;
    setScheduleOverride: (date: IsoDateString, targetId: TargetId | null) => void;
};

type RepeatMode = "none" | "daily" | "weekly" | "monthly";

type WeekdayCode = "MO" | "TU" | "WE" | "TH" | "FR" | "SA" | "SU";

const WEEKDAYS: Array<{ code: WeekdayCode; label: string }> = [
    { code: "SU", label: "S" },
    { code: "MO", label: "M" },
    { code: "TU", label: "T" },
    { code: "WE", label: "W" },
    { code: "TH", label: "T" },
    { code: "FR", label: "F" },
    { code: "SA", label: "S" },
];
