"use client";

import React, { useState } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FoodId, FoodItem, MealEntry, MealDefinition, MealId } from "@/shared/models";
import { FaTrash } from "react-icons/fa";
import { IoMdArrowDropdown, IoMdArrowDropright } from "react-icons/io";
import styles from "./MealBoard.module.scss";

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
            className={styles.entryBox}
            style={{
                opacity: isDragging ? 0.5 : 1,
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
            }}
        >
            <button
                className={styles.entryNameBtn}
                onClick={onEditFood}
                title="Click to edit food"
                {...listeners}
                {...attributes}
            >
                {food.name}
            </button>

            <div className={styles.portionWrap}>
                <input
                    className={styles.portionInput}
                    type="number"
                    value={displayedPortion}
                    onChange={(e) => handleChange(e.target.value)}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                />
                <span className={styles.unit}>{food.unit}</span>
            </div>

            <button className={styles.removeBtn} onClick={onRemove} title="Remove">
                ✕
            </button>
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
            className={styles.mealPanel}
            style={{
                outline: isOver ? "2px solid var(--accent)" : "1px solid var(--card-border)",
                transform: animatedTransform,
                transition: transition ? `${transition}, box-shadow 160ms ease, opacity 160ms ease` : "box-shadow 160ms ease, opacity 160ms ease",
                opacity: isDragging ? 0.92 : 1,
                boxShadow: isDragging ? "0 18px 45px rgba(0,0,0,0.20)" : undefined,
                zIndex: isDragging ? 50 : "auto",
            }}
        >
            <div className={styles.mealHeader}>
                <div className={styles.mealTitle}>{title}</div>

                <div className={styles.mealHeaderActions}>
                    <button
                        type="button"
                        ref={setActivatorNodeRef}
                        {...attributes}
                        {...listeners}
                        className={styles.mealDragHandle}
                        title="Drag to reorder"
                        aria-label={`Drag to reorder ${title}`}
                    >
                        ⋮⋮
                    </button>
                    <button
                        className={styles.mealCollapseBtn}
                        onClick={onToggleCollapsed}
                        title={collapsed ? "Expand" : "Collapse"}
                    >
                        {collapsed ? <IoMdArrowDropright /> : <IoMdArrowDropdown />}
                    </button>

                    {onRemoveMeal ? (
                        <button className={styles.mealRemoveBtn} onClick={() => onRemoveMeal(mealId)} title="Remove meal">
                            <FaTrash />
                        </button>
                    ) : null}
                </div>
            </div>


            {collapsed ? (
                <div
                    ref={setDropRef}
                    className={`${styles.mealDropZone} ${styles.mealDropZoneCollapsed}`}
                >
                    <div className={styles.collapsedInfo}>
                        {entries.length} item{entries.length === 1 ? "" : "s"} • {footer}
                    </div>

                    <button
                        className={styles.clearBtn}
                        onClick={() => entries.forEach((e) => onRemoveEntry(e.entryId))}
                        title="Clear all items"
                    >
                        Clear
                    </button>
                </div>
            ) : (
                <>
                    <div ref={setDropRef} className={styles.mealDropZone}>
                        {entries.length === 0 ? <div className={styles.emptyHint}>Drag items here</div> : null}
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
                    <div className={styles.mealFooter}>
                        <div>{footer}</div>
                        <button
                            className={styles.clearBtn}
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
            <div className={styles.mealGrid}>
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
        <div className={styles.insertRow}>
            <div className={styles.insertLine} />
            <button type="button" className={styles.insertBtn} onClick={onClick} title="Insert meal panel here" aria-label="Insert meal panel here">
                +
            </button>
            <div className={styles.insertLine} />
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
