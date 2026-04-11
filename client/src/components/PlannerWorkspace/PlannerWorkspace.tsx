"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
    DndContext,
    closestCenter,
    pointerWithin,
    type CollisionDetection,
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
    FoodCategory,
    CategoryFolder,
    FolderId,
} from "@/shared/models";
import { MealBoard } from "@/client/src/components/MealBoard/MealBoard";
import { FoodLibrary } from "@/client/src/components/FoodLibrary/FoodLibrary";
import { BottomToolBar } from "@/client/src/components/BottomToolBar/BottomToolBar";
import { getFoodLibraryGroups } from "@/client/src/utils/getFoodLibraryGroups";

import styles from "./PlannerWorkspace.module.scss";
import chipStyles from "@/client/src/components/FoodLibrary/CategoryRow/CategoryRow.module.scss";
import mealStyles from "@/client/src/components/MealBoard/MealBoard.module.scss";

export default function PlannerWorkspace({
    foods,
    meals,
    mealDefs,
    mealTotals,
    folders,
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
    const [collapsedFolders, setCollapsedFolders] = useState<Record<string, boolean>>({});

    const toggleCollapsedFolder = (folderIdKey: string) => {
        setCollapsedFolders((prev) => ({ ...prev, [folderIdKey]: !prev[folderIdKey] }));
    };

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 8 },
        }),
        useSensor(KeyboardSensor),
    );

    const collisionDetection: CollisionDetection = useCallback((args) => {
        const activeKey = String(args.active.id);
        const hits = pointerWithin(args);
        if (hits.length > 0) {
            if (activeKey.startsWith("folder:")) {
                const folderHits = hits.filter((h) => String(h.id).startsWith("folder:"));
                if (folderHits.length > 0) return folderHits;
            }

            // When dragging anything other than a folder, avoid resolving the collision
            // to the folder's sortable container when a more specific target exists.
            const nonFolderHits = hits.filter((h) => !String(h.id).startsWith("folder:"));
            if (nonFolderHits.length > 0) return nonFolderHits;

            return hits;
        }
        return closestCenter(args);
    }, []);

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
                folders,
                categories,
                collapsedFolders,
                mealDefs,
                onChangeFoodCategory: foodLibraryActions.changeFoodCategory,
                onReorderCategories: dndActions.reorderCategories,
                onReorderFolders: dndActions.reorderFolders,
                onSetCategoryFolder: foodLibraryActions.setCategoryFolder,
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

    useEffect(() => {
        if (!activeId?.startsWith("lib:")) return;

        const onWheel = (ev: WheelEvent) => {
            if (ev.ctrlKey) return;

            const scrollEl = document.querySelector('[data-foodlib-scroll="true"]') as HTMLElement | null;
            if (!scrollEl) return;

            const rect = scrollEl.getBoundingClientRect();
            const x = ev.clientX;
            const y = ev.clientY;
            const isInside = x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
            if (!isInside) return;

            const canScroll = scrollEl.scrollHeight > scrollEl.clientHeight;
            if (!canScroll) return;

            ev.preventDefault();
            ev.stopPropagation();
            scrollEl.scrollTop += ev.deltaY;
        };

        window.addEventListener("wheel", onWheel, { capture: true, passive: false });
        return () => window.removeEventListener("wheel", onWheel, true);
    }, [activeId]);

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
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

                <div className={styles.foodCol}>
                    <FoodLibrary
                        foods={foods}
                        folders={folders}
                        categories={categories}
                        mealDefs={mealDefs}
                        onAdd={foodLibraryActions.openAdd}
                        onEdit={foodLibraryActions.openEdit}
                        onRenameCategory={foodLibraryActions.renameCategory}
                        onAddCategory={foodLibraryActions.addCategory}
                        onRemoveCategory={foodLibraryActions.removeCategory}
                        onRenameFolder={foodLibraryActions.renameFolder}
                        onAddFolder={(folder) => {
                            const id = foodLibraryActions.addFolder(folder);
                            setCollapsedFolders((prev) => ({ ...prev, [String(id)]: true }));
                            return id;
                        }}
                        onRemoveFolder={(folderId) => {
                            foodLibraryActions.removeFolder(folderId);
                            setCollapsedFolders((prev) => {
                                const next = { ...prev };
                                delete next[String(folderId)];
                                return next;
                            });
                        }}
                        collapsedFolders={collapsedFolders}
                        onToggleFolderCollapse={(folderId) =>
                            toggleCollapsedFolder(String(folderId))
                        }
                        onChangeFoodCategory={foodLibraryActions.changeFoodCategory}
                        onAddEntryToMeal={dndActions.addEntryToMeal}
                        onRemoveFood={foodLibraryActions.removeFoodAndEntries}
                    />
                </div>
            </div>

            {activeId?.startsWith("lib:") || activeId?.startsWith("meal:") ? (
                <DragOverlay dropAnimation={null} zIndex={9999}>
                    {renderDragOverlayContent(activeId, { foods, meals, mealDefs })}
                </DragOverlay>
            ) : null}
        </DndContext>
    );
}

