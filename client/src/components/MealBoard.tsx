"use client";

import React, { useEffect, useState } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FoodId, FoodItem, MealEntry, MealDefinition } from "@/shared/models";
import { FaTrash } from "react-icons/fa";
import { IoMdArrowDropdown, IoMdArrowDropright } from "react-icons/io";

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
    onRemoveMeal,
    collapsed,
    onToggleCollapsed,
    footer,
}: {
    meal: string;
    title: string;
    entries: MealEntry[];
    foods: FoodItem[];
    onRemoveEntry: (entryId: string) => void;
    onPortionChange: (entryId: string, n: number) => void;
    onEditFood: (foodId: FoodId) => void;
    onRemoveMeal: (mealId: string) => void;
    collapsed: boolean;
    onToggleCollapsed?: () => void;
    footer: string;
}) {
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop:${meal}` });

    const {
        setNodeRef: setPanelRef,
        setActivatorNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `panel:${meal}` });

    const baseTransform = CSS.Transform.toString(transform);
    const animatedTransform = baseTransform ? `${baseTransform}${isDragging ? " scale(1.02)" : ""}` : undefined;


    return (
        <div
            ref={setPanelRef}
            style={{
                ...mealPanel,
                outline: isOver ? "2px solid var(--accent)" : "1px solid var(--card-border)",
                transform: animatedTransform,
                transition: transition ? `${transition}, box-shadow 160ms ease, opacity 160ms ease` : "box-shadow 160ms ease, opacity 160ms ease",
                opacity: isDragging ? 0.92 : 1,
                boxShadow: isDragging
                    ? "0 18px 45px rgba(0,0,0,0.20)"
                    : mealPanel.boxShadow,
                zIndex: isDragging ? 50 : "auto",
            }}>
            <div style={mealHeader}>
                <div style={mealTitle}>{title}</div>

                <div style={mealHeaderActions}>
                    <button
                        type="button"
                        ref={setActivatorNodeRef}
                        {...attributes}
                        {...listeners}
                        style={mealDragHandle}
                        title="Drag to reorder"
                        aria-label={`Drag to reorder ${title}`}
                    >
                        ⋮⋮
                    </button>
                    <button
                        style={mealCollapseBtn}
                        onClick={onToggleCollapsed}
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        {collapsed ? <IoMdArrowDropright /> : <IoMdArrowDropdown />}
                    </button>

                    {onRemoveMeal ? (
                        <button style={mealRemoveBtn} onClick={() => onRemoveMeal(meal)} title="Remove meal">
                            <FaTrash />
                        </button>
                    ) : null}
                </div>
            </div>


            {collapsed ? (
                <div
                    ref={setDropRef}
                    style={{
                        ...mealDropZone,
                        minHeight: 44,
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 10,
                        padding: "8px 10px",
                        border: "1px dashed var(--divider)",
                        borderRadius: 12,
                    }}
                >
                    <div style={{ color: "var(--muted)", fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis" }}>
                        {entries.length} item{entries.length === 1 ? "" : "s"} • {footer}
                    </div>

                    <button
                        style={clearBtn}
                        onClick={() => entries.forEach((e) => onRemoveEntry(e.entryId))}
                        title="Clear all items"
                    >
                        Clear
                    </button>
                </div>
            ) : (
                <>
                    <div ref={setDropRef} style={mealDropZone}>
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
                </>
            )}
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
    onRemoveMeal,
}: {
    foods: FoodItem[];
    meals: Record<string, MealEntry[]>;
    mealDefs: MealDefinition[];
    mealTotals: Record<string, { kcal: number; protein: number }>;
    onRemoveEntry: (mealId: string, entryId: string) => void;
    onPortionChange: (mealId: string, entryId: string, portion: number) => void;
    onEditFood: (foodId: FoodId) => void;
    onRemoveMeal: (mealId: string) => void;
}) {
    const [collapsedMeals, setCollapsedMeals] = React.useState<Record<string, boolean>>({}); // NEW
    const sortableItems = mealDefs.map((m) => `panel:${String(m.id)}`);

    const toggleCollapsed = (mealId: string) => {
        setCollapsedMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
    };
    return (
        <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
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
                            onRemoveMeal={onRemoveMeal}
                            collapsed={!!collapsedMeals[mealId]}
                            onToggleCollapsed={() => toggleCollapsed(mealId)}
                            footer={`Total: ~${Math.round(panelTotals.kcal)} kcal, ~${Math.round(panelTotals.protein)} g Protein`}
                        />
                    );
                })}
            </div>
        </SortableContext>
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

const mealHeader: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
};

const mealDropZone: React.CSSProperties = { minHeight: 110, display: "flex", flexDirection: "column", gap: 8 };

const mealDragHandle: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 10,
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    color: "var(--muted)",
    cursor: "grab",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    lineHeight: 0,
    touchAction: "none",
};

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

const mealRemoveBtn: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 10,
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    color: "var(--danger-fg)",
    cursor: "pointer",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    lineHeight: 0,
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

const mealCollapseBtn: React.CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: 10,
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    color: "var(--background)",
    cursor: "pointer",
    fontWeight: 900,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
    lineHeight: 0,
};

const mealHeaderActions: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
};

const entryNameBtn: React.CSSProperties = { textAlign: "left", border: "none", background: "transparent", fontWeight: 800, cursor: "pointer", color: "var(--background)" };
const portionInput: React.CSSProperties = { width: 80, padding: 6, borderRadius: 8, border: "1px solid var(--card-border)", color: "var(--background)" };
const removeBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 10, border: "1px solid #999", background: "black", cursor: "pointer" };
