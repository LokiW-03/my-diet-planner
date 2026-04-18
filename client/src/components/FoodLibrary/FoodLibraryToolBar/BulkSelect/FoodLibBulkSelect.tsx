"use client";

import { DropdownMenu } from "@/client/src/components/DropdownMenu/DropdownMenu";
import styles from "./FoodLibBulkSelect.module.scss";

export function FoodLibBulkSelect({
    placeholder,
    options,
    onSelect,
    title,
    disabled = false,
}: FoodLibBulkSelectProps) {
    return (
        <DropdownMenu
            buttonLabel={placeholder}
            options={options}
            onSelect={onSelect}
            disabled={disabled}
            title={title}
            arrowSize={18}
            rootClassName={styles.BulkSelect}
            buttonClassName={styles.BulkSelectButton}
            buttonDisabledClassName={styles.BulkSelectButtonDisabled}
            labelClassName={styles.BulkSelectLabel}
            arrowClassName={styles.BulkSelectArrow}
            menuClassName={styles.BulkSelectMenu}
            optionClassName={styles.BulkSelectOption}
        />
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
