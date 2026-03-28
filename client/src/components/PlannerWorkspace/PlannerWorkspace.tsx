"use client";

import { useState } from "react";
import {
    DndContext,
    DragEndEvent,
    DragStartEvent,
    DragOverlay,
    PointerSensor,
    KeyboardSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { MealBoard } from "@/client/src/components/MealBoard/MealBoard";
import { FoodLibrary } from "@/client/src/components/FoodLibrary/FoodLibrary";
import { BottomToolBar } from "@/client/src/components/BottomToolBar/BottomToolBar";
import type { FoodItem, FoodId, MealEntry, Target, MealDefinition, CategoryId, MealId, TargetId } from "@/shared/models";
import styles from "./PlannerWorkspace.module.scss";
import foodStyles from "@/client/src/components/FoodLibrary/FoodLibrary.module.scss";

export default function PlannerWorkspace({
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
    onRenameMeal,
    onReorderMealPanels,
    onInsertMealPanel,
    openAdd,
    openEdit,
    addEntryToMeal,
    moveEntry,
    clearAll,
}: PlannerWorkspaceProps
) {

    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor),
    );

    function onDragStart(ev: DragStartEvent) {
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

                const mealIdByKey = new Map(mealDefs.map((m) => [String(m.id), m.id] as const));
                const ids = mealDefs.map((m) => String(m.id));
                const from = ids.indexOf(fromMealId);
                const to = ids.indexOf(toMealId);
                if (from === -1 || to === -1 || from === to) return;

                const next = ids.slice();
                const [moved] = next.splice(from, 1);
                next.splice(to, 0, moved);

                const nextIds = next
                    .map((k) => mealIdByKey.get(k))
                    .filter(Boolean) as MealId[];
                onReorderMealPanels(nextIds);
                return;
            }

            if (!overId.startsWith("drop:")) return;

            const mealIdByKey = new Map(mealDefs.map((m) => [String(m.id), m.id] as const));

            const toMealKey = overId.slice("drop:".length);
            const toMeal = mealIdByKey.get(toMealKey);
            if (!toMeal) return;

            if (activeId.startsWith("lib:")) {
                const foodId = activeId.slice("lib:".length) as unknown as FoodId;
                addEntryToMeal(toMeal, foodId);
                return;
            }

            if (activeId.startsWith("meal:")) {
                const rest = activeId.slice("meal:".length);
                const i = rest.lastIndexOf(":");
                if (i == -1) return;

                const fromMealKey = rest.slice(0, i);
                const entryId = rest.slice(i + 1);

                const fromMeal = mealIdByKey.get(fromMealKey);
                if (!fromMeal) return;

                moveEntry(fromMeal, toMeal, entryId);
                return;
            }
        } finally {
            setActiveId(null);
        }
    }

    const proteinToColour = (): string => {
        const proteinRatio = weightKg && weightKg > 0 ? totals.protein / weightKg : null;
        if (proteinRatio == null || (proteinRatio <= 0.8 || proteinRatio >= 2.2)) return "var(--danger-fg)";
        if (proteinRatio < 1.0 || proteinRatio > 2.0) return "var(--warning-fg)";
        if (proteinRatio >= 1.0 && proteinRatio <= 2.0) return "var(--healthy-fg)";
        return "var(--danger-fg)";
    }

    const target = targets.find((t) => t.id === dayType) ?? null;
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
        <DndContext
            sensors={sensors}
            onDragEnd={onDragEnd}
            onDragStart={onDragStart}
            onDragCancel={onDragCancel}
        >
            <div className={styles.grid}>
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
                        onRenameMeal={onRenameMeal}
                        onInsertMealPanel={onInsertMealPanel}
                    />

                    <BottomToolBar
                        foods={foods}
                        meals={meals}
                        mealDefs={mealDefs}
                        totals={totals}
                        proteinColor={proteinToColour()}
                        stillNeedKcal={stillNeed}
                        exportDayType={target?.name ?? String(dayType)}
                        onClearAll={clearAll}
                    />
                </div>

                <div>
                    <FoodLibrary onAdd={openAdd} onEdit={openEdit} />
                </div>
            </div>

            {activeId?.startsWith("lib:") ? (
                <DragOverlay dropAnimation={null}>
                    <button className={foodStyles.chip} style={{ cursor: "grabbing" }}>
                        <span className={foodStyles.chipText}>
                            {foods.find((f) => String(f.id) === activeId.slice("lib:".length))?.name ?? ""}
                        </span>
                    </button>
                </DragOverlay>
            ) : null}
        </DndContext>
    );
}

type PlannerWorkspaceProps = {
    foods: FoodItem[];
    meals: Record<MealId, MealEntry[]>;
    mealDefs: MealDefinition[];
    mealTotals: Record<MealId, { kcal: number; protein: number }>;
    totals: { kcal: number; protein: number };
    dayType: TargetId;
    targets: Target[];
    weightKg?: number;
    onRemoveEntry: (mealId: MealId, entryId: string) => void;
    onPortionChange: (mealId: MealId, entryId: string, portion: number) => void;
    onEditFood: (foodId: FoodId) => void;
    onRemoveMeal: (mealId: MealId) => void;
    onRenameMeal: (mealId: MealId, name: string) => void;
    onReorderMealPanels: (nextOrder: MealId[]) => void;
    onInsertMealPanel: (index: number) => void;
    openAdd: (catId: CategoryId) => void;
    openEdit: (food: FoodItem) => void;
    addEntryToMeal: (mealId: MealId, foodId: FoodId) => void;
    moveEntry: (from: MealId, to: MealId, entryId: string) => void;
    clearAll: () => void;
}
