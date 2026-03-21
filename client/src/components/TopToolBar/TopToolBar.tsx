"use client";

import { FaUserCircle } from "react-icons/fa";
import { FiChevronDown, FiRotateCcw, FiSave } from "react-icons/fi";
import type { Target, TargetId } from "@/shared/models";
import styles from "./TopToolBar.module.scss";

type TopToolBarProps = {
    showProfile: boolean;
    onToggleProfile: () => void;

    targets: Target[];
    dayType: TargetId;
    onDayTypeChange: (next: TargetId) => void;

    onSaveDefaults: () => void;
    onReset: () => void;
};

export function TopToolBar({
    showProfile,
    onToggleProfile,
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
                    className={showProfile ? `${styles.btn} ${styles.btnActive}` : styles.btn}
                    onClick={onToggleProfile}
                    type="button"
                >
                    <FaUserCircle size={18} />
                </button>
            </div>

            <div className={styles.group}>

                {targets.length > 0 && (
                    <>
                        <div className={styles.groupLabel}>Target:</div>

                        <div className={styles.selectWrap}>
                            <select
                                aria-label="Target"
                                className={styles.daySelect}
                                value={dayType}
                                onChange={(e) => {
                                    const next = targets.find(
                                        (t) => String(t.id) === e.target.value,
                                    );
                                    if (next) onDayTypeChange(next.id);
                                }}
                            >
                                {targets.map((t) => (
                                    <option key={String(t.id)} value={String(t.id)}>
                                        {t.name}
                                    </option>
                                ))}
                            </select>
                            <span className={styles.selectArrow} aria-hidden="true">
                                <FiChevronDown size={22} />
                            </span>
                        </div>
                    </>
                )}
            </div>

            <div className={styles.group}>
                <div className={styles.groupLabel}>Meals:</div>
                <button
                    type="button"
                    className={styles.btn}
                    title="Save meal panels (including removed/disabled) as DB defaults"
                    onClick={onSaveDefaults}
                >
                    <FiSave size={18} />
                </button>

                <button type="button" className={styles.btn} onClick={onReset}>
                    <FiRotateCcw size={18} />
                </button>
            </div>
        </div>
    );
}