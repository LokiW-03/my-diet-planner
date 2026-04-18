"use client";

import { DropdownMenu } from "@/client/src/components/DropdownMenu/DropdownMenu";
import styles from "./TargetSelect.module.scss";

export function TargetSelect({ value, onChange, options, placeholder }: TargetSelectProps) {
    const selected = options.find((o) => o.value === value);

    return (
        <DropdownMenu
            buttonLabel={selected?.label ?? placeholder ?? "Select…"}
            options={options.map((opt) => ({
                value: opt.value,
                label: opt.label,
                selected: opt.value === value,
            }))}
            onSelect={onChange}
            arrowSize={22}
            rootClassName={styles.TargetSelect}
            buttonClassName={styles.TargetSelectButton}
            labelClassName={styles.TargetSelectLabel}
            arrowClassName={styles.TargetSelectArrow}
            menuClassName={styles.TargetSelectMenu}
            optionClassName={styles.TargetSelectOption}
            optionSelectedClassName={styles.TargetSelectOptionSelected}
        />
    );
}

type TargetSelectProps = {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
};

type Option = { value: string; label: string };