"use client";

import { useRef, useMemo, useState, useCallback, useEffect } from "react";
import type {
    CategoryId,
    FoodCategory,
    FoodItem,
    FoodId,
    MealDefinition,
    MealId,
    ProfileId,
} from "@/shared/models";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IoMdArrowDropdown, IoMdArrowDropleft, IoMdCreate } from "react-icons/io";
import { FaTrash } from "react-icons/fa";
import { UNKNOWN_CATEGORY_ID, defaultProfileId } from "@/shared/defaults";
import { getVisibleCategories } from "@/client/src/utils/getVisibleCategories";
import { FoodLibraryToolBar } from "./FoodLibraryToolBar";
import { useFoodSelection } from "./useFoodSelection";
import styles from "./FoodLibrary.module.scss";


export function FoodLibrary({
    foods,
    categories,
    mealDefs,
    onAdd,
    onEdit,
    onRenameCategory,
    onAddCategory,
    onRemoveCategory,
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

    const visibleCats = useMemo(
        () => getVisibleCategories(categories, filteredFoods),
        [categories, filteredFoods],
    );

    const grouped = useMemo(() => {
        const map = new Map<CategoryId, FoodItem[]>();
        for (const c of visibleCats) map.set(c.id, []);
        for (const f of filteredFoods) {
            const bucket = map.get(f.categoryId);
            if (bucket) bucket.push(f);
        }
        return map;
    }, [filteredFoods, visibleCats]);

    const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});
    const [editingCatId, setEditingCatId] = useState<CategoryId | null>(null);
    const [editingName, setEditingName] = useState("");

    const toggleCollapsedCats = (catIdKey: string) => {
        setCollapsedCats((prev) => ({ ...prev, [catIdKey]: !prev[catIdKey] }));
    }

    const startRename = (catId: CategoryId, currentName: string) => {
        setEditingCatId(catId);
        setEditingName(currentName);
    }

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

    const handleAddCategoryClick = useCallback(() => {
        const initialName = "New Category";
        const existingProfileId =
            Object.values(categories)[0]?.profileId ??
            (defaultProfileId("local") as ProfileId);

        const newCatId = onAddCategory({
            name: initialName,
            profileId: existingProfileId,
            order:
                Math.max(0, ...Object.values(categories).map((c) => c.order)) +
                1,
            enabled: true,
        });
        startRename(newCatId, initialName);
    }, [categories, onAddCategory]);

    const sortableIds = visibleCats.map((c) => `cat:${String(c.id)}`);

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

    return (
        <div className={styles.panel}>
            <FoodLibraryToolBar
                search={search}
                onSearchChange={setSearch}
                isSelecting={isSelectMode}
                hasSelection={hasSelection}
                onToggleSelectMode={toggleSelectMode}
                onAddCategory={handleAddCategoryClick}
                categories={enabledCategories}
                mealPanels={enabledMealPanels}
                onBulkMoveToCategory={handleBulkMoveToCategory}
                onBulkAddToMealPanel={handleBulkAddToMeal}
                onBulkRemoveSelected={handleBulkRemoveSelected}
            />
            <SortableContext items={sortableIds} strategy={rectSortingStrategy}>
                {visibleCats.map((cat) => (
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
                        onToggleSelectAll={() =>
                            toggleSelectAllForCategory(grouped.get(cat.id) ?? [])
                        }
                        isCategoryAllSelected={
                            (grouped.get(cat.id) ?? []).length > 0 &&
                            (grouped.get(cat.id) ?? []).every((f) =>
                                selectedFoodIds.has(f.id),
                            )
                        }
                        isCategoryPartiallySelected={
                            (grouped.get(cat.id) ?? []).some((f) =>
                                selectedFoodIds.has(f.id),
                            )
                        }
                    />
                ))}
            </SortableContext>
        </div>
    );
}