function renderDragOverlayContent(
    activeId: string,
    ctx: {
        foods: FoodItem[];
        meals: Record<MealId, MealEntry[]>;
        mealDefs: MealDefinition[];
    },
): ReactNode {
    const { foods, meals, mealDefs } = ctx;

    if (activeId.startsWith("lib:")) {
        const foodIdKey = activeId.slice("lib:".length);
        const name = foods.find((f) => String(f.id) === foodIdKey)?.name ?? "";

        return (
            <button className={chipStyles.chip} style={{ cursor: "grabbing" }}>
                <span className={chipStyles.chipText}>{name}</span>
            </button>
        );
    }

    if (activeId.startsWith("meal:")) {
        const rest = activeId.slice("meal:".length);
        const i = rest.lastIndexOf(":");
        if (i === -1) return null;

        const mealKey = rest.slice(0, i);
        const entryId = rest.slice(i + 1);

        const mealId = mealDefs.find((m) => String(m.id) === mealKey)?.id;
        const entry = mealId
            ? (meals[mealId] ?? []).find((e) => e.entryId === entryId)
            : null;
        const food = entry ? foods.find((f) => f.id === entry.foodId) : null;

        if (!entry || !food) return null;

        return (
            <div className={mealStyles.entryBox} style={{ cursor: "grabbing" }}>
                <div className={mealStyles.entryNameBtn}>{food.name}</div>
                <div className={mealStyles.portionWrap}>
                    <span>{entry.portion}</span>
                    <span className={mealStyles.unit}>{food.unit}</span>
                </div>
                <div />
            </div>
        );
    }

    return null;
}

