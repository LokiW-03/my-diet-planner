"use client";

import { useMemo, useState } from "react";
import type { CategoryId, FoodItem } from "@/shared/models";
import { useDraggable } from "@dnd-kit/core";
import { useProfile } from "@/client/src/hooks/useProfile";
import { IoMdArrowDropdown, IoMdArrowDropleft } from "react-icons/io";
import styles from "./FoodLibrary.module.scss";


export function FoodLibrary({
    onAdd,
    onEdit,
}: {
    onAdd: (categoryId: CategoryId) => void;
    onEdit: (food: FoodItem) => void;
}) {

    const { profile } = useProfile();

    const visibleCats = useMemo(() => {
        return Object.values(profile.categories)
            .filter((c) => c.enabled)
            .sort((a, b) => a.order - b.order);
    }, [profile.categories]);

    const foods = useMemo(() => Object.values(profile.foods), [profile.foods]);

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
    const toggleCollapsedCats = (catIdKey: string) => {
        setCollapsedCats((prev) => ({ ...prev, [catIdKey]: !prev[catIdKey] }));
    }

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
                                {cat.name} ({items.length})
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
            })}
        </div >
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


