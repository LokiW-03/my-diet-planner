"use client";

import React from "react";
import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { MealBoard } from "@/client/src/components/MealBoard";
import { FoodLibrary } from "@/client/src/components/FoodLibrary";
import { ExportButton } from "@/client/src/components/ExportButton";
import type { FoodItem, FoodId, MealEntry, Target, MealDefinition, CategoryId } from "@/shared/models";

export default function DndShell({
    foods,
    meals,
    mealDefs,
    mealTotals,
    totals,
    dayType,
    targets,
    weightKg,
    onRemoveEntry,
    onPortionChange,
    onEditFood,
    onRemoveMeal,
    onReorderMealPanels,
    onInsertMealPanel,
    openAdd,
    openEdit,
    addEntryToMeal,
    moveEntry,
    clearAll,
}: {
    foods: FoodItem[];
    meals: Record<string, MealEntry[]>;
    mealDefs: MealDefinition[];
    mealTotals: Record<string, { kcal: number; protein: number }>;
    totals: { kcal: number; protein: number };
    dayType: string;
    targets: Target[];
    weightKg?: number;
    onRemoveEntry: (mealId: string, entryId: string) => void;
    onPortionChange: (mealId: string, entryId: string, portion: number) => void;
    onEditFood: (foodId: FoodId) => void;
    onRemoveMeal: (mealId: string) => void;
    onReorderMealPanels: (nextOrder: string[]) => void;
    onInsertMealPanel: (index: number) => void;
    openAdd: (catId: CategoryId) => void;
    openEdit: (food: FoodItem) => void;
    addEntryToMeal: (mealId: string, foodId: FoodId) => void;
    moveEntry: (from: string, to: string, entryId: string) => void;
    clearAll: () => void;
}) {

    const [_, setActiveId] = React.useState<string | null>(null);

    function onDragStart(ev: any) {
        setActiveId(String(ev.active?.id ?? null));
    }

    function onDragCancel() {
        setActiveId(null);
    }
    function onDragEnd(ev: DragEndEvent) {
        try {
            const activeId = String(ev.active.id);
            const overId = ev.over ? String(ev.over.id) : null;

            if (!overId) return;

            if (activeId.startsWith("panel:")) {
                const fromMealId = activeId.slice("panel:".length);
                const toMealId = overId.startsWith("panel:")
                    ? overId.slice("panel:".length)
                    : overId.startsWith("drop:")
                        ? overId.slice("drop:".length)
                        : "";

                if (!fromMealId || !toMealId || fromMealId === toMealId) return;

                const ids = mealDefs.map((m) => String(m.id));
                const from = ids.indexOf(fromMealId);
                const to = ids.indexOf(toMealId);
                if (from === -1 || to === -1 || from === to) return;

                const next = ids.slice();
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);

                onReorderMealPanels(next);
                return;
            }

            if (!overId.startsWith("drop:")) return;

            const toMeal = overId.slice("drop:".length);

            if (activeId.startsWith("lib:")) {
                const foodId = activeId.slice("lib:".length) as unknown as FoodId;
                addEntryToMeal(toMeal, foodId);
                return;
            }

            if (activeId.startsWith("meal:")) {
                const rest = activeId.slice("meal:".length);
                const i = rest.indexOf(":");
                if (i === -1) return;

                const fromMeal = rest.slice(0, i);
                const entryId = rest.slice(i + 1);

                moveEntry(fromMeal, toMeal, entryId);
                return;
            }
        } finally {
            setActiveId(null);
        }
    }

    const proteinToColour = () => {
        const proteinRatio = weightKg && weightKg > 0 ? totals.protein / weightKg : null;
        if (proteinRatio == null || (proteinRatio <= 0.8 || proteinRatio >= 2.2)) return "var(--danger-fg)";
        if (proteinRatio < 1.0 || proteinRatio > 2.0) return "var(--warning-fg)";
        if (proteinRatio >= 1.0 && proteinRatio <= 2.0) return "var(--healthy-fg)";
    }

    const target = targets.find((t) => String(t.id) === dayType) ?? null;
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
        <DndContext onDragEnd={onDragEnd} onDragStart={onDragStart} onDragCancel={onDragCancel}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, alignItems: "start" }}>
                <div>
                    <MealBoard
                        foods={foods}
                        meals={meals}
                        mealDefs={mealDefs}
                        mealTotals={mealTotals}
                        onRemoveEntry={onRemoveEntry}
                        onPortionChange={onPortionChange}
                        onEditFood={onEditFood}
                        onRemoveMeal={onRemoveMeal}
                        onInsertMealPanel={onInsertMealPanel}
                    />

                    <div style={{ marginTop: 14, display: "flex", gap: 14, alignItems: "center" }}>
                        <div style={{ border: "1px solid var(--card-border)", borderRadius: 14, padding: 14, minWidth: 160, background: "var(--background)" }}>
                            <div style={{ fontWeight: 900 }}>TOTAL</div>
                            <div style={{ fontSize: 26, fontWeight: 900 }}>{Math.round(totals.kcal)} kcal</div>
                            <div style={{ fontWeight: 700, color: proteinToColour() }}>{Math.round(totals.protein)}g Protein</div>
                        </div>

                        <div style={{ border: "1px solid var(--card-border)", borderRadius: 14, padding: 14, minWidth: 160, background: "var(--background)", textAlign: "center" }}>
                            <div style={{ fontWeight: 900, color: "var(--chip-border)" }}>STILL NEED</div>
                            <div style={{ fontSize: 26, fontWeight: 900 }}>{stillNeed} kcal</div>
                            <div style={{ fontWeight: 700, color: "var(--chip-border)" }}>to meet target</div>
                        </div>

                        <ExportButton foods={foods} meals={meals} totals={totals} dayType={target?.name ?? dayType} />
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
