"use client";

import { useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "./FoodLibBulkSelect.module.scss";

export function FoodLibBulkSelect({
    placeholder,
    options,
    onSelect,
    title,
}: FoodLibBulkSelectProps) {
    const [open, setOpen] = useState(false);

    return (
        <div className={styles.BulkSelect}>
            <button
                type="button"
                className={styles.BulkSelectButton}
                onClick={() => setOpen((o) => !o)}
                title={title}
            >
                <span className={styles.BulkSelectLabel}>{placeholder}</span>
                <FiChevronDown className={styles.BulkSelectArrow} size={18} />
            </button>

            {open && (
                <ul
                    className={styles.BulkSelectMenu}
                    onMouseLeave={() => setOpen(false)}
                >
                    {options.map((opt) => (
                        <li key={opt.value}>
                            <button
                                type="button"
                                className={styles.BulkSelectOption}
                                onClick={() => {
                                    onSelect(opt.value);
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

export type FoodLibBulkSelectOption = {
    value: string;
    label: string;
};

type FoodLibBulkSelectProps = {
    title: string;
    placeholder: string;
    options: FoodLibBulkSelectOption[];
    onSelect: (value: string) => void;
};
