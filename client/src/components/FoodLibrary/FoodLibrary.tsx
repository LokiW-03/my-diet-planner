"use client";

import { useRef, useEffect, useMemo, useState, useCallback } from "react";
import type { CategoryId, FoodItem, FoodCategory } from "@/shared/models";
import { useDraggable, useDroppable } from "@dnd-kit/core";
import { SortableContext, rectSortingStrategy, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { IoMdArrowDropdown, IoMdArrowDropleft, IoMdCreate, IoMdTrash } from "react-icons/io";
import { UNKNOWN_CATEGORY_ID } from "@/shared/defaults";
import styles from "./FoodLibrary.module.scss";


export function FoodLibrary({
    foods,
    categories,
    onAdd,
    onEdit,
    onRenameCategory,
    onAddCategory,
    onRemoveCategory,
}: FoodLibraryProps) {
    const foodsMemo = useMemo(() => foods, [foods]);

    const visibleCats = useMemo(() => {
        const foodsByCategory = new Map<CategoryId, FoodItem[]>();
        for (const f of foodsMemo) {
            if (!foodsByCategory.has(f.categoryId)) {
                foodsByCategory.set(f.categoryId, []);
            }
            foodsByCategory.get(f.categoryId)!.push(f);
        }

        return Object.values(categories)
            .filter((c) => {
                if (!c.enabled) return false;
                // Unknown category only shows if it has foods
                if (c.id === UNKNOWN_CATEGORY_ID) {
                    return (foodsByCategory.get(c.id)?.length ?? 0) > 0;
                }
                return true;
            })
            .sort((a, b) => a.order - b.order);
    }, [categories, foodsMemo]);

    const grouped = useMemo(() => {
        const map = new Map<CategoryId, FoodItem[]>();
        for (const c of visibleCats) map.set(c.id, []);
        for (const f of foodsMemo) {
            const bucket = map.get(f.categoryId);
            if (bucket) bucket.push(f);
        }
        return map;
    }, [foodsMemo, visibleCats]);

    const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});
    const [editingCatId, setEditingCatId] = useState<CategoryId | null>(null);
    const [editingName, setEditingName] = useState("");
    const [autoRenameCatId, setAutoRenameCatId] = useState<CategoryId | null>(null);

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
    }

    useEffect(() => {
        if (!autoRenameCatId) return;
        const cat = categories[autoRenameCatId];
        if (!cat) return;
        startRename(autoRenameCatId, cat.name);
        setAutoRenameCatId(null);
    }, [autoRenameCatId, categories]);

    const sortableIds = visibleCats.map((c) => `cat:${String(c.id)}`);

    return (
        <div className={styles.panel}>
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
                    />
                ))}
            </SortableContext>
            <button
                className={styles.addCategoryBtn}
                onClick={() => {
                    const newCatId = onAddCategory({
                        name: "New Category",
                        profileId: Object.values(categories)[0]?.profileId || "profile:local" as any,
                        order: Math.max(0, ...Object.values(categories).map(c => c.order)) + 1,
                        enabled: true,
                    });
                    setAutoRenameCatId(newCatId);
                }}
                title="Add new category"
                type="button"
            >
                + Add Category
            </button>
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
}: CategoryRowProps) {
    const catKey = String(category.id);
    const cancelRenameOnBlurRef = useRef(false);

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
                            <IoMdTrash />
                        </button>
                    )}
                </div>
            </div>
            {!isCollapsed && (
                <div className={styles.chipWrap}>
                    {items.map((f) => (
                        <FoodChip key={String(f.id)} food={f} onClick={() => onEdit(f)} />
                    ))}
                </div>
            )}
            <div className={styles.divider} />
        </div>
    );
}


function FoodChip({ food, onClick }: { food: FoodItem; onClick: () => void }) {
    const id = `lib:${food.id}`;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    return (
        <button
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={onClick}
            title={`${food.name}.\nDrag into a meal box. Click to edit.`}
            className={styles.chip}
            style={{
                opacity: isDragging ? 0.5 : 1,
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
            }}
        >
            <span className={styles.chipText}>{food.name}</span>
        </button>
    );
}

type FoodLibraryProps = {
    foods: FoodItem[];
    categories: Record<CategoryId, FoodCategory>;
    onAdd: (categoryId: CategoryId) => void;
    onEdit: (food: FoodItem) => void;
    onRenameCategory: (categoryId: CategoryId, name: string) => void;
    onAddCategory: (category: Omit<FoodCategory, "id">) => CategoryId;
    onRemoveCategory: (categoryId: CategoryId) => void;
}

type CategoryRowProps = {
    category: any;
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
}


