"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { FaTrash } from "react-icons/fa";
import type { Target, TargetId } from "@/shared/models";
import { DEFAULT_TARGETS } from "@/shared/defaults";
import styles from "./TargetModal.module.scss";

export function TargetModal({
    open,
    targets,
    onClose,
    onAddTarget,
    onUpdateTarget,
    onRemoveTarget,
    onResetToDefault,
    onSaveAsDefault,
}: Props) {
    const [draft, setDraft] = useState<DraftTarget[]>(() => targets.map(toDraft));
    const shouldScrollToBottomRef = useRef(false);

    const bottomSentinelRef = useCallback((node: HTMLDivElement | null) => {
        if (!node) return;
        if (!shouldScrollToBottomRef.current) return;
        shouldScrollToBottomRef.current = false;

        // Defer one frame so the new row has final layout.
        requestAnimationFrame(() => {
            node.scrollIntoView({ block: "end" });
        });
    }, []);

    const canRemove = useMemo(() => draft.length > 1, [draft.length]);

    if (!open) return null;

    return (
        <div
            className={styles.overlay}
            onClick={() => {
                onClose();
            }}
        >
            <div className={styles.panel} onClick={(e) => e.stopPropagation()}>
                <div className={styles.panelHeader}>
                    <h3 className={styles.title}>Targets</h3>
                    <button
                        className={styles.closeBtn}
                        onClick={() => {
                            onClose();
                        }}
                        type="button"
                        title="Close"
                    >
                        ✕
                    </button>
                </div>

                <div className={styles.body}>
                    <table className={styles.table}>
                        <thead>
                            <tr>
                                <th className={styles.th}>Name</th>
                                <th className={styles.th}>Min kcal</th>
                                <th className={styles.th}>Max kcal</th>
                                <th className={styles.th} />
                            </tr>
                        </thead>
                        <tbody>
                            {draft.map((row) => (
                                <tr key={row.key}>
                                    <td className={styles.td}>
                                        <input
                                            className={styles.input}
                                            value={row.name}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                setDraft((s) =>
                                                    s.map((r) => (r.key === row.key ? { ...r, name: next } : r))
                                                );

                                                if (!row.existingId) return;
                                                if (next.trim().length === 0) return;
                                                onUpdateTarget(row.existingId, { name: next.trim() });
                                            }}
                                        />
                                    </td>
                                    <td className={styles.td}>
                                        <input
                                            className={styles.input}
                                            type="number"
                                            value={row.minKcal}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                setDraft((s) =>
                                                    s.map((r) => (r.key === row.key ? { ...r, minKcal: next } : r))
                                                );

                                                if (!row.existingId) return;
                                                const min = Math.round(Number(next) || 0);
                                                const currentMax = Math.round(Number(row.maxKcal) || 0);
                                                const max = Math.max(min, currentMax);
                                                onUpdateTarget(row.existingId, { minKcal: min, maxKcal: max });
                                            }}
                                        />
                                    </td>
                                    <td className={styles.td}>
                                        <input
                                            className={styles.input}
                                            type="number"
                                            value={row.maxKcal}
                                            onChange={(e) => {
                                                const next = e.target.value;
                                                setDraft((s) =>
                                                    s.map((r) => (r.key === row.key ? { ...r, maxKcal: next } : r))
                                                );

                                                if (!row.existingId) return;
                                                const max = Math.round(Number(next) || 0);
                                                const currentMin = Math.round(Number(row.minKcal) || 0);
                                                onUpdateTarget(row.existingId, {
                                                    maxKcal: Math.max(currentMin, max),
                                                });
                                            }}
                                        />
                                    </td>
                                    <td className={styles.td}>
                                        <button
                                            className={`${styles.btn} ${styles.dangerBtn}`}
                                            type="button"
                                            onClick={() => {
                                                setDraft((s) => {
                                                    if (s.length <= 1) return s;
                                                    return s.filter((r) => r.key !== row.key);
                                                });

                                                if (!row.existingId) return;
                                                if (!canRemove) return;
                                                onRemoveTarget(row.existingId);
                                            }}
                                            disabled={!canRemove}
                                            title={!canRemove ? "At least one target is required" : "Remove"}
                                        >
                                            <FaTrash />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <div key={draft.length} ref={bottomSentinelRef} aria-hidden="true" />
                </div>

                <div className={styles.footer}>
                    <div className={styles.footerLeft}>
                        <button
                            className={styles.addBtn}
                            type="button"
                            title="Add target"
                            aria-label="Add target"
                            onClick={() => {
                                shouldScrollToBottomRef.current = true;
                                const id = onAddTarget({ name: "NEW", minKcal: 0, maxKcal: 0 });
                                setDraft((s) => [
                                    ...s,
                                    {
                                        key: String(id),
                                        existingId: id,
                                        name: "NEW",
                                        minKcal: "0",
                                        maxKcal: "0",
                                    },
                                ]);
                            }}
                        >
                            +
                        </button>
                    </div>

                    <div className={styles.footerRight}>
                        <button
                            className={styles.btn}
                            type="button"
                            onClick={() => {
                                onResetToDefault();
                                setDraft(DEFAULT_TARGETS.map(toDraft));
                            }}
                        >
                            Reset to default
                        </button>

                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            type="button"
                            onClick={async () => {
                                await onSaveAsDefault();
                            }}
                        >
                            Save as default
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function toDraft(t: Target): DraftTarget {
    return {
        key: String(t.id),
        existingId: t.id,
        name: t.name,
        minKcal: String(t.minKcal),
        maxKcal: String(t.maxKcal),
    };
}

type Props = {
    open: boolean;
    targets: Target[];
    onClose: () => void;
    onAddTarget: (target: Omit<Target, "id">) => TargetId;
    onUpdateTarget: (targetId: TargetId, patch: Partial<Omit<Target, "id">>) => void;
    onRemoveTarget: (targetId: TargetId) => void;
    onResetToDefault: () => void;
    onSaveAsDefault: () => Promise<void>;
};

export type DraftTarget = {
    key: string;
    existingId?: TargetId;
    name: string;
    minKcal: string;
    maxKcal: string;
};


