"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "./TargetSelect.module.scss";

export function TargetSelect({ value, onChange, options }: TargetSelectProps) {
    const [open, setOpen] = useState(false);
    const selected = options.find((o) => o.value === value);

    return (
        <div className={styles.TargetSelect}>
            <button
                type="button"
                className={styles.TargetSelectButton}
                onClick={() => setOpen((o) => !o)}
            >
                <span className={styles.TargetSelectLabel}>
                    {selected?.label ?? "Select…"}
                </span>
                <FiChevronDown className={styles.TargetSelectArrow} size={22} />
            </button>

            {open && (
                <ul
                    className={styles.TargetSelectMenu}
                    onMouseLeave={() => setOpen(false)}
                >
                    {options.map((opt) => (
                        <li key={opt.value}>
                            <button
                                type="button"
                                className={
                                    opt.value === value
                                        ? `${styles.TargetSelectOption} ${styles.TargetSelectOptionSelected}`
                                        : styles.TargetSelectOption
                                }
                                onClick={() => {
                                    onChange(opt.value);
                                    setOpen(false);
                                }}
                            >
                                {opt.label}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

type TargetSelectProps = {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
};

type Option = { value: string; label: string };