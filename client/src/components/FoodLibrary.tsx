"use client";

import { useMemo } from "react";
import type { CategoryId, FoodCategory, FoodItem } from "@/shared/models";
import { CATEGORIES } from "@/shared/defaults";
import { useDraggable } from "@dnd-kit/core";

function FoodChip({ food, onClick }: { food: FoodItem; onClick: () => void }) {
    const id = `lib:${food.id}`;
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

    return (
        <button
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            onClick={onClick}
            style={{
                ...chip,
                opacity: isDragging ? 0.5 : 1,
                transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
            }}
            title="Drag into a meal box. Click to edit."
        >
            {food.name}
        </button>
    );
}

const defaultCategoryId = (name: string) => (`cat:${name}` as unknown as CategoryId);

const defaultCategories: FoodCategory[] = CATEGORIES.map((name, i) => ({
    id: defaultCategoryId(name),
    profileId: "local",
    name,
    order: i,
    enabled: true,
}));

export function FoodLibrary({
    categories,
    foods,
    onAdd,
    onEdit,
}: {
    categories: FoodCategory[];
    foods: FoodItem[];
    onAdd: (categoryId: CategoryId) => void;
    onEdit: (food: FoodItem) => void;
}) {

    const safeCategories = Array.isArray(categories) && categories.length > 0 ? categories : defaultCategories;

    const visibleCats = useMemo(
        () => safeCategories.filter((c) => c.enabled).slice().sort((a, b) => a.order - b.order),
        [safeCategories]
    );
    const grouped = useMemo(() => {
        const map = new Map<CategoryId, FoodItem[]>();
        for (const c of visibleCats) map.set(c.id, []);
        for (const f of foods) {
            const bucket = map.get(f.categoryId);
            if (bucket) bucket.push(f);
            // else: food refers to a missing/disabled category; ignore or handle as "Uncategorized"
        }
        return map;
    }, [foods, visibleCats]);

    return (
        <div style={panel}>
            {visibleCats.map((cat) => (
                <div key={cat.id} style={{ marginBottom: 14 }}>
                    <div style={headerRow}>
                        <div style={{ fontWeight: 800 }}>{cat.name}</div>
                        <button style={plusBtn} onClick={() => onAdd(cat.id)}>+</button>
                    </div>
                    <div style={chipWrap}>
                        {(grouped.get(cat.id) ?? []).map((f) => (
                            <FoodChip key={String(f.id)} food={f} onClick={() => onEdit(f)} />
                        ))}
                    </div>
                    <div style={divider} />
                </div>
            ))}
        </div>
    );
}

const panel: React.CSSProperties = {
    border: "1px solid var(--card-border)",
    borderRadius: 14,
    padding: 14,
    minHeight: 420,
};

const headerRow: React.CSSProperties = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
};

const plusBtn: React.CSSProperties = {
    width: 38,
    height: 38,
    borderRadius: 999,
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    fontSize: 22,
    color: "var(--background)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
};

const chipWrap: React.CSSProperties = { display: "flex", flexWrap: "wrap", gap: 10 };
const chip: React.CSSProperties = {
    padding: "8px 12px",
    borderRadius: 999,
    border: "1px solid transparent",
    background: "var(--btn-bg)",
    cursor: "grab",
    color: "var(--btn-fg)",
    fontWeight: 800,
    boxShadow: "0 4px 10px rgba(41, 33, 33, 0.06)",
};
const divider: React.CSSProperties = { height: 1, background: "var(--divider)", marginTop: 12 };
