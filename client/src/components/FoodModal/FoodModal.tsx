"use client";

import { useEffect, useMemo, useState } from "react";
import type { CategoryId, FoodCategory, FoodItem } from "@/shared/models";
import { type Unit, UNITS } from "@/shared/models";
import { clampInt } from "@/shared/utils";
import { ModalShell } from "@/client/src/components/ModalShell/ModalShell";
import styles from "./FoodModal.module.scss";


export function FoodModal({ open, mode, categories, categoryPreset, food, onClose, onSave, onDelete }: FoodModalProps) {

    const visibleCats = useMemo(
        () => (categories ?? []).filter((c) => c.enabled).slice().sort((a, b) => a.order - b.order),
        [categories]
    );

    const initial = useMemo(() => {
        if (mode === "edit" && food) return food;

        const fallbackCategoryId =
            categoryPreset ??
            visibleCats[0]?.id ??
            ("" as CategoryId);

        return {
            name: "",
            categoryId: fallbackCategoryId,
            unit: "g" as Unit,
            kcalPerUnit: 0,
            proteinPerUnit: 0,
            defaultPortion: 100,
        };
    }, [mode, food, categoryPreset, visibleCats]);

    const [name, setName] = useState(initial.name);
    const [categoryId, setCategoryId] = useState<CategoryId>(initial.categoryId);
    const [unit, setUnit] = useState<Unit>(initial.unit);
    const [kcalPerUnit, setKcal] = useState<number>(initial.kcalPerUnit);
    const [proteinPerUnit, setProtein] = useState<number>(initial.proteinPerUnit);
    const [defaultPortion, setPortion] = useState<number>(initial.defaultPortion);

    useEffect(() => {
        setName(initial.name);
        setCategoryId(initial.categoryId);
        setUnit(initial.unit);
        setKcal(initial.kcalPerUnit);
        setProtein(initial.proteinPerUnit);
        setPortion(initial.defaultPortion);
    }, [initial]);

    if (!open) return null;

    const canSave = name.trim().length > 0 && String(categoryId).length > 0;

    return (
        <ModalShell
            open={open}
            title={mode === "add" ? "Add Food" : "Edit Food"}
            onClose={onClose}
            size="md"
            footer={
                <>
                    <div className={styles.footerLeft}>
                        {mode === "edit" && onDelete && (
                            <button className={`${styles.btn} ${styles.dangerBtn}`} onClick={onDelete} type="button">
                                Delete
                            </button>
                        )}
                    </div>
                    <div className={styles.footerRight}>
                        <button className={styles.btn} onClick={onClose} type="button">
                            Cancel
                        </button>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            disabled={!canSave}
                            type="button"
                            onClick={() => {
                                if (!canSave) return;
                                onSave({
                                    name: name.trim(),
                                    categoryId,
                                    unit,
                                    kcalPerUnit: Number(kcalPerUnit) || 0,
                                    proteinPerUnit: Number(proteinPerUnit) || 0,
                                    defaultPortion: clampInt(Number(defaultPortion), 0, 100000),
                                });
                                onClose();
                            }}
                        >
                            Save
                        </button>
                    </div>
                </>
            }
        >
            <div className={styles.row}>
                <label className={styles.label}>Name</label>
                <input className={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className={styles.row}>
                <label className={styles.label}>Category</label>
                <select
                    className={styles.input}
                    value={String(categoryId)}
                    onChange={(e) => setCategoryId(e.target.value as unknown as CategoryId)}
                >
                    {visibleCats.map((c) => (
                        <option key={String(c.id)} value={String(c.id)}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.row}>
                <label className={styles.label}>Unit</label>
                <select className={styles.input} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                    {UNITS.map((u) => (
                        <option key={u} value={u}>
                            {u}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.row}>
                <label className={styles.label}>Kcal per {unit}</label>
                <input
                    className={styles.input}
                    type="number"
                    value={kcalPerUnit}
                    onChange={(e) => setKcal(Number(e.target.value))}
                />
            </div>

            <div className={styles.row}>
                <label className={styles.label}>Protein per {unit}</label>
                <input
                    className={styles.input}
                    type="number"
                    value={proteinPerUnit}
                    onChange={(e) => setProtein(Number(e.target.value))}
                />
            </div>

            <div className={styles.row}>
                <label className={styles.label}>Default portion ({unit})</label>
                <input
                    className={styles.input}
                    type="number"
                    value={defaultPortion}
                    onChange={(e) => setPortion(clampInt(Number(e.target.value), 0, 100000))}
                />
            </div>
        </ModalShell>
    );
}


type FoodModalProps = {
    open: boolean;
    mode: "add" | "edit";
    categories: FoodCategory[]; // <-- provide categories from store/API
    categoryPreset?: CategoryId; // <-- preset by id now
    food?: FoodItem | null;
    onClose: () => void;
    onSave: (v: Omit<FoodItem, "id">) => void;
    onDelete?: () => void;
};