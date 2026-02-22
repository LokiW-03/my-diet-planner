"use client";

import { pdf } from "@react-pdf/renderer";
import { PdfDoc } from "./PdfDoc";
import type { FoodItem, MealEntry, MealKey } from "@/shared/models";

export function ExportButton(props: {
    foods: FoodItem[];
    meals: Record<MealKey, MealEntry[]>;
    totals: { kcal: number; protein: number };
    dayType: "FULL" | "HALF" | "REST";
}) {
    return (
        <button
            style={btn}
            onClick={async () => {
                const blob = await pdf(
                    <PdfDoc foods={props.foods} meals={props.meals} totals={props.totals} dayType={props.dayType} />
                ).toBlob();

                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = "meal-plan.pdf";
                a.click();
                URL.revokeObjectURL(url);
            }}
        >
            Export
        </button>
    );
}

const btn: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 12,
    border: "1px solid var(--card-border)",
    background: "var(--card-bg)",
    color: "var(--background)",
    fontWeight: 700,
};
