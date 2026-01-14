"use client";

import { useDroppable, useDraggable } from "@dnd-kit/core";
import type { FoodItem, MealEntry, MealKey } from "@/lib/models";

function MealEntryChip({
    meal,
    entry,
    foods,
    onRemove,
    onPortionChange,
    onEditFood,
}: {
    meal: MealKey;
    entry: MealEntry;
    foods: FoodItem[];
    onRemove: () => void;
    onPortionChange: (n: number) => void;
    onEditFood: () => void;
}) {
    const food = foods.find((f) => f.id === entry.foodId);
    const id = `meal:${meal}:${entry.entryId}`;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    if (!food) return null;

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={{
                ...entryBox,
                opacity: isDragging ? 0.5 : 1,
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
            }}
        >
            <button style={entryNameBtn} onClick={onEditFood} title="Click to edit food">
                {food.name}
            </button>

            <div style={{ display: "flex", gap: 6, alignItems: "center", color: "var(--background)" }}>
                <input
                    style={portionInput}
                    type="number"
                    value={entry.portion}
                    onChange={(e) => onPortionChange(Number(e.target.value))}
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
    meal: MealKey;
    title: string;
    entries: MealEntry[];
    foods: FoodItem[];
    onRemoveEntry: (entryId: string) => void;
    onPortionChange: (entryId: string, n: number) => void;
    onEditFood: (foodId: string) => void;
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
            <div style={mealFooter}>{footer}</div>
        </div>
    );
}

export function MealBoard({
    foods,
    meals,
    mealTotals,
    onRemoveEntry,
    onPortionChange,
    onEditFood,
}: {
    foods: FoodItem[];
    meals: Record<MealKey, MealEntry[]>;
    mealTotals: Record<MealKey, { kcal: number; protein: number }>;
    onRemoveEntry: (meal: MealKey, entryId: string) => void;
    onPortionChange: (meal: MealKey, entryId: string, portion: number) => void;
    onEditFood: (foodId: string) => void;
}) {
    return (
        <div style={mealGrid}>
            <MealPanel
                meal="breakfast"
                title="BREAKFAST"
                entries={meals.breakfast}
                foods={foods}
                onRemoveEntry={(id) => onRemoveEntry("breakfast", id)}
                onPortionChange={(id, n) => onPortionChange("breakfast", id, n)}
                onEditFood={onEditFood}
                footer={`Total: ~${Math.round(mealTotals.breakfast.kcal)} kcal, ~${Math.round(mealTotals.breakfast.protein)} g Protein`}
            />
            <MealPanel
                meal="lunch"
                title="LUNCH"
                entries={meals.lunch}
                foods={foods}
                onRemoveEntry={(id) => onRemoveEntry("lunch", id)}
                onPortionChange={(id, n) => onPortionChange("lunch", id, n)}
                onEditFood={onEditFood}
                footer={`Total: ~${Math.round(mealTotals.lunch.kcal)} kcal, ~${Math.round(mealTotals.lunch.protein)} g Protein`}
            />
            <MealPanel
                meal="postworkout"
                title="POST-WORKOUT"
                entries={meals.postworkout}
                foods={foods}
                onRemoveEntry={(id) => onRemoveEntry("postworkout", id)}
                onPortionChange={(id, n) => onPortionChange("postworkout", id, n)}
                onEditFood={onEditFood}
                footer={`Total: ~${Math.round(mealTotals.postworkout.kcal)} kcal, ~${Math.round(mealTotals.postworkout.protein)} g Protein`}
            />
            <MealPanel
                meal="dinner"
                title="DINNER"
                entries={meals.dinner}
                foods={foods}
                onRemoveEntry={(id) => onRemoveEntry("dinner", id)}
                onPortionChange={(id, n) => onPortionChange("dinner", id, n)}
                onEditFood={onEditFood}
                footer={`Total: ~${Math.round(mealTotals.dinner.kcal)} kcal, ~${Math.round(mealTotals.dinner.protein)} g Protein`}
            />
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

const mealFooter: React.CSSProperties = { marginTop: 10, paddingTop: 8, borderTop: "1px solid var(--divider)", fontWeight: 700, color: "var(--muted)" };

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
