"use client";

import { useEffect } from "react";
import styles from "./ModalShell.module.scss";

export type ModalShellSize = "md" | "lg";

export function ModalShell({
    open,
    title,
    onClose,
    size = "md",
    maxHeight,
    showCloseButton = true,
    footer,
    children,
}: ModalShellProps) {
    useEffect(() => {
        if (!open) return;

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        };

        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className={styles.overlay} onMouseDown={onClose} role="dialog" aria-modal="true">
            <div
                className={`${styles.panel} ${size === "lg" ? styles.lg : styles.md}`}
                style={maxHeight ? { maxHeight } : undefined}
                onMouseDown={(e) => e.stopPropagation()}
            >
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    {showCloseButton ? (
                        <button className={styles.closeBtn} onClick={onClose} type="button" title="Close">
                            ✕
                        </button>
                    ) : (
                        <div className={styles.closeSpacer} aria-hidden="true" />
                    )}
                </div>

                <div className={styles.body}>{children}</div>

                {footer ? <div className={styles.footer}>{footer}</div> : null}
            </div>
        </div>
    );
}

type ModalShellProps = {
    open: boolean;
    title: string;
    onClose: () => void;
    size?: ModalShellSize;
    maxHeight?: string;
    showCloseButton?: boolean;
    footer?: React.ReactNode;
    children: React.ReactNode;
};