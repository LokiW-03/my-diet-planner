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
import type {
    FoodItem,
    FoodId,
    MealEntry,
    Target,
    MealDefinition,
    CategoryId,
    MealId,
    TargetId,
    FoodCategory
} from "@/shared/models";
import { MealBoard } from "@/client/src/components/MealBoard/MealBoard";
import { FoodLibrary } from "@/client/src/components/FoodLibrary/FoodLibrary";
import { BottomToolBar } from "@/client/src/components/BottomToolBar/BottomToolBar";
import { getVisibleCategories } from "@/client/src/utils/getVisibleCategories";

import styles from "./PlannerWorkspace.module.scss";
import foodStyles from "@/client/src/components/FoodLibrary/FoodLibrary.module.scss";

export default function PlannerWorkspace({
    foods,
    meals,
    mealDefs,
    mealTotals,
    categories,
    totals,
    dayType,
    targets,
    weightKg,
    mealBoardActions,
    foodLibraryActions,
    dndActions,
    clearAllMeals,
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
            handlePlannerDragEnd(ev, {
                foods,
                categories,
                mealDefs,
                onChangeFoodCategory: foodLibraryActions.changeFoodCategory,
                onReorderCategories: dndActions.reorderCategories,
                onReorderMealPanels: dndActions.reorderMealPanels,
                addEntryToMeal: dndActions.addEntryToMeal,
                moveEntry: dndActions.moveEntry,
            });
        } finally {
            setActiveId(null);
        }
    }

    const { target, stillNeedKcal } = getTargetAndStillNeed(
        targets,
        dayType,
        totals.kcal,
    );

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
                        onRemoveEntry={mealBoardActions.removeEntry}
                        onPortionChange={mealBoardActions.setPortion}
                        onEditFood={mealBoardActions.editFood}
                        onRemoveMeal={mealBoardActions.removeMeal}
                        onRenameMeal={mealBoardActions.renameMeal}
                        onInsertMealPanel={mealBoardActions.insertMealPanel}
                    />

                    <BottomToolBar
                        foods={foods}
                        meals={meals}
                        mealDefs={mealDefs}
                        totals={totals}
                        proteinColor={getProteinColor(totals, weightKg)}
                        stillNeedKcal={stillNeedKcal}
                        exportDayType={target?.name ?? String(dayType)}
                        onClearAll={clearAllMeals}
                    />
                </div>

                <div>
                    <FoodLibrary
                        foods={foods}
                        categories={categories}
                        onAdd={foodLibraryActions.openAdd}
                        onEdit={foodLibraryActions.openEdit}
                        onRenameCategory={foodLibraryActions.renameCategory}
                        onAddCategory={foodLibraryActions.addCategory}
                        onRemoveCategory={foodLibraryActions.removeCategory}
                    />
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

function handlePlannerDragEnd(ev: DragEndEvent, ctx: DragContext) {
    const {
        foods,
        categories,
        mealDefs,
        onChangeFoodCategory,
        onReorderCategories,
        onReorderMealPanels,
        addEntryToMeal,
        moveEntry,
    } = ctx;

    const activeId = String(ev.active.id);
    const overId = ev.over ? String(ev.over.id) : null;

    if (!overId) return;

    if (activeId.startsWith("lib:") && overId.startsWith("drop:cat:")) {
        const foodId = activeId.slice("lib:".length) as unknown as FoodId;
        const toCatId = overId.slice("drop:cat:".length) as unknown as CategoryId;
        onChangeFoodCategory(foodId, toCatId);
        return;
    }

    if (activeId.startsWith("cat:")) {
        const fromCatId = activeId.slice("cat:".length) as unknown as CategoryId;
        const toCatId = overId.startsWith("cat:")
            ? (overId.slice("cat:".length) as unknown as CategoryId)
            : overId.startsWith("drop:cat:")
                ? (overId.slice("drop:cat:".length) as unknown as CategoryId)
                : "";

        if (!fromCatId || !toCatId || fromCatId === toCatId) return;

        const visibleCategoryIds = getVisibleCategories(categories, foods).map(
            (c) => c.id,
        );

        const ids = visibleCategoryIds.map((id) => String(id));
        const from = ids.indexOf(String(fromCatId));
        const to = ids.indexOf(String(toCatId));
        if (from === -1 || to === -1 || from === to) return;

        const next = ids.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);

        const nextIds = next.map((k) => k as unknown as CategoryId);
        onReorderCategories(nextIds);
        return;
    }

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
    }
}

