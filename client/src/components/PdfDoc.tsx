import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { FoodItem, MealEntry } from "@/shared/models";

type Props = {
    foods: FoodItem[];
    meals: Record<string, MealEntry[]>;
    totals: { kcal: number; protein: number };
    dayType: string;
};

export function PdfDoc({ foods, meals, totals, dayType }: Props) {
    const map = new Map(foods.map((f) => [f.id, f]));

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>Diet Planner - Meal Export</Text>
                <Text style={styles.sub}>Day type: {dayType}</Text>
                <Text style={styles.sub}>
                    Total: {Math.round(totals.kcal)} kcal, {Math.round(totals.protein)} g protein
                </Text>

                {Object.entries(meals).map(([mealKey, entries]) => (
                    <View key={mealKey} style={styles.section}>
                        <Text style={styles.mealTitle}>{mealKey.toUpperCase()}</Text>

                        {entries.length === 0 ? (
                            <Text style={styles.muted}>No items</Text>
                        ) : (
                            entries.map((e) => {
                                const f = map.get(e.foodId);
                                if (!f) return null;
                                const kcal = e.portion * f.kcalPerUnit;
                                const p = e.portion * f.proteinPerUnit;
                                return (
                                    <View key={e.entryId} style={styles.row}>
                                        <Text style={styles.cellName}>{f.name}</Text>
                                        <Text style={styles.cell}>{e.portion}{f.unit}</Text>
                                        <Text style={styles.cell}>{Math.round(kcal)} kcal</Text>
                                        <Text style={styles.cell}>{Math.round(p)} g</Text>
                                    </View>
                                );
                            })
                        )}
                    </View>
                ))}
            </Page>
        </Document>
    );
}

const styles = StyleSheet.create({
    page: { padding: 24, fontSize: 12 },
    title: { fontSize: 18, marginBottom: 6 },
    sub: { marginBottom: 4 },
    section: { marginTop: 14, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#e6e6e6" },
    mealTitle: { fontSize: 14, marginBottom: 8 },
    muted: { color: "#444" },
    row: { flexDirection: "row", marginBottom: 4 },
    cellName: { width: "46%" },
    cell: { width: "18%" },
});