function CategoryRow({
    category,
    items,
    isCollapsed,
    isEditing,
    editingName,
    onToggleCollapse,
    onStartRename,
    onCommitRename,
    onCancelRename,
    onEditingNameChange,
    onAdd,
    onEdit,
    onRemove,
    isSelecting,
    selectedFoodIds,
    onToggleFoodSelected,
    onToggleSelectAll,
    isCategoryAllSelected,
    isCategoryPartiallySelected,
}: CategoryRowProps) {
    const catKey = String(category.id);
    const cancelRenameOnBlurRef = useRef(false);
    const selectAllRef = useRef<HTMLInputElement | null>(null);

    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: `drop:cat:${catKey}` });

    const {
        setNodeRef: setRowRef,
        setActivatorNodeRef,
        attributes,
        listeners,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: `cat:${catKey}` });

    useEffect(() => {
        if (selectAllRef.current) {
            selectAllRef.current.indeterminate =
                !isCollapsed && isSelecting && !isCategoryAllSelected && isCategoryPartiallySelected;
        }
    }, [isCollapsed, isSelecting, isCategoryAllSelected, isCategoryPartiallySelected]);

    const baseTransform = CSS.Transform.toString(transform);
    const animatedTransform = baseTransform ? `${baseTransform}${isDragging ? " scale(1.01)" : ""}` : undefined;

    return (
        <div
            ref={(node) => {
                setRowRef(node);
                setDropRef(node);
            }}
            className={styles.category}
            style={{
                transform: animatedTransform,
                transition: transition ? `${transition}, box-shadow 160ms ease` : "box-shadow 160ms ease",
                opacity: isDragging ? 0.9 : 1,
                boxShadow: isDragging
                    ? "0 12px 32px var(--shadow-drag)"
                    : isOver
                        ? "0 0 0 2px var(--accent)"
                        : undefined,
                zIndex: isDragging ? 40 : "auto",
            }}
        >
            <div className={styles.headerRow}>
                <div className={styles.categoryName}>
                    {isSelecting && (
                        <input
                            ref={selectAllRef}
                            type="checkbox"
                            className={styles.categorySelectAllCheckbox}
                            checked={isCategoryAllSelected}
                            onChange={onToggleSelectAll}
                            disabled={items.length === 0}
                            title="Select all foods in this category"
                        />
                    )}
                    {isEditing ? (
                        <input
                            className={styles.renameInput}
                            value={editingName}
                            autoFocus
                            onChange={(e) => onEditingNameChange(e.target.value)}
                            onBlur={() => {
                                if (cancelRenameOnBlurRef.current) {
                                    cancelRenameOnBlurRef.current = false;
                                    return;
                                }
                                onCommitRename();
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    e.preventDefault();
                                    onCommitRename();
                                    return;
                                }

                                if (e.key === "Escape") {
                                    e.preventDefault();
                                    cancelRenameOnBlurRef.current = true;
                                    onCancelRename();
                                }
                            }}
                            aria-label={`Edit name for ${category.name}`}
                        />
                    ) : (
                        <span>{category.name} ({items.length})</span>
                    )}
                    {category.id !== UNKNOWN_CATEGORY_ID && (
                        <button
                            type="button"
                            className={styles.renameBtn}
                            onClick={onStartRename}
                            title={`Rename ${category.name}`}
                            aria-label={`Rename ${category.name}`}
                        >
                            <IoMdCreate />
                        </button>
                    )}
                </div>

                <div className={styles.headerActions}>
                    <button
                        type="button"
                        ref={setActivatorNodeRef}
                        {...attributes}
                        {...listeners}
                        className={`${styles.dragHandle} ${styles.iconBtn}`}
                        title="Drag to reorder"
                        aria-label={`Drag to reorder ${category.name}`}
                    >
                        ⋮⋮
                    </button>

                    <button
                        type="button"
                        className={styles.iconBtn}
                        onClick={onToggleCollapse}
                        title={isCollapsed ? "Expand" : "Collapse"}
                        aria-label={`${isCollapsed ? "Expand" : "Collapse"} ${category.name}`}
                    >
                        {isCollapsed ? <IoMdArrowDropdown /> : <IoMdArrowDropleft />}
                    </button>

                    <button
                        className={styles.iconBtn}
                        onClick={() => onAdd(category.id)}
                        type="button"
                        title={`Add new food to ${category.name}`}
                    >
                        +
                    </button>
                    {category.id !== UNKNOWN_CATEGORY_ID && (
                        <button
                            type="button"
                            className={`${styles.deleteBtn} ${styles.iconBtn}`}
                            onClick={() => {
                                if (confirm(`Remove "${category.name}"? Foods will be moved to Unknown Category.`)) {
                                    onRemove(category.id);
                                }
                            }}
                            title={`Remove ${category.name}`}
                            aria-label={`Remove ${category.name}`}
                        >
                            <FaTrash />
                        </button>
                    )}
                </div>
            </div>
            {!isCollapsed && (
                <div className={styles.chipWrap}>
                    {items.map((f) => (
                        <FoodChip
                            key={String(f.id)}
                            food={f}
                            onClick={() => onEdit(f)}
                            isSelecting={isSelecting}
                            isSelected={selectedFoodIds.has(f.id)}
                            onToggleSelect={() => onToggleFoodSelected(f.id)}
                        />
                    ))}
                </div>
            )}
            <div className={styles.divider} />
        </div>
    );
}


