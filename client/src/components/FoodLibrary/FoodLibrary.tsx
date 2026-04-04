"use client";

import { useMemo, useState, useCallback, useEffect, useRef, type ReactNode } from "react";
import type {
    CategoryId,
    FoodCategory,
    FoodItem,
    FoodId,
    MealDefinition,
    MealId,
    ProfileId,
    CategoryFolder,
    FolderId,
} from "@/shared/models";

import { useDroppable } from "@dnd-kit/core";
import {
    SortableContext,
    rectSortingStrategy,
    useSortable,
    verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { defaultProfileId, UNKNOWN_CATEGORY_ID } from "@/shared/defaults";
import { getFoodLibraryGroups } from "@/client/src/utils/getFoodLibraryGroups";
import { FoodLibraryToolBar } from "./FoodLibraryToolBar/FoodLibraryToolBar";
import { useFoodSelection } from "./useFoodSelection";
import { CategoryRow } from "./CategoryRow/CategoryRow";
import { FolderRow } from "./FolderRow/FolderRow";
import styles from "./FoodLibrary.module.scss";


export function FoodLibrary({
    foods,
    folders,
    categories,
    mealDefs,
    onAdd,
    onEdit,
    onRenameCategory,
    onRenameFolder,
    onAddCategory,
    onRemoveCategory,
    onAddFolder,
    onRemoveFolder,
    collapsedFolders,
    onToggleFolderCollapse,
    onChangeFoodCategory,
    onAddEntryToMeal,
    onRemoveFood,
}: FoodLibraryProps) {

    const [search, setSearch] = useState("");

    const filteredFoods = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return foods;
        return foods.filter((f) => f.name.toLowerCase().includes(q));
    }, [foods, search]);

    const { folders: visibleFolders, categoriesByFolderId, unfiledCategories, orderedCategories } = useMemo(
        () => getFoodLibraryGroups(categories, filteredFoods, folders),
        [categories, filteredFoods, folders],
    );

    const grouped = useMemo(() => {
        const map = new Map<CategoryId, FoodItem[]>();
        for (const c of orderedCategories) map.set(c.id, []);
        for (const f of filteredFoods) {
            const bucket = map.get(f.categoryId);
            if (bucket) bucket.push(f);
        }
        return map;
    }, [filteredFoods, orderedCategories]);

    const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});
    const [editingCatId, setEditingCatId] = useState<CategoryId | null>(null);
    const [editingName, setEditingName] = useState("");

    const [editingFolderId, setEditingFolderId] = useState<FolderId | null>(null);
    const [editingFolderName, setEditingFolderName] = useState("");

    const toggleCollapsedCats = (catIdKey: string) => {
        setCollapsedCats((prev) => ({ ...prev, [catIdKey]: !prev[catIdKey] }));
    };

    const expandAllCategories = useCallback(() => {
        setCollapsedCats((prev) => {
            const hasAnyCollapsed = Object.values(prev).some(Boolean);
            return hasAnyCollapsed ? {} : prev;
        });
    }, []);

    const expandAllFolders = useCallback(() => {
        for (const folder of visibleFolders) {
            const folderKey = String(folder.id);
            const folderCats = categoriesByFolderId.get(folder.id) ?? [];
            const isFolderEmpty = folderCats.length === 0;
            if (isFolderEmpty) continue;

            if (collapsedFolders[folderKey]) {
                onToggleFolderCollapse(folder.id);
            }
        }
    }, [visibleFolders, categoriesByFolderId, collapsedFolders, onToggleFolderCollapse]);

    const startRename = (catId: CategoryId, currentName: string) => {
        setEditingCatId(catId);
        setEditingName(currentName);
    };

    const commitRename = useCallback((catId: CategoryId, currentName: string) => {
        const nextName = editingName.trim();
        if (!nextName || nextName === currentName) {
            setEditingCatId(null);
            setEditingName("");
            return;
        }

        onRenameCategory(catId, nextName);
        setEditingCatId(null);
        setEditingName("");
    }, [editingName, onRenameCategory])

    const cancelRename = () => {
        setEditingCatId(null);
        setEditingName("");
    };

    const startFolderRename = (folderId: FolderId, currentName: string) => {
        setEditingFolderId(folderId);
        setEditingFolderName(currentName);
    };

    const commitFolderRename = useCallback(
        (folderId: FolderId, currentName: string) => {
            const nextName = editingFolderName.trim();
            if (!nextName || nextName === currentName) {
                setEditingFolderId(null);
                setEditingFolderName("");
                return;
            }

            onRenameFolder(folderId, nextName);
            setEditingFolderId(null);
            setEditingFolderName("");
        },
        [editingFolderName, onRenameFolder],
    );

    const cancelFolderRename = () => {
        setEditingFolderId(null);
        setEditingFolderName("");
    };

    const handleAddCategoryClick = useCallback(() => {
        const initialName = "New Category";
        const existingProfileId =
            Object.values(categories)[0]?.profileId ??
            (defaultProfileId("local") as ProfileId);

        const finiteOrders = Object.values(categories)
            .filter((c) => c.id !== UNKNOWN_CATEGORY_ID)
            .map((c) => c.order)
            .filter((n) => Number.isFinite(n));

        const nextOrder = (finiteOrders.length ? Math.max(...finiteOrders) : -1) + 1;

        const newCatId = onAddCategory({
            name: initialName,
            profileId: existingProfileId,
            order: Math.max(0, nextOrder),
            enabled: true,
            folderId: null,
        });
        startRename(newCatId, initialName);
    }, [categories, onAddCategory]);

    const handleAddFolderClick = useCallback(() => {
        const initialName = "New Folder";
        const existingProfileId =
            Object.values(categories)[0]?.profileId ??
            (defaultProfileId("local") as ProfileId);

        const nextOrder = Object.values(folders).length
            ? Math.max(...Object.values(folders).map((f) => f.order)) + 1
            : 0;

        const newFolderId = onAddFolder({
            profileId: existingProfileId,
            name: initialName,
            order: nextOrder,
            enabled: true,
        });

        startFolderRename(newFolderId, initialName);
    }, [categories, folders, onAddFolder]);

    const renderCategoryRow = (cat: FoodCategory) => (
        <CategoryRow
            key={String(cat.id)}
            category={cat}
            items={grouped.get(cat.id) ?? []}
            isCollapsed={!!collapsedCats[String(cat.id)]}
            isEditing={editingCatId === cat.id}
            editingName={editingName}
            onToggleCollapse={() => toggleCollapsedCats(String(cat.id))}
            onStartRename={() => startRename(cat.id, cat.name)}
            onCommitRename={() => commitRename(cat.id, cat.name)}
            onCancelRename={cancelRename}
            onEditingNameChange={setEditingName}
            onAdd={onAdd}
            onEdit={onEdit}
            onRemove={onRemoveCategory}
            isSelecting={isSelectMode}
            selectedFoodIds={selectedFoodIds}
            onToggleFoodSelected={toggleFoodSelected}
            onToggleSelectAll={() => toggleSelectAllForCategory(grouped.get(cat.id) ?? [])}
            isCategoryAllSelected={
                (grouped.get(cat.id) ?? []).length > 0 &&
                (grouped.get(cat.id) ?? []).every((f) => selectedFoodIds.has(f.id))
            }
            isCategoryPartiallySelected={(grouped.get(cat.id) ?? []).some((f) => selectedFoodIds.has(f.id))}
        />
    );

    const sortableIds = orderedCategories
        .filter((c) => {
            const folderId = c.folderId;
            if (!folderId) return true;
            return !collapsedFolders[String(folderId)];
        })
        .map((c) => `cat:${String(c.id)}`);
    const folderSortableIds = visibleFolders.map((f) => `folder:${String(f.id)}`);

    const {
        isSelectMode,
        selectedFoodIds,
        hasSelection,
        toggleSelectMode,
        toggleFoodSelected,
        toggleSelectAllForCategory,
        enabledCategories,
        enabledMealPanels,
        handleBulkMoveToCategory,
        handleBulkAddToMeal,
        handleBulkRemoveSelected,
    } = useFoodSelection({
        categories,
        mealDefs,
        onChangeFoodCategory,
        onAddEntryToMeal,
        onRemoveFood,
    });

    const prevIsSelectModeRef = useRef(isSelectMode);
    useEffect(() => {
        const wasSelecting = prevIsSelectModeRef.current;
        if (isSelectMode && !wasSelecting) {
            expandAllFolders();
        }
        prevIsSelectModeRef.current = isSelectMode;
    }, [isSelectMode, expandAllFolders]);

    const prevSearchActiveRef = useRef(false);
    useEffect(() => {
        const isSearchActive = !!search.trim();
        const wasSearchActive = prevSearchActiveRef.current;

        if (isSearchActive && !wasSearchActive) {
            expandAllFolders();
            expandAllCategories();
        }

        prevSearchActiveRef.current = isSearchActive;
    }, [search, expandAllFolders, expandAllCategories]);

    const { setNodeRef: setUnfiledDropRef, isOver: isOverUnfiled } = useDroppable({
        id: "drop:unfiled",
    });

    return (
        <div className={styles.panel}>
            <FoodLibraryToolBar
                search={search}
                onSearchChange={setSearch}
                isSelecting={isSelectMode}
                hasSelection={hasSelection}
                onToggleSelectMode={toggleSelectMode}
                onAddCategory={handleAddCategoryClick}
                onAddFolder={handleAddFolderClick}
                categories={enabledCategories}
                mealPanels={enabledMealPanels}
                onBulkMoveToCategory={handleBulkMoveToCategory}
                onBulkAddToMealPanel={handleBulkAddToMeal}
                onBulkRemoveSelected={handleBulkRemoveSelected}
            />
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
                <SortableContext items={folderSortableIds} strategy={verticalListSortingStrategy}>
                    {visibleFolders.map((folder) => {
                        const folderKey = String(folder.id);
                        const folderCats = categoriesByFolderId.get(folder.id) ?? [];
                        const isFolderEmpty = folderCats.length === 0;
                        const isFolderCollapsed = !!collapsedFolders[folderKey] || isFolderEmpty;

                        return (
                            <SortableFolderGroup
                                key={folderKey}
                                folder={folder}
                                isCollapsed={isFolderCollapsed}
                                isEmpty={isFolderEmpty}
                                isEditing={editingFolderId === folder.id}
                                editingName={editingFolderName}
                                onToggleCollapse={() => onToggleFolderCollapse(folder.id)}
                                onStartRename={() => startFolderRename(folder.id, folder.name)}
                                onCommitRename={() => commitFolderRename(folder.id, folder.name)}
                                onCancelRename={cancelFolderRename}
                                onEditingNameChange={setEditingFolderName}
                                onRemove={() => {
                                    if (
                                        confirm(
                                            `Remove folder "${folder.name}"? Categories inside will be moved out of the folder.`,
                                        )
                                    ) {
                                        onRemoveFolder(folder.id);
                                    }
                                }}
                            >
                                {!isFolderCollapsed && (
                                    <>
                                        <div className={styles.folderDivider} />
                                        <div className={styles.folderContents}>
                                            {folderCats.map((cat) => (
                                                <div
                                                    key={`foldercat:${String(cat.id)}`}
                                                    className={styles.folderCategory}
                                                >
                                                    {renderCategoryRow(cat)}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </SortableFolderGroup>
                        );
                    })}
                </SortableContext>

                <div
                    ref={setUnfiledDropRef}
                    className={styles.unfiledZone}
                    style={{
                        boxShadow: isOverUnfiled ? "0 0 0 2px var(--accent)" : undefined,
                    }}
                >
                    {unfiledCategories.map((cat) => renderCategoryRow(cat))}
                </div>
            </SortableContext>
        </div>
    );
}

function SortableFolderGroup({
    folder,
    isCollapsed,
    isEmpty,
    isEditing,
    editingName,
    onToggleCollapse,
    onStartRename,
    onCommitRename,
    onCancelRename,
    onEditingNameChange,
    onRemove,
    children,
}: {
    folder: CategoryFolder;
    isCollapsed: boolean;
    isEmpty: boolean;
    isEditing: boolean;
    editingName: string;
    onToggleCollapse: () => void;
    onStartRename: () => void;
    onCommitRename: () => void;
    onCancelRename: () => void;
    onEditingNameChange: (name: string) => void;
    onRemove: () => void;
    children: ReactNode;
}) {
    const {
        setNodeRef,
        setActivatorNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `folder:${String(folder.id)}`, disabled: isEditing });

    const baseTransform = CSS.Transform.toString(transform);
    const animatedTransform = baseTransform
        ? `${baseTransform}${isDragging ? " scale(1.01)" : ""}`
        : undefined;

    return (
        <div
            ref={setNodeRef}
            className={styles.folderGroup}
            style={{
                transform: animatedTransform,
                transition: transition ? `${transition}, box-shadow 160ms ease` : "box-shadow 160ms ease",
                opacity: isDragging ? 0.9 : 1,
                boxShadow: isDragging ? "0 12px 32px var(--shadow-drag)" : undefined,
                zIndex: isDragging ? 40 : "auto",
            }}
        >
            <FolderRow
                folder={folder}
                isCollapsed={isCollapsed}
                isToggleDisabled={isEmpty}
                isEditing={isEditing}
                editingName={editingName}
                onToggleCollapse={onToggleCollapse}
                onStartRename={onStartRename}
                onCommitRename={onCommitRename}
                onCancelRename={onCancelRename}
                onEditingNameChange={onEditingNameChange}
                onRemove={onRemove}
                dragHandleRef={setActivatorNodeRef}
                dragHandleAttributes={attributes}
                dragHandleListeners={listeners}
            />
            {children}
        </div>
    );
}


type FoodLibraryProps = {
    foods: FoodItem[];
    folders: Record<FolderId, CategoryFolder>;
    categories: Record<CategoryId, FoodCategory>;
    mealDefs: MealDefinition[];
    onAdd: (categoryId: CategoryId) => void;
    onEdit: (food: FoodItem) => void;
    onRenameCategory: (categoryId: CategoryId, name: string) => void;
    onRenameFolder: (folderId: FolderId, name: string) => void;
    onAddCategory: (category: Omit<FoodCategory, "id">) => CategoryId;
    onRemoveCategory: (categoryId: CategoryId) => void;
    onAddFolder: (folder: Omit<CategoryFolder, "id">) => FolderId;
    onRemoveFolder: (folderId: FolderId) => void;
    collapsedFolders: Record<string, boolean>;
    onToggleFolderCollapse: (folderId: FolderId) => void;
    onChangeFoodCategory: (foodId: FoodId, categoryId: CategoryId) => void;
    onAddEntryToMeal: (mealId: MealId, foodId: FoodId) => void;
    onRemoveFood: (foodId: FoodId) => void;
};



