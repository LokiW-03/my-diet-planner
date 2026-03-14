"use client";

import { useMemo } from "react";
import type { CategoryId, FoodItem } from "@/shared/models";
import { useDraggable } from "@dnd-kit/core";
import { useProfile } from "@/client/src/hooks/useProfile";
import styles from "./FoodLibrary.module.scss";

function FoodChip({ food, onClick }: { food: FoodItem; onClick: () => void }) {
    const id = `lib:${food.id}`;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    return (
        <button
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={onClick}
            className={styles.chip}
            style={{
                opacity: isDragging ? 0.5 : 1,
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
            }}
            title="Drag into a meal box. Click to edit."
        >
            {food.name}
        </button>
    );
}


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

    return (
        <div className={styles.panel}>
            {visibleCats.map((cat) => (
                <div key={String(cat.id)} className={styles.category}>
                    <div className={styles.headerRow}>
                        <div className={styles.categoryName}>{cat.name}</div>
                        <button className={styles.plusBtn} onClick={() => onAdd(cat.id)} type="button">
                            +
                        </button>
                    </div>
                    <div className={styles.chipWrap}>
                        {(grouped.get(cat.id) ?? []).map((f) => (
                            <FoodChip key={String(f.id)} food={f} onClick={() => onEdit(f)} />
                        ))}
                    </div>
                    <div className={styles.divider} />
                </div>
            ))}
        </div>
    );
}
