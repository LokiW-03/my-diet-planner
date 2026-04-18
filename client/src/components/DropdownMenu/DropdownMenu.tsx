"use client";

import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { FiChevronDown } from "react-icons/fi";
import styles from "./DropdownMenu.module.scss";

export function DropdownMenu({
    buttonLabel,
    options,
    onSelect,
    disabled: disabledProp,
    title,
    ariaLabel,
    closeOnMouseLeave = true,
    arrowSize = 18,

    rootClassName,
    buttonClassName,
    buttonDisabledClassName,
    labelClassName,
    arrowClassName,
    menuClassName,
    optionClassName,
    optionSelectedClassName,
    optionDisabledClassName,
}: DropdownMenuProps) {
    const [open, setOpen] = useState(false);

    const derivedDisabled = useMemo(() => {
        if (disabledProp) return true;
        return options.length === 0;
    }, [disabledProp, options.length]);

    const toggleOpen = () => {
        if (derivedDisabled) return;
        setOpen((o) => !o);
    };

    const handleSelect = (value: string) => {
        if (derivedDisabled) return;
        onSelect(value);
        setOpen(false);
    };

    return (
        <div className={cx(styles.root, rootClassName)}>
            <button
                type="button"
                className={cx(
                    styles.button,
                    buttonClassName,
                    derivedDisabled ? buttonDisabledClassName : undefined,
                )}
                onClick={toggleOpen}
                disabled={derivedDisabled}
                aria-disabled={derivedDisabled}
                title={title}
                aria-label={ariaLabel}
            >
                <span className={cx(styles.label, labelClassName)}>
                    {buttonLabel}
                </span>
                <FiChevronDown
                    className={cx(styles.arrow, arrowClassName)}
                    size={arrowSize}
                />
            </button>

            {open && !derivedDisabled && (
                <ul
                    className={cx(styles.menu, menuClassName)}
                    onMouseLeave={
                        closeOnMouseLeave
                            ? () => setOpen(false)
                            : undefined
                    }
                >
                    {options.map((opt) => {
                        const selected = !!opt.selected;
                        const optDisabled = !!opt.disabled;
                        return (
                            <li key={opt.value}>
                                <button
                                    type="button"
                                    className={cx(
                                        styles.option,
                                        optionClassName,
                                        selected ? optionSelectedClassName : undefined,
                                        optDisabled ? optionDisabledClassName : undefined,
                                    )}
                                    disabled={optDisabled}
                                    aria-disabled={optDisabled}
                                    onClick={() => {
                                        if (optDisabled) return;
                                        handleSelect(opt.value);
                                    }}
                                >
                                    {opt.label}
                                </button>
                            </li>
                        );
                    })}
                </ul>
            )}
        </div>
    );
}

function cx(...parts: Array<string | undefined | null | false>): string {
    return parts.filter(Boolean).join(" ");
}

export type DropdownMenuOption = {
    value: string;
    label: ReactNode;
    selected?: boolean;
    disabled?: boolean;
};


type DropdownMenuProps = {
    buttonLabel: ReactNode;
    options: DropdownMenuOption[];
    onSelect: (value: string) => void;

    disabled?: boolean;
    title?: string;
    ariaLabel?: string;
    closeOnMouseLeave?: boolean;
    arrowSize?: number;

    rootClassName?: string;

    buttonClassName?: string;
    buttonDisabledClassName?: string;

    labelClassName?: string;

    arrowClassName?: string;

    menuClassName?: string;

    optionClassName?: string;

    optionSelectedClassName?: string;

    optionDisabledClassName?: string;
};