function handlePlannerDragEnd(ev: DragEndEvent, ctx: DragContext) {
    const {
        foods,
        folders,
        categories,
        collapsedFolders,
        mealDefs,
        onChangeFoodCategory,
        onReorderCategories,
        onReorderFolders,
        onSetCategoryFolder,
        onReorderMealPanels,
        addEntryToMeal,
        moveEntry,
    } = ctx;

    const activeId = String(ev.active.id);
    const overId = ev.over ? String(ev.over.id) : null;

    if (!overId) return;

    if (activeId.startsWith("folder:")) {
        const fromFolderId = activeId.slice("folder:".length) as unknown as FolderId;

        const toFolderId = overId.startsWith("folder:")
            ? (overId.slice("folder:".length) as unknown as FolderId)
            : overId.startsWith("drop:folder:")
                ? (overId.slice("drop:folder:".length) as unknown as FolderId)
                : null;

        if (!toFolderId || fromFolderId === toFolderId) return;

        const visibleFolderIds = Object.values(folders)
            .filter((f) => f.enabled)
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((f) => f.id);

        const ids = visibleFolderIds.map((id) => String(id));
        const from = ids.indexOf(String(fromFolderId));
        const to = ids.indexOf(String(toFolderId));
        if (from === -1 || to === -1 || from === to) return;

        const next = ids.slice();
        const [moved] = next.splice(from, 1);
        next.splice(to, 0, moved);

        const nextIds = next.map((k) => k as unknown as FolderId);
        onReorderFolders(nextIds);
        return;
    }

    if (activeId.startsWith("lib:") && overId.startsWith("drop:cat:")) {
        const foodId = activeId.slice("lib:".length) as unknown as FoodId;
        const toCatId = overId.slice("drop:cat:".length) as unknown as CategoryId;
        onChangeFoodCategory(foodId, toCatId);
        return;
    }

    if (activeId.startsWith("cat:")) {
        const fromCatId = activeId.slice("cat:".length) as unknown as CategoryId;
        const fromFolderId = categories[fromCatId]?.folderId ?? null;

        if (overId.startsWith("drop:folder:")) {
            const folderId = overId.slice("drop:folder:".length) as unknown as FolderId;
            onSetCategoryFolder(fromCatId, folderId);
            return;
        }

        if (overId.startsWith("folder:")) {
            const folderId = overId.slice("folder:".length) as unknown as FolderId;
            onSetCategoryFolder(fromCatId, folderId);
            return;
        }

        if (overId === "drop:unfiled") {
            onSetCategoryFolder(fromCatId, null);
            return;
        }

        const toCatId = overId.startsWith("cat:")
            ? (overId.slice("cat:".length) as unknown as CategoryId)
            : overId.startsWith("drop:cat:")
                ? (overId.slice("drop:cat:".length) as unknown as CategoryId)
                : "";

        if (!fromCatId || !toCatId || fromCatId === toCatId) return;

        const toFolderId = categories[toCatId]?.folderId ?? null;
        if (toFolderId !== fromFolderId) {
            onSetCategoryFolder(fromCatId, toFolderId);
        }

        const visibleCategoryIds = getFoodLibraryGroups(categories, foods, folders)
            .orderedCategoryIds
            .filter((id) => {
                const folderId = categories[id]?.folderId;
                if (!folderId) return true;
                return !collapsedFolders[String(folderId)];
            });

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
    folders: Record<FolderId, CategoryFolder>;
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
        addFolder: (folder: Omit<CategoryFolder, "id">) => FolderId;
        removeFolder: (folderId: FolderId) => void;
        renameFolder: (folderId: FolderId, name: string) => void;
        setCategoryFolder: (categoryId: CategoryId, folderId: FolderId | null) => void;
        changeFoodCategory: (foodId: FoodId, categoryId: CategoryId) => void;
        removeFoodAndEntries: (foodId: FoodId) => void;
    };
    dndActions: {
        reorderMealPanels: (nextOrder: MealId[]) => void;
        reorderCategories: (nextOrder: CategoryId[]) => void;
        reorderFolders: (nextOrder: FolderId[]) => void;
        addEntryToMeal: (mealId: MealId, foodId: FoodId) => void;
        moveEntry: (from: MealId, to: MealId, entryId: string) => void;
    };
    clearAllMeals: () => void;
}

type DragContext = {
    foods: FoodItem[];
    folders: Record<FolderId, CategoryFolder>;
    categories: Record<CategoryId, FoodCategory>;
    collapsedFolders: Record<string, boolean>;
    mealDefs: MealDefinition[];
    onChangeFoodCategory: (foodId: FoodId, categoryId: CategoryId) => void;
    onReorderCategories: (nextOrder: CategoryId[]) => void;
    onReorderFolders: (nextOrder: FolderId[]) => void;
    onSetCategoryFolder: (categoryId: CategoryId, folderId: FolderId | null) => void;
    onReorderMealPanels: (nextOrder: MealId[]) => void;
    addEntryToMeal: (mealId: MealId, foodId: FoodId) => void;
    moveEntry: (from: MealId, to: MealId, entryId: string) => void;
};
