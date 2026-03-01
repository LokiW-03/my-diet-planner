"use client";

import React, { useEffect, useState } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import type { FoodId, FoodItem, MealEntry, MealDefinition } from "@/shared/models";

function MealEntryChip({
    meal,
    entry,
    foods,
    onRemove,
    onPortionChange,
    onEditFood,
}: {
    meal: string;
    entry: MealEntry;
    foods: FoodItem[];
    onRemove: () => void;
    onPortionChange: (n: number) => void;
    onEditFood: () => void;
}) {
    const food = foods.find((f) => f.id === entry.foodId);
    const id = `meal:${meal}:${entry.entryId}`;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    const [portionText, setPortionText] = useState(String(entry.portion));

    useEffect(() => {
        setPortionText(String(entry.portion));
    }, [entry.portion]);

    if (!food) return null;

    function handleChange(v: string) {
        setPortionText(v);
        const n = Number(v);
        if (v !== "" && Number.isFinite(n)) {
            onPortionChange(Math.trunc(n));
        }
    }

    function handleBlur() {
        if (portionText === "" || !Number.isFinite(Number(portionText))) {
            setPortionText(String(entry.portion));
        } else {
            onPortionChange(Math.trunc(Number(portionText)));
        }
    }

    return (
        <div
            ref={setNodeRef}
            style={{
                ...entryBox,
                opacity: isDragging ? 0.5 : 1,
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
            }}
        >
            <button
                style={entryNameBtn}
                onClick={onEditFood}
                title="Click to edit food"
                {...listeners}
                {...attributes}
            >
                {food.name}
            </button>

            <div style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--background)" }}>
                <input
                    style={portionInput}
                    type="number"
                    value={portionText}
                    onChange={(e) => handleChange(e.target.value)}
                    onBlur={handleBlur}
                />
                <span style={{ fontWeight: 700 }}>{food.unit}</span>
            </div>

            <button style={removeBtn} onClick={onRemove} title="Remove">✕</button>
        </div>
    );
}

function MealPanel({
    meal,
    title,
    entries,
    foods,
    onRemoveEntry,
    onPortionChange,
    onEditFood,
    footer,
}: {
    meal: string;
    title: string;
    entries: MealEntry[];
    foods: FoodItem[];
    onRemoveEntry: (entryId: string) => void;
    onPortionChange: (entryId: string, n: number) => void;
    onEditFood: (foodId: FoodId) => void;
    footer: string;
}) {
    const { setNodeRef, isOver } = useDroppable({ id: `drop:${meal}` });

    return (
        <div style={{ ...mealPanel, outline: isOver ? "2px solid var(--accent)" : "1px solid var(--card-border)" }}>
            <div style={mealTitle}>{title}</div>
            <div ref={setNodeRef} style={mealDropZone}>
                {entries.length === 0 ? <div style={{ color: "var(--muted)" }}>Drag items here</div> : null}
                {entries.map((e) => (
                    <MealEntryChip
                        key={e.entryId}
                        meal={meal}
                        entry={e}
                        foods={foods}
                        onRemove={() => onRemoveEntry(e.entryId)}
                        onPortionChange={(n) => onPortionChange(e.entryId, n)}
                        onEditFood={() => onEditFood(e.foodId)}
                    />
                ))}
            </div>
            <div style={mealFooter}>
                <div>{footer}</div>
                <button
                    style={clearBtn}
                    onClick={() => {
                        entries.forEach((e) => onRemoveEntry(e.entryId));
                    }}
                    title="Clear all items"
                >
                    Clear
                </button>
            </div>
        </div>
    );
}

export function MealBoard({
    foods,
    meals,
    mealDefs,
    mealTotals,
    onRemoveEntry,
    onPortionChange,
    onEditFood,
}: {
    foods: FoodItem[];
    meals: Record<string, MealEntry[]>;
    mealDefs: MealDefinition[];
    mealTotals: Record<string, { kcal: number; protein: number }>;
    onRemoveEntry: (mealId: string, entryId: string) => void;
    onPortionChange: (mealId: string, entryId: string, portion: number) => void;
    onEditFood: (foodId: FoodId) => void;
}) {
    return (
        <div style={mealGrid}>
            {mealDefs.map((m) => {
                const mealId = String(m.id);
                const panelMeals = meals[mealId] ?? [];
                const panelTotals = mealTotals[mealId] ?? { kcal: 0, protein: 0 };
                return (
                    <MealPanel
                        key={mealId}
                        meal={mealId}
                        title={m.name.toUpperCase()}
                        entries={panelMeals}
                        foods={foods}
                        onRemoveEntry={(id) => onRemoveEntry(mealId, id)}
                        onPortionChange={(id, n) => onPortionChange(mealId, id, n)}
                        onEditFood={onEditFood}
                        footer={`Total: ~${Math.round(panelTotals.kcal)} kcal, ~${Math.round(panelTotals.protein)} g Protein`}
                    />
                );
            })}
        </div>
    );
}

const mealGrid: React.CSSProperties = { display: "grid", gap: 14 };
const mealPanel: React.CSSProperties = {
    borderRadius: 14,
    padding: 12,
    background: "var(--card-bg)",
    border: "1px solid var(--card-border)",
    boxShadow: "0 6px 18px rgba(0,0,0,0.06)",
};

const mealTitle: React.CSSProperties = { fontWeight: 900, fontSize: 18, marginBottom: 10, color: "var(--background)" };

const mealDropZone: React.CSSProperties = { minHeight: 110, display: "flex", flexDirection: "column", gap: 8 };

const mealFooter: React.CSSProperties = {
    marginTop: 10,
    paddingTop: 8,
    borderTop: "1px solid var(--divider)",
    fontWeight: 700,
    color: "var(--muted)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
};

const clearBtn: React.CSSProperties = {
    padding: "6px 10px",
    borderRadius: 8,
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    color: "var(--danger-fg)",
    cursor: "pointer",
    fontWeight: 700,
};

const entryBox: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "1fr 120px 36px",
    gap: 8,
    alignItems: "center",
    border: "1px solid var(--card-border)",
    borderRadius: 12,
    padding: "8px 10px",
    background: "var(--card-bg)",
};

const entryNameBtn: React.CSSProperties = { textAlign: "left", border: "none", background: "transparent", fontWeight: 800, cursor: "pointer", color: "var(--background)" };
const portionInput: React.CSSProperties = { width: 80, padding: 6, borderRadius: 8, border: "1px solid var(--card-border)", color: "var(--background)" };
const removeBtn: React.CSSProperties = { width: 34, height: 34, borderRadius: 10, border: "1px solid #999", background: "black", cursor: "pointer" };
