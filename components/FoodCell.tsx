"use client";

import type { Option, Unit } from "@/lib/foodCatalog";

type Props = {
    label: string;
    options: Option[];
    value: { typeId: string; qty: number; unit: Unit };
    onChange: (next: { typeId: string; qty: number; unit: Unit; userEditedQty?: boolean }) => void;

    // control which units are allowed for this cell
    unitMode: "fixed-g" | "fixed-pcs" | "g-or-pcs";

    // if true: when dropdown changes, apply option's default qty/unit (unless user edited qty)
    applyDefaultsOnTypeChange?: boolean;
    userEditedQty?: boolean;
};

export function FoodCell({
    label,
    options,
    value,
    onChange,
    unitMode,
    applyDefaultsOnTypeChange = false,
    userEditedQty = false,
}: Props) {
    const unitChoices: Unit[] =
        unitMode === "g-or-pcs" ? ["g", "pcs"] : unitMode === "fixed-g" ? ["g"] : ["pcs"];

    const handleTypeChange = (typeId: string) => {
        const picked = options.find(o => o.id === typeId);

        // default behavior:
        // - if applyDefaultsOnTypeChange AND (qty not manually edited), apply defaults
        if (applyDefaultsOnTypeChange && picked && !userEditedQty) {
            const nextQty = picked.defaultQty ?? value.qty;
            const nextUnit = picked.defaultUnit ?? value.unit;
            onChange({ typeId, qty: nextQty, unit: nextUnit, userEditedQty: false });
            return;
        }

        // otherwise just change type
        onChange({ ...value, typeId });
    };

    const handleQtyChange = (raw: string) => {
        const n = raw === "" ? 0 : Number(raw);
        onChange({ ...value, qty: Number.isFinite(n) ? n : value.qty, userEditedQty: true });
    };

    const handleUnitChange = (u: Unit) => {
        onChange({ ...value, unit: u, userEditedQty: userEditedQty });
    };

    return (
        <div style={{ display: "grid", gap: 8 }}>
            <div style={{ fontSize: 12, opacity: 0.75 }}>{label}</div>

            <select
                value={value.typeId}
                onChange={(e) => handleTypeChange(e.target.value)}
                style={{ padding: 8, borderRadius: 6, border: "1px solid #444", background: "#111", color: "#fff" }}
            >
                {options.map(o => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                ))}
            </select>

            <div style={{ display: "flex", gap: 8 }}>
                <input
                    type="number"
                    value={value.qty}
                    onChange={(e) => handleQtyChange(e.target.value)}
                    style={{ width: "100%", padding: 8, borderRadius: 6, border: "1px solid #444", background: "#111", color: "#fff" }}
                />

                {unitChoices.length === 1 ? (
                    <div style={{
                        minWidth: 56, display: "grid", placeItems: "center",
                        padding: 8, borderRadius: 6, border: "1px solid #444", background: "#0b0b0b", color: "#bbb"
                    }}>
                        {unitChoices[0]}
                    </div>
                ) : (
                    <select
                        value={value.unit}
                        onChange={(e) => handleUnitChange(e.target.value as Unit)}
                        style={{ minWidth: 80, padding: 8, borderRadius: 6, border: "1px solid #444", background: "#111", color: "#fff" }}
                    >
                        {unitChoices.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                )}
            </div>
        </div>
    );
}
