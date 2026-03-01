"use client";

import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { MealBoard } from "@/client/src/components/MealBoard";
import { FoodLibrary } from "@/client/src/components/FoodLibrary";
import { ExportButton } from "@/client/src/components/ExportButton";
import type { CategoryId, FoodCategory, FoodItem, FoodId, MealEntry } from "@/shared/models";
import type { MealKey, TargetName } from "@/shared/defaults";
import { TARGETS_BY_NAME } from "@/shared/defaults";

export default function DndShell({
    foods,
    meals,
    mealTotals,
    totals,
    dayType,
    weightKg,
    onRemoveEntry,
    onPortionChange,
    onEditFood,
    openAdd,
    openEdit,
    addEntryToMeal,
    moveEntry,
    clearAll,
}: {
    categories: FoodCategory[];
    foods: FoodItem[];
    meals: Record<MealKey, MealEntry[]>;
    mealTotals: Record<MealKey, { kcal: number; protein: number }>;
    totals: { kcal: number; protein: number };
    dayType: TargetName;
    weightKg?: number;
    onRemoveEntry: (meal: MealKey, entryId: string) => void;
    onPortionChange: (meal: MealKey, entryId: string, portion: number) => void;
    onEditFood: (foodId: FoodId) => void;
    openAdd: (catId: CategoryId) => void;
    openEdit: (food: FoodItem) => void;
    addEntryToMeal: (meal: MealKey, foodId: FoodId) => void;
    moveEntry: (from: MealKey, to: MealKey, entryId: string) => void;
    clearAll: () => void;
}) {
    function onDragEnd(ev: DragEndEvent) {
        const activeId = String(ev.active.id);
        const overId = ev.over ? String(ev.over.id) : null;
        if (!overId) return;
        if (!overId.startsWith("drop:")) return;

        const toMeal = overId.slice("drop:".length) as MealKey;

        if (activeId.startsWith("lib:")) {
            const foodId = activeId.slice("lib:".length) as unknown as FoodId;
            addEntryToMeal(toMeal, foodId);
            return;
        }

        if (activeId.startsWith("meal:")) {
            const rest = activeId.slice("meal:".length);
            const i = rest.indexOf(":");
            if (i === -1) return;

            const fromMeal = rest.slice(0, i) as MealKey;
            const entryId = rest.slice(i + 1);

            moveEntry(fromMeal, toMeal, entryId);
            return;
        }
    }

    const proteinRatio = weightKg && weightKg > 0 ? totals.protein / weightKg : null;
    const proteinGood = proteinRatio === null || (proteinRatio >= 0.8 && proteinRatio <= 2.2);

    const target = TARGETS_BY_NAME[dayType];
    const kcal = Math.round(totals.kcal);
    let stillNeed = 0;
    if (!target) {
        stillNeed = 0;
    } else if (kcal < target.minKcal) {
        stillNeed = Math.max(0, Math.round(target.minKcal - kcal));
    } else if (kcal > target.maxKcal) {
        stillNeed = Math.round(target.maxKcal - kcal);
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
                            <div style={{ fontWeight: 700, color: proteinGood ? undefined : "var(--danger-fg)" }}>{Math.round(totals.protein)}g Protein</div>
                        </div>

                        <div style={{ border: "1px solid var(--card-border)", borderRadius: 14, padding: 14, minWidth: 160, background: "var(--background)", textAlign: "center" }}>
                            <div style={{ fontWeight: 900, color: "var(--chip-border)" }}>STILL NEED</div>
                            <div style={{ fontSize: 26, fontWeight: 900 }}>{stillNeed} kcal</div>
                            <div style={{ fontWeight: 700, color: "var(--chip-border)" }}>to meet target</div>
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
                    <FoodLibrary onAdd={openAdd} onEdit={openEdit} />
                </div>
            </div>
        </DndContext>
    );
}
