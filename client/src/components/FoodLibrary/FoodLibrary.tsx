"use client";

import { useRef, useEffect, useMemo, useState } from "react";
import type { CategoryId, FoodItem } from "@/shared/models";
import { useDraggable } from "@dnd-kit/core";
import { useProfile } from "@/client/src/hooks/useProfile";
import { IoMdArrowDropdown, IoMdArrowDropleft, IoMdCreate, IoMdTrash } from "react-icons/io";
import { UNKNOWN_CATEGORY_ID } from "@/shared/defaults";
import styles from "./FoodLibrary.module.scss";


export function FoodLibrary({
    onAdd,
    onEdit,
}: {
    onAdd: (categoryId: CategoryId) => void;
    onEdit: (food: FoodItem) => void;
}) {

    const { profile, updateCategory, addCategory, removeCategory } = useProfile();

    const foods = useMemo(() => Object.values(profile.foods), [profile.foods]);

    const visibleCats = useMemo(() => {
        const foodsByCategory = new Map<CategoryId, FoodItem[]>();
        for (const f of foods) {
            if (!foodsByCategory.has(f.categoryId)) {
                foodsByCategory.set(f.categoryId, []);
            }
            foodsByCategory.get(f.categoryId)!.push(f);
        }

        return Object.values(profile.categories)
            .filter((c) => {
                if (!c.enabled) return false;
                // Unknown category only shows if it has foods
                if (c.id === UNKNOWN_CATEGORY_ID) {
                    return (foodsByCategory.get(c.id)?.length ?? 0) > 0;
                }
                return true;
            })
            .sort((a, b) => a.order - b.order);
    }, [profile.categories, foods]);

    const grouped = useMemo(() => {
        const map = new Map<CategoryId, FoodItem[]>();
        for (const c of visibleCats) map.set(c.id, []);
        for (const f of foods) {
            const bucket = map.get(f.categoryId);
            if (bucket) bucket.push(f);
        }
        return map;
    }, [foods, visibleCats]);

    const [collapsedCats, setCollapsedCats] = useState<Record<string, boolean>>({});
    const [editingCatId, setEditingCatId] = useState<CategoryId | null>(null);
    const [editingName, setEditingName] = useState("");
    const [autoRenameCatId, setAutoRenameCatId] = useState<CategoryId | null>(null);
    const cancelRenameOnBlurRef = useRef(false);

    const toggleCollapsedCats = (catIdKey: string) => {
        setCollapsedCats((prev) => ({ ...prev, [catIdKey]: !prev[catIdKey] }));
    }

    const startRename = (catId: CategoryId, currentName: string) => {
        setEditingCatId(catId);
        setEditingName(currentName);
    }

    const commitRename = (catId: CategoryId, currentName: string) => {
        const nextName = editingName.trim();
        if (!nextName || nextName === currentName) {
            setEditingCatId(null);
            setEditingName("");
            return;
        }

        updateCategory(catId, { name: nextName });
        setEditingCatId(null);
        setEditingName("");
    }

    const cancelRename = () => {
        setEditingCatId(null);
        setEditingName("");
    }

    useEffect(() => {
        if (!autoRenameCatId) return;
        const cat = profile.categories[autoRenameCatId];
        if (!cat) return;
        startRename(autoRenameCatId, cat.name);
        setAutoRenameCatId(null);
    }, [autoRenameCatId, profile.categories]);

    return (
        <div className={styles.panel}>
            {visibleCats.map((cat) => {
                const catKey = String(cat.id);
                const items = grouped.get(cat.id) ?? [];
                const collapsed = !!collapsedCats[catKey];
                return (
                    <div key={String(cat.id)} className={styles.category}>
                        <div className={styles.headerRow}>
                            <div className={styles.categoryName}>
                                {editingCatId === cat.id ? (
                                    <input
                                        className={styles.renameInput}
                                        value={editingName}
                                        autoFocus
                                        onChange={(e) => setEditingName(e.target.value)}
                                        onBlur={() => {
                                            if (cancelRenameOnBlurRef.current) {
                                                cancelRenameOnBlurRef.current = false;
                                                return;
                                            }
                                            commitRename(cat.id, cat.name);
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault();
                                                commitRename(cat.id, cat.name);
                                                return;
                                            }

                                            if (e.key === "Escape") {
                                                e.preventDefault();
                                                cancelRenameOnBlurRef.current = true;
                                                cancelRename();
                                            }
                                        }}
                                        aria-label={`Edit name for ${cat.name}`}
                                    />
                                ) : (
                                    <span>{cat.name} ({items.length})</span>
                                )}
                                <button
                                    type="button"
                                    className={styles.renameBtn}
                                    onClick={() => startRename(cat.id, cat.name)}
                                    title={`Rename ${cat.name}`}
                                    aria-label={`Rename ${cat.name}`}
                                >
                                    <IoMdCreate />
                                </button>
                            </div>

                            <div className={styles.headerActions}>
                                <button
                                    type="button"
                                    className={styles.iconBtn}
                                    onClick={() => toggleCollapsedCats(catKey)}
                                    title={collapsed ? "Expand" : "Collapse"}
                                    aria-label={`${collapsed ? "Expand" : "Collapse"} ${cat.name}`}
                                >
                                    {collapsed ? <IoMdArrowDropdown /> : <IoMdArrowDropleft />}
                                </button>

                                <button
                                    className={styles.iconBtn}
                                    onClick={() => onAdd(cat.id)}
                                    type="button"
                                    title={`Add new food to ${cat.name}`}
                                >
                                    +
                                </button>
                                {cat.id !== UNKNOWN_CATEGORY_ID && (
                                    <button
                                        type="button"
                                        className={`${styles.deleteBtn} ${styles.iconBtn}`}
                                        onClick={() => {
                                            removeCategory(cat.id);
                                        }}
                                        title={`Remove ${cat.name}`}
                                        aria-label={`Remove ${cat.name}`}
                                    >
                                        <IoMdTrash />
                                    </button>
                                )}
                            </div>
                        </div>
                        {
                            !collapsed ? (
                                <div className={styles.chipWrap}>
                                    {items.map((f) => (
                                        <FoodChip key={String(f.id)} food={f} onClick={() => onEdit(f)} />
                                    ))}
                                </div>
                            ) : null
                        }
                        <div className={styles.divider} />
                    </div>
                );
            })}            <button
                className={styles.addCategoryBtn}
                onClick={() => {
                    const newCatId = addCategory({
                        name: "New Category",
                        profileId: profile.profileId,
                        order: Math.max(0, ...Object.values(profile.categories).map(c => c.order)) + 1,
                        enabled: true,
                    });
                    setAutoRenameCatId(newCatId);
                }}
                title="Add new category"
                type="button"
            >
                + Add Category
            </button>        </div >
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


