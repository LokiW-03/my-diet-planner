"use client";

import React from "react";
import { pdf } from "@react-pdf/renderer";
import type { FoodItem, MealDefinition, MealEntry } from "@/shared/models";
import { PdfDoc } from "../PdfDoc/PdfDoc";
import styles from "./BottomToolBar.module.scss";

type Props = {
    foods: FoodItem[];
    meals: Record<string, MealEntry[]>;
    mealDefs: MealDefinition[];
    totals: { kcal: number; protein: number };
    proteinColor: string;
    stillNeedKcal: number;
    exportDayType: string;
    onClearAll: () => void;
};

export function BottomToolBar({
    foods,
    meals,
    mealDefs,
    totals,
    proteinColor,
    stillNeedKcal,
    exportDayType,
    onClearAll,
}: Props) {
    return (
        <div className={styles.root}>
            <div className={styles.card}>
                <div className={styles.title}>TOTAL</div>
                <div className={styles.value}>{Math.round(totals.kcal)} kcal</div>
                <div className={styles.protein} style={{ color: proteinColor }}>
                    {Math.round(totals.protein)}g Protein
                </div>
            </div>

            <div className={`${styles.card} ${styles.cardCenter}`}>
                <div className={styles.stillNeedTitle}>STILL NEED</div>
                <div className={styles.value}>{stillNeedKcal} kcal</div>
                <div className={styles.stillNeedSub}>to meet target</div>
            </div>

            <button
                className={styles.button}
                onClick={async () => {
                    const blob = await pdf(
                        <PdfDoc
                            foods={foods}
                            meals={meals}
                            mealDefs={mealDefs}
                            totals={totals}
                            dayType={exportDayType}
                        />
                    ).toBlob();

                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "meal-plan.pdf";
                    a.click();
                    URL.revokeObjectURL(url);
                }}
                type="button"
            >
                Export
            </button>

            <button
                className={`${styles.button} ${styles.danger}`}
                onClick={onClearAll}
                title="Clear all meals"
                type="button"
            >
                Clear All
            </button>
        </div>
    );
}

