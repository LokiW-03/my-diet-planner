"use client";

import React, { useState } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FoodId, FoodItem, MealEntry, MealDefinition, MealId } from "@/shared/models";
import { FaTrash } from "react-icons/fa";
import { IoMdArrowDropdown, IoMdArrowDropright } from "react-icons/io";

function MealEntryChip({
    mealId,
    entry,
    foods,
    onRemove,
    onPortionChange,
    onEditFood,
}: mealEntryProps
) {
    const food = foods.find((f) => f.id === entry.foodId);
    const id = `meal:${mealId}:${entry.entryId}`;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    const [portionText, setPortionText] = useState<string | null>(null);

    if (!food) return null;

    const displayedPortion = portionText ?? String(entry.portion);

    function handleFocus() {
        setPortionText(String(entry.portion));
    }

    function handleChange(v: string) {
        setPortionText(v);
        const n = Number(v);
        if (v !== "" && Number.isFinite(n)) {
            onPortionChange(Math.trunc(n));
        }
    }

    function handleBlur() {
        if (portionText == null) return;

        if (portionText === "" || !Number.isFinite(Number(portionText))) {
            setPortionText(null);
            return;
        }

        onPortionChange(Math.trunc(Number(portionText)));
        setPortionText(null);
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
                    value={displayedPortion}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
                <span style={{ fontWeight: 700 }}>{food.unit}</span>
            </div>

            <button style={removeBtn} onClick={onRemove} title="Remove">✕</button>
        </div>
    );
}

function MealPanel({
    mealId,
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
}: mealPanelProps
) {
    const mealKey = String(mealId)
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop:${mealKey}` });

    const {
        setNodeRef: setPanelRef,
        setActivatorNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `panel:${mealKey}` });

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
                        <button style={mealRemoveBtn} onClick={() => onRemoveMeal(mealId)} title="Remove meal">
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
                                mealId={mealId}
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
    onInsertMealPanel,
}: mealBoardProps
) {
    const [collapsedMeals, setCollapsedMeals] = React.useState<Record<string, boolean>>({}); // NEW
    const sortableItems = mealDefs.map((m) => `panel:${String(m.id)}`);

    const toggleCollapsed = (mealId: string) => {
        setCollapsedMeals((prev) => ({ ...prev, [mealId]: !prev[mealId] }));
    };
    return (
        <SortableContext items={sortableItems} strategy={rectSortingStrategy}>
            <div style={mealGrid}>
                {mealDefs.map((m, idx) => {
                    const mealKey = String(m.id);

                    const panelMeals = meals[mealKey] ?? [];
                    const panelTotals = mealTotals[mealKey] ?? { kcal: 0, protein: 0 };
                    return (
                        <React.Fragment key={m.id}>
                            <MealPanel
                                key={m.id}
                                mealId={m.id}
                                title={m.name.toUpperCase()}
                                entries={panelMeals}
                                foods={foods}
                                onRemoveEntry={(id) => onRemoveEntry(m.id, id)}
                                onPortionChange={(id, n) => onPortionChange(m.id, id, n)}
                                onEditFood={onEditFood}
                                onRemoveMeal={onRemoveMeal}
                                collapsed={!!collapsedMeals[mealKey]}
                                onToggleCollapsed={() => toggleCollapsed(mealKey)}
                                footer={`Total: ~${Math.round(panelTotals.kcal)} kcal, ~${Math.round(panelTotals.protein)} g Protein`}
                            />
                            <InsertRow onClick={() => onInsertMealPanel(idx + 1)} />
                        </React.Fragment>
                    );
                })}
            </div>
        </SortableContext>
    );
}

function InsertRow({ onClick }: { onClick: () => void }) {
    return (
        <div style={insertRow}>
            <div style={insertLine} />
            <button type="button" style={insertBtn} onClick={onClick} title="Insert meal panel here" aria-label="Insert meal panel here">
                +
            </button>
            <div style={insertLine} />
        </div>
    );
}

type mealEntryProps = {
    mealId: MealId;
    entry: MealEntry;
    foods: FoodItem[];
    onRemove: () => void;
    onPortionChange: (n: number) => void;
    onEditFood: () => void;
}

type mealPanelProps = {
    mealId: MealId;
    title: string;
    entries: MealEntry[];
    foods: FoodItem[];
    onRemoveEntry: (entryId: string) => void;
    onPortionChange: (entryId: string, n: number) => void;
    onEditFood: (foodId: FoodId) => void;
    onRemoveMeal: (mealId: MealId) => void;
    collapsed: boolean;
    onToggleCollapsed?: () => void;
    footer: string;
}

type mealBoardProps = {
    foods: FoodItem[];
    meals: Record<string, MealEntry[]>;
    mealDefs: MealDefinition[];
    mealTotals: Record<string, { kcal: number; protein: number }>;
    onRemoveEntry: (mealId: MealId, entryId: string) => void;
    onPortionChange: (mealId: MealId, entryId: string, portion: number) => void;
    onEditFood: (foodId: FoodId) => void;
    onRemoveMeal: (mealId: MealId) => void;
    onInsertMealPanel: (index: number) => void;
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

const insertRow: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "6px 4px",
};

const insertLine: React.CSSProperties = {
    flex: 1,
    height: 0,
    borderTop: "1px dashed var(--divider)",
    color: "var(--divider)",
    opacity: 0.7,
};

const insertBtn: React.CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: 12,
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
    opacity: 0.7,
};

const entryNameBtn: React.CSSProperties = { textAlign: "left", border: "none", background: "transparent", fontWeight: 800, cursor: "pointer", color: "var(--background)" };
const portionInput: React.CSSProperties = { width: 80, padding: 6, borderRadius: 8, border: "1px solid var(--card-border)", color: "var(--background)" };
const removeBtn: React.CSSProperties = { width: 30, height: 30, borderRadius: 10, border: "1px solid #999", background: "black", cursor: "pointer" };
