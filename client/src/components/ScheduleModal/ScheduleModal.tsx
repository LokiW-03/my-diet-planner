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
    updateScheduleRule,
    removeScheduleRule,
}: ScheduleModalProps) {
    const today = useMemo(
        () => asIsoDateString(toIsoDateStringLocalCalendar(new Date())),
        [],
    );

    const [targetId, setTargetId] = useState<TargetId>(() => initialTargetId);
    const [weeklyDays, setWeeklyDays] = useState<WeekdayCode[]>(() => [weekdayFromIsoDate(today)]);

    const onOk = useCallback(() => {
        const rrule = buildWeeklyRrule({ weeklyDays });
        addScheduleRule({
            targetId,
            dtstart: today,
            rrule,
            enabled: true,
            priority: 0,
        });
        onClose();
    }, [addScheduleRule, onClose, targetId, today, weeklyDays]);

    const canSave = useMemo(() => {
        if (targets.length === 0) return false;
        return weeklyDays.length > 0;
    }, [targets.length, weeklyDays.length]);

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

function buildWeeklyRrule(opts: { weeklyDays: WeekdayCode[] }): string {
    const days = opts.weeklyDays.length > 0 ? opts.weeklyDays : ["MO"];
    return `FREQ=WEEKLY;BYDAY=${days.join(",")}`;
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
    updateScheduleRule: (
        ruleId: string,
        patch: Partial<Omit<TargetScheduleRule, "id" | "createdAt">>,
    ) => void;
    removeScheduleRule: (ruleId: string) => void;
};

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