function FoodChip({
    food,
    onClick,
    isSelecting,
    isSelected,
    onToggleSelect,
}: {
    food: FoodItem;
    onClick: () => void;
    isSelecting: boolean;
    isSelected: boolean;
    onToggleSelect: () => void;
}) {
    const id = `lib:${food.id}`;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id,
        disabled: isSelecting,
    });

    return (
        <div
            ref={setNodeRef}
            {...(!isSelecting ? listeners : {})}
            {...(!isSelecting ? attributes : {})}
            onClick={isSelecting ? onToggleSelect : onClick}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    (isSelecting ? onToggleSelect : onClick)();
                }
            }}
            title={
                isSelecting
                    ? `${food.name}.\nClick to select.`
                    : `${food.name}.\nDrag into a meal box. Click to edit.`
            }
            className={styles.chip}
            style={{
                opacity: isDragging ? 0.5 : 1,
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
            }}
            role="button"
            tabIndex={0}
        >
            {isSelecting && (
                <input
                    type="checkbox"
                    className={styles.chipCheckbox}
                    checked={isSelected}
                    onChange={(e) => {
                        e.stopPropagation();
                        onToggleSelect();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Select ${food.name}`}
                />
            )}
            <span className={styles.chipText}>{food.name}</span>
        </div>
    );
}

type FoodLibraryProps = {
    foods: FoodItem[];
    categories: Record<CategoryId, FoodCategory>;
    mealDefs: MealDefinition[];
    onAdd: (categoryId: CategoryId) => void;
    onEdit: (food: FoodItem) => void;
    onRenameCategory: (categoryId: CategoryId, name: string) => void;
    onAddCategory: (category: Omit<FoodCategory, "id">) => CategoryId;
    onRemoveCategory: (categoryId: CategoryId) => void;
    onChangeFoodCategory: (foodId: FoodId, categoryId: CategoryId) => void;
    onAddEntryToMeal: (mealId: MealId, foodId: FoodId) => void;
    onRemoveFood: (foodId: FoodId) => void;
}

type CategoryRowProps = {
    category: FoodCategory;
    items: FoodItem[];
    isCollapsed: boolean;
    isEditing: boolean;
    editingName: string;
    onToggleCollapse: () => void;
    onStartRename: () => void;
    onCommitRename: () => void;
    onCancelRename: () => void;
    onEditingNameChange: (name: string) => void;
    onAdd: (categoryId: CategoryId) => void;
    onEdit: (food: FoodItem) => void;
    onRemove: (categoryId: CategoryId) => void;
    isSelecting: boolean;
    selectedFoodIds: Set<FoodItem["id"]>;
    onToggleFoodSelected: (foodId: FoodItem["id"]) => void;
    onToggleSelectAll: () => void;
    isCategoryAllSelected: boolean;
    isCategoryPartiallySelected: boolean;
}


