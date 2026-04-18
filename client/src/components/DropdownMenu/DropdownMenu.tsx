"use client";

import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
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
    const rootRef = useRef<HTMLDivElement | null>(null);
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const reactId = useId();
    const buttonId = `dropdown-button-${reactId}`;
    const menuId = `dropdown-menu-${reactId}`;

    const derivedDisabled = disabledProp || options.length === 0;

    useEffect(() => {
        if (!open) return;

        // If the dropdown becomes disabled while open, close it.
        if (derivedDisabled) {
            setOpen(false);
            return;
        }

        const onPointerDown = (ev: Event) => {
            const root = rootRef.current;
            if (!root) return;
            if (!(ev.target instanceof Node)) return;
            if (!root.contains(ev.target)) setOpen(false);
        };

        const onKeyDown = (ev: KeyboardEvent) => {
            if (ev.key !== "Escape") return;
            ev.preventDefault();
            setOpen(false);
            queueMicrotask(() => buttonRef.current?.focus());
        };

        const onFocusIn = (ev: FocusEvent) => {
            const root = rootRef.current;
            if (!root) return;
            if (!(ev.target instanceof Node)) return;
            if (!root.contains(ev.target)) setOpen(false);
        };

        document.addEventListener("pointerdown", onPointerDown, true);
        document.addEventListener("keydown", onKeyDown, true);
        document.addEventListener("focusin", onFocusIn, true);

        return () => {
            document.removeEventListener("pointerdown", onPointerDown, true);
            document.removeEventListener("keydown", onKeyDown, true);
            document.removeEventListener("focusin", onFocusIn, true);
        };
    }, [open, derivedDisabled]);

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
        <div ref={rootRef} className={cx(styles.root, rootClassName)}>
            <button
                ref={buttonRef}
                id={buttonId}
                type="button"
                className={cx(
                    styles.button,
                    buttonClassName,
                    derivedDisabled ? buttonDisabledClassName : undefined,
                )}
                onClick={toggleOpen}
                disabled={derivedDisabled}
                aria-expanded={open}
                aria-controls={open ? menuId : undefined}
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
                    id={menuId}
                    className={cx(styles.menu, menuClassName)}
                    aria-labelledby={buttonId}
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
