"use client";

import { useEffect, useMemo, useState } from "react";
import type { CategoryId, FoodCategory, FoodItem } from "@/shared/models";
import type { Unit } from "@/shared/defaults";
import { UNITS } from "@/shared/defaults";
import { clampInt } from "@/shared/utils";
import { CATEGORIES } from "@/shared/defaults";
import { uid } from "@/shared/utils";

type Props = {
    open: boolean;
    mode: "add" | "edit";
    categories: FoodCategory[]; // <-- provide categories from store/API
    categoryPreset?: CategoryId; // <-- preset by id now
    food?: FoodItem | null;
    onClose: () => void;
    onSave: (v: Omit<FoodItem, "id">) => void;
    onDelete?: () => void;
};

const initialCategories: FoodCategory[] = CATEGORIES.map((name, i) => ({
    id: uid("cat") as unknown as CategoryId,
    profileId: "local",
    name,
    order: i,
    enabled: true,
}));


export function FoodModal({ open, mode, categories, categoryPreset, food, onClose, onSave, onDelete }: Props) {

    const safeCategories = categories ?? initialCategories;

    const visibleCats = useMemo(
        () => safeCategories.filter((c) => c.enabled).slice().sort((a, b) => a.order - b.order),
        [safeCategories]
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
        <div style={styles.backdrop} onMouseDown={onClose}>
            <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <h2 style={{ marginTop: 0, color: "var(--background)" }}>
                    {mode === "add" ? "Add Food" : "Edit Food"}
                </h2>

                <div style={styles.row}>
                    <label style={styles.label}>Name</label>
                    <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div style={styles.row}>
                    <label style={styles.label}>Category</label>
                    <select
                        style={styles.input}
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

                <div style={styles.row}>
                    <label style={styles.label}>Unit</label>
                    <select style={styles.input} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                        {UNITS.map((u) => (
                            <option key={u} value={u}>
                                {u}
                            </option>
                        ))}
                    </select>
                </div>

                <div style={styles.row}>
                    <label style={styles.label}>Kcal per {unit}</label>
                    <input
                        style={styles.input}
                        type="number"
                        value={kcalPerUnit}
                        onChange={(e) => setKcal(Number(e.target.value))}
                    />
                </div>

                <div style={styles.row}>
                    <label style={styles.label}>Protein per {unit}</label>
                    <input
                        style={styles.input}
                        type="number"
                        value={proteinPerUnit}
                        onChange={(e) => setProtein(Number(e.target.value))}
                    />
                </div>

                <div style={styles.row}>
                    <label style={styles.label}>Default portion ({unit})</label>
                    <input
                        style={styles.input}
                        type="number"
                        value={defaultPortion}
                        onChange={(e) => setPortion(clampInt(Number(e.target.value), 0, 100000))}
                    />
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 16 }}>
                    <div>
                        {mode === "edit" && onDelete && (
                            <button style={styles.dangerBtn} onClick={onDelete}>
                                Delete
                            </button>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button style={styles.btn} onClick={onClose}>
                            Cancel
                        </button>
                        <button
                            style={styles.btnPrimary}
                            disabled={!canSave}
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
                </div>
            </div>
        </div>
    );
}

const styles: Record<string, React.CSSProperties> = {
    // ...existing code...
    backdrop: {
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        zIndex: 50,
    },
    modal: {
        width: 520,
        maxWidth: "100%",
        background: "var(--card-bg)",
        borderRadius: 12,
        padding: 16,
        boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
    },
    row: { display: "grid", gridTemplateColumns: "160px 1fr", gap: 12, marginBottom: 10, alignItems: "center" },
    label: { fontWeight: 600, color: "var(--background)" },
    input: { padding: 8, borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--background)" },
    btn: { padding: "8px 12px", borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--background)" },
    btnPrimary: { padding: "8px 12px", borderRadius: 10, border: "1px solid var(--btn-border)", background: "var(--btn-bg)", color: "var(--btn-fg)" },
    dangerBtn: { padding: "8px 12px", borderRadius: 10, border: "1px solid var(--danger-fg)", background: "var(--card-bg)", color: "var(--danger-fg)" },
};