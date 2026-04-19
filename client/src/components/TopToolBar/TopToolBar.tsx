"use client";

import { FaUserCircle, FaEdit, FaSave, FaRegCalendarAlt } from "react-icons/fa";
import { FaRotateRight } from "react-icons/fa6";
import type { Target, TargetId } from "@/shared/models";
import { TargetSelect } from "./TargetSelect";
import styles from "./TopToolBar.module.scss";

export function TopToolBar({
    showProfile,
    onToggleProfile,
    onEditTargets,
    onOpenSchedule,
    targets,
    dayType,
    onDayTypeChange,
    onSaveDefaults,
    onReset,
}: TopToolBarProps) {
    return (
        <div className={styles.bar}>
            <div className={styles.group}>
                <button
                    className={
                        showProfile ? `${styles.btn} ${styles.btnActive}` : styles.btn
                    }
                    onClick={onToggleProfile}
                    type="button"
                    title="Show profile"
                >
                    <FaUserCircle size={18} />
                </button>
            </div>

            <div className={styles.group}>
                {targets.length > 0 && (
                    <>
                        <div className={styles.groupLabel}>Target:</div>

                        <TargetSelect
                            value={String(dayType)}
                            onChange={(val) => {
                                const next = targets.find((t) => String(t.id) === val);
                                if (next) onDayTypeChange(next.id);
                            }}
                            options={targets.map((t) => ({
                                value: String(t.id),
                                label: t.name,
                            }))}
                        />
                    </>
                )}
                <button
                    className={`${styles.btn} ${styles.editBtn}`}
                    onClick={onEditTargets}
                    type="button"
                    title="Edit targets"
                >
                    <FaEdit size={18} />
                </button>

                <button
                    className={styles.btn}
                    onClick={onOpenSchedule}
                    type="button"
                    title="Schedule targets"
                    aria-label="Schedule targets"
                >
                    <FaRegCalendarAlt size={18} />
                </button>
            </div>

            <div className={styles.group}>
                <div className={styles.groupLabel}>Meals:</div>
                <button
                    type="button"
                    className={styles.btn}
                    title="Save current meal panel layout as defaults"
                    onClick={onSaveDefaults}
                >
                    <FaSave size={18} />
                </button>

                <button type="button" className={styles.btn} onClick={onReset} title="Reset meal panels to defaults">
                    <FaRotateRight size={18} />
                </button>
            </div>
        </div>
    );
}

type TopToolBarProps = {
    showProfile: boolean;
    onToggleProfile: () => void;

    onEditTargets: () => void;
    onOpenSchedule: () => void;

    targets: Target[];
    dayType: TargetId;
    onDayTypeChange: (next: TargetId) => void;

    onSaveDefaults: () => void;
    onReset: () => void;
};