function getProteinColor(
    totals: { kcal: number; protein: number },
    weightKg?: number,
): string {
    const proteinRatio = weightKg && weightKg > 0 ? totals.protein / weightKg : null;
    if (proteinRatio == null || proteinRatio <= 0.8 || proteinRatio >= 2.2) {
        return "var(--danger-fg)";
    }
    if (proteinRatio < 1.0 || proteinRatio > 2.0) {
        return "var(--warning-fg)";
    }
    if (proteinRatio >= 1.0 && proteinRatio <= 2.0) {
        return "var(--healthy-fg)";
    }
    return "var(--danger-fg)";
}

function getTargetAndStillNeed(
    targets: Target[],
    dayType: TargetId,
    totalKcal: number,
): { target: Target | null; stillNeedKcal: number } {
    const target = targets.find((t) => t.id === dayType) ?? null;
    const kcal = Math.round(totalKcal);

    if (!target) return { target: null, stillNeedKcal: 0 };

    if (kcal < target.minKcal) {
        return {
            target,
            stillNeedKcal: Math.max(0, Math.round(target.minKcal - kcal)),
        };
    }
    if (kcal > target.maxKcal) {
        return {
            target,
            stillNeedKcal: Math.round(target.maxKcal - kcal),
        };
    }

    return { target, stillNeedKcal: 0 };
}

type PlannerWorkspaceProps = {
    foods: FoodItem[];
    meals: Record<MealId, MealEntry[]>;
    mealDefs: MealDefinition[];
    mealTotals: Record<MealId, { kcal: number; protein: number }>;
    categories: Record<CategoryId, FoodCategory>;
    totals: { kcal: number; protein: number };
    dayType: TargetId;
    targets: Target[];
    weightKg?: number;
    mealBoardActions: {
        removeEntry: (mealId: MealId, entryId: string) => void;
        setPortion: (mealId: MealId, entryId: string, portion: number) => void;
        editFood: (foodId: FoodId) => void;
        removeMeal: (mealId: MealId) => void;
        renameMeal: (mealId: MealId, name: string) => void;
        insertMealPanel: (index: number) => MealId | undefined;
    };
    foodLibraryActions: {
        openAdd: (catId: CategoryId) => void;
        openEdit: (food: FoodItem) => void;
        renameCategory: (categoryId: CategoryId, name: string) => void;
        addCategory: (category: Omit<FoodCategory, "id">) => CategoryId;
        removeCategory: (categoryId: CategoryId) => void;
        changeFoodCategory: (foodId: FoodId, categoryId: CategoryId) => void;
    };
    dndActions: {
        reorderMealPanels: (nextOrder: MealId[]) => void;
        reorderCategories: (nextOrder: CategoryId[]) => void;
        addEntryToMeal: (mealId: MealId, foodId: FoodId) => void;
        moveEntry: (from: MealId, to: MealId, entryId: string) => void;
    };
    clearAllMeals: () => void;
}

type DragContext = {
    foods: FoodItem[];
    categories: Record<CategoryId, FoodCategory>;
    mealDefs: MealDefinition[];
    onChangeFoodCategory: (foodId: FoodId, categoryId: CategoryId) => void;
    onReorderCategories: (nextOrder: CategoryId[]) => void;
    onReorderMealPanels: (nextOrder: MealId[]) => void;
    addEntryToMeal: (mealId: MealId, foodId: FoodId) => void;
    moveEntry: (from: MealId, to: MealId, entryId: string) => void;
};
