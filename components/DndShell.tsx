"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { MealBoard } from "@/components/MealBoard";
import { FoodLibrary } from "@/components/FoodLibrary";
import { ExportButton } from "@/components/ExportButton";
import type { Category, FoodItem, MealKey } from "@/lib/models";

export default function DndShell({
    foods,
    meals,
    mealTotals,
    totals,
    dayType,
    onRemoveEntry,
    onPortionChange,
    onEditFood,
    openAdd,
    openEdit,
    addEntryToMeal,
    moveEntry,
    clearAll,
}: {
    foods: FoodItem[];
    meals: Record<MealKey, any[]>;
    mealTotals: Record<MealKey, { kcal: number; protein: number }>;
    totals: { kcal: number; protein: number };
    dayType: "FULL" | "HALF" | "REST";
    onRemoveEntry: (meal: MealKey, entryId: string) => void;
    onPortionChange: (meal: MealKey, entryId: string, portion: number) => void;
    onEditFood: (foodId: string) => void;
    openAdd: (cat: Category) => void;
    openEdit: (food: FoodItem) => void;
    addEntryToMeal: (meal: MealKey, foodId: string) => void;
    moveEntry: (from: MealKey, to: MealKey, entryId: string) => void;
    clearAll: () => void;
}) {
    function onDragEnd(ev: DragEndEvent) {
        const activeId = String(ev.active.id);
        const overId = ev.over ? String(ev.over.id) : null;
        if (!overId) return;
        if (!overId.startsWith("drop:")) return;
        const toMeal = overId.split(":")[1] as MealKey;

        if (activeId.startsWith("lib:")) {
            const foodId = activeId.split(":")[1];
            addEntryToMeal(toMeal, foodId);
            return;
        }

        if (activeId.startsWith("meal:")) {
            const parts = activeId.split(":");
            const fromMeal = parts[1] as MealKey;
            const entryId = parts[2];
            moveEntry(fromMeal, toMeal, entryId);
            return;
        }
    }

    return (
        <DndContext onDragEnd={onDragEnd}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, alignItems: "start" }}>
                <div>
                    <MealBoard
                        foods={foods}
                        meals={meals}
                        mealTotals={mealTotals}
                        onRemoveEntry={onRemoveEntry}
                        onPortionChange={onPortionChange}
                        onEditFood={onEditFood}
                    />

                    <div style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{ border: "1px solid var(--card-border)", borderRadius: 14, padding: 14, minWidth: 160, background: "var(--background)" }}>
                            <div style={{ fontWeight: 900 }}>TOTAL</div>
                            <div style={{ fontSize: 26, fontWeight: 900 }}>{Math.round(totals.kcal)} kcal</div>
                            <div style={{ fontWeight: 700 }}>{Math.round(totals.protein)}g Protein</div>
                        </div>

                        <ExportButton foods={foods} meals={meals} totals={totals} dayType={dayType} />
                        <button
                            style={{
                                padding: "10px 14px",
                                borderRadius: 12,
                                border: "1px solid var(--card-border)",
                                background: "var(--card-bg)",
                                fontWeight: 700,
                                color: "var(--danger-fg)",
                                cursor: "pointer",
                            }}
                            onClick={clearAll}
                            title="Clear all meals"
                        >
                            Clear All
                        </button>

                    </div>
                </div>

                <div>
                    <FoodLibrary foods={foods} onAdd={openAdd} onEdit={openEdit} />
                </div>
            </div>
        </DndContext>
    );
}
