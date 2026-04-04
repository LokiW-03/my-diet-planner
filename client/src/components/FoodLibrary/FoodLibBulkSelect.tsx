"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "./FoodLibBulkSelect.module.scss";

export function FoodLibBulkSelect({
    placeholder,
    options,
    onSelect,
    title,
    disabled = false,
}: FoodLibBulkSelectProps) {
    const [open, setOpen] = useState(false);

    const toggleOpen = () => {
        if (disabled) return;
        setOpen((o) => !o);
    };

    const handleSelect = (value: string) => {
        if (disabled) return;
        onSelect(value);
        setOpen(false);
    };

    return (
        <div className={styles.BulkSelect}>
            <button
                type="button"
                className={`${styles.BulkSelectButton} ${disabled ? styles.BulkSelectButtonDisabled : ""
                    }`}
                onClick={toggleOpen}
                title={title}
                disabled={disabled}
                aria-disabled={disabled}
            >
                <span className={styles.BulkSelectLabel}>{placeholder}</span>
                <FiChevronDown className={styles.BulkSelectArrow} size={18} />
            </button>

            {open && !disabled && (
                <ul
                    className={styles.BulkSelectMenu}
                    onMouseLeave={() => setOpen(false)}
                >
                    {options.map((opt) => (
                        <li key={opt.value}>
                            <button
                                type="button"
                                className={styles.BulkSelectOption}
                                onClick={() => handleSelect(opt.value)}
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

export type FoodLibBulkSelectOption = {
    value: string;
    label: string;
};

type FoodLibBulkSelectProps = {
    title: string;
    placeholder: string;
    options: FoodLibBulkSelectOption[];
    onSelect: (value: string) => void;
    disabled?: boolean;
};
