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
import { DropdownMenu } from "@/client/src/components/DropdownMenu/DropdownMenu";
import {
    asIsoDateString,
    parseByDayCodesFromRrule,
    toIsoDateStringLocalCalendar,
    weekdayCodeFromIsoDate,
} from "@/client/src/utils/targetSchedule";
import type { WeekdayCode } from "@/client/src/utils/targetSchedule";
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
    const [weeklyDays, setWeeklyDays] = useState<WeekdayCode[]>(() => [weekdayCodeFromIsoDate(today)]);

    const onAddRule = useCallback(() => {
        const rrule = buildWeeklyRrule({ weeklyDays });
        addScheduleRule({
            targetId,
            dtstart: today,
            rrule,
            enabled: true,
            priority: 0,
        });
    }, [addScheduleRule, targetId, today, weeklyDays]);

    const canSave = useMemo(() => {
        if (targets.length === 0) return false;
        return weeklyDays.length > 0;
    }, [targets.length, weeklyDays.length]);

    const sortedRules = useMemo(() => {
        return (schedule.rules ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }, [schedule.rules]);

    const selectedTarget = targets.find((t) => t.id === targetId);

    return (
        <ModalShell
            open={open}
            title="Schedule"
            onClose={onClose}
            size="md"
        >
            <div className={styles.form}>
                <div className={styles.target}>
                    <label htmlFor="scheduleModalTarget" className={styles.label}>Target:</label>
                    <DropdownMenu
                        triggerId="scheduleModalTarget"
                        buttonLabel={selectedTarget?.name ?? "Select…"}
                        options={targets.map((t) => ({
                            value: String(t.id),
                            label: t.name,
                            selected: t.id === targetId,
                        }))}
                        onSelect={(value) => setTargetId(value as TargetId)}
                        disabled={targets.length === 0}
                        rootClassName={styles.dropdownRoot}
                        buttonClassName={`${styles.select} ${styles.dropdownButton}`}
                        menuClassName={styles.dropdownMenu}
                        optionClassName={styles.dropdownOption}
                        optionSelectedClassName={styles.dropdownOptionSelected}
                        closeOnMouseLeave={true}
                    />
                </div>

                <div className={styles.weeklyRow}>
                    <div className={styles.weeklyLabel}>Days:</div>
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
                                    {d.shortLabel}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.rulesToolRow}>
                    <button
                        className={styles.btn}
                        type="button"
                        onClick={onAddRule}
                        disabled={!canSave}
                    >
                        Add Rule
                    </button>

                    <button
                        className={styles.btn}
                        type="button"
                        onClick={() => {
                            setWeeklyDays([weekdayCodeFromIsoDate(today)]);
                        }}
                    >
                        Clear
                    </button>
                </div>


                <div className={styles.rulesTitle}>Saved rules</div>
                {sortedRules.length === 0 ? (
                    <div className={styles.hint}>No schedule rules yet.</div>
                ) : (
                    <div className={styles.rulesList}>
                        {sortedRules.map((r) =>
                            <RuleRow
                                key={r.id}
                                rule={r}
                                targets={targets}
                                updateScheduleRule={updateScheduleRule}
                                removeScheduleRule={removeScheduleRule}
                            />
                        )}
                    </div>
                )}
            </div>
        </ModalShell>
    );
}


function RuleRow({ rule, targets, updateScheduleRule, removeScheduleRule }: RuleRowProps) {
    const name = targets.find((t) => t.id === rule.targetId)?.name ?? String(rule.targetId);
    return (
        <div className={styles.ruleRow}>
            <label className={styles.ruleLeft}>
                <input
                    type="checkbox"
                    className={styles.ruleCheckbox}
                    checked={rule.enabled}
                    onChange={(e) => updateScheduleRule(rule.id, { enabled: e.target.checked })}
                    aria-label={`Enabled: ${name}`}
                />
                <div className={styles.ruleText}>
                    <div className={styles.ruleName}>{name}</div>
                    <div className={styles.ruleMeta}>
                        Every: {getRuleDayLabels(rule).join(", ")}
                    </div>
                </div>
            </label>

            <button
                type="button"
                className={styles.iconDangerBtn}
                onClick={() => removeScheduleRule(rule.id)}
                title="Remove rule"
                aria-label="Remove rule"
            >
                <FaTrash />
            </button>
        </div >
    );
}

function buildWeeklyRrule(opts: { weeklyDays: WeekdayCode[] }): string {
    const days = opts.weeklyDays.length > 0 ? opts.weeklyDays : ["MO"];
    return `FREQ=WEEKLY;BYDAY=${days.join(",")}`;
}

function isDefined<T>(value: T | null | undefined): value is T {
    return value !== null && value !== undefined;
}

function getRuleDayLabels(rule: TargetScheduleRule): string[] {
    const codes = parseByDayCodesFromRrule(rule.rrule);

    if (codes) {
        return codes
            .map((c) => WEEKDAYS.find((d) => d.code === c))
            .filter(isDefined)
            .sort((a: WeekdayMeta, b: WeekdayMeta) => a.ruleOrder - b.ruleOrder)
            .map((d) => d.shortLabel);
    }

    const fallback = WEEKDAYS.find((d) => d.code === weekdayCodeFromIsoDate(rule.dtstart));
    return [fallback?.shortLabel ?? "(unknown)"];
}

const WEEKDAYS: Array<{
    code: WeekdayCode;
    ariaLabel: string;
    shortLabel: string;
    ruleOrder: number;
}> = [
        { code: "SU", ariaLabel: "Sunday", shortLabel: "Sun", ruleOrder: 6 },
        { code: "MO", ariaLabel: "Monday", shortLabel: "Mon", ruleOrder: 0 },
        { code: "TU", ariaLabel: "Tuesday", shortLabel: "Tue", ruleOrder: 1 },
        { code: "WE", ariaLabel: "Wednesday", shortLabel: "Wed", ruleOrder: 2 },
        { code: "TH", ariaLabel: "Thursday", shortLabel: "Thu", ruleOrder: 3 },
        { code: "FR", ariaLabel: "Friday", shortLabel: "Fri", ruleOrder: 4 },
        { code: "SA", ariaLabel: "Saturday", shortLabel: "Sat", ruleOrder: 5 },
    ];


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

type RuleRowProps = {
    rule: TargetScheduleRule;
    targets: Target[];
    updateScheduleRule: (ruleId: string, patch: Partial<Omit<TargetScheduleRule, "id" | "createdAt">>) => void;
    removeScheduleRule: (ruleId: string) => void;
};

type WeekdayMeta = (typeof WEEKDAYS)[number];

