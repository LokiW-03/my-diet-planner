"use client";

import { useEffect, useMemo, useState } from "react";
import type { Category, FoodItem, Unit } from "@/lib/models";
import { CATEGORIES, UNITS } from "@/lib/models";
import { clampInt } from "@/lib/utils";

type Props = {
    open: boolean;
    mode: "add" | "edit";
    categoryPreset?: Category;
    food?: FoodItem | null;
    onClose: () => void;
    onSave: (v: Omit<FoodItem, "id">) => void;
    onDelete?: () => void;
};

export function FoodModal({ open, mode, categoryPreset, food, onClose, onSave, onDelete }: Props) {
    const initial = useMemo(() => {
        if (mode === "edit" && food) return food;
        return {
            name: "",
            category: categoryPreset ?? "Proteins",
            unit: "g" as Unit,
            kcalPerUnit: 0,
            proteinPerUnit: 0,
            defaultPortion: 100,
        };
    }, [mode, food, categoryPreset]);

    const [name, setName] = useState(initial.name);
    const [category, setCategory] = useState<Category>(initial.category);
    const [unit, setUnit] = useState<Unit>(initial.unit);
    const [kcalPerUnit, setKcal] = useState<number>(initial.kcalPerUnit);
    const [proteinPerUnit, setProtein] = useState<number>(initial.proteinPerUnit);
    const [defaultPortion, setPortion] = useState<number>(initial.defaultPortion);

    useEffect(() => {
        setName(initial.name);
        setCategory(initial.category);
        setUnit(initial.unit);
        setKcal(initial.kcalPerUnit);
        setProtein(initial.proteinPerUnit);
        setPortion(initial.defaultPortion);
    }, [initial]);

    if (!open) return null;

    return (
        <div style={styles.backdrop} onMouseDown={onClose}>
            <div style={styles.modal} onMouseDown={(e) => e.stopPropagation()}>
                <h2 style={{ marginTop: 0 }}>{mode === "add" ? "Add Food" : "Edit Food"}</h2>

                <div style={styles.row}>
                    <label style={styles.label}>Name</label>
                    <input style={styles.input} value={name} onChange={(e) => setName(e.target.value)} />
                </div>

                <div style={styles.row}>
                    <label style={styles.label}>Category</label>
                    <select style={styles.input} value={category} onChange={(e) => setCategory(e.target.value as Category)}>
                        {CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                        ))}
                    </select>
                </div>

                <div style={styles.row}>
                    <label style={styles.label}>Unit</label>
                    <select style={styles.input} value={unit} onChange={(e) => setUnit(e.target.value as Unit)}>
                        {UNITS.map((u) => (
                            <option key={u} value={u}>{u}</option>
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
                            <button style={styles.dangerBtn} onClick={onDelete}>Delete</button>
                        )}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button style={styles.btn} onClick={onClose}>Cancel</button>
                        <button
                            style={styles.btnPrimary}
                            onClick={() => {
                                const trimmed = name.trim();
                                if (!trimmed) return;
                                onSave({
                                    name: trimmed,
                                    category,
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
    label: { fontWeight: 600 },
    input: { padding: 8, borderRadius: 8, border: "1px solid var(--card-border)", background: "var(--background)" },
    btn: { padding: "8px 12px", borderRadius: 10, border: "1px solid var(--card-border)", background: "var(--background)" },
    btnPrimary: { padding: "8px 12px", borderRadius: 10, border: "1px solid var(--btn-border)", background: "var(--btn-bg)", color: "var(--btn-fg)" },
    dangerBtn: { padding: "8px 12px", borderRadius: 10, border: "1px solid var(--danger-fg)", background: "var(--card-bg)", color: "var(--danger-fg)" },
};
