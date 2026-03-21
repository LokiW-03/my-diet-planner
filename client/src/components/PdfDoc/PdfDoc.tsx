import { Document, Page, Text, View } from "@react-pdf/renderer";
import type { FoodItem, MealDefinition, MealEntry, MealId } from "@/shared/models";
import { pdfStyles as styles } from "./PdfDoc.styles";

export function PdfDoc({ foods, meals, mealDefs, totals, dayType }: PDFProps) {
    const map = new Map(foods.map((f) => [f.id, f]));

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <Text style={styles.title}>Diet Planner - Meal Export</Text>
                <Text style={styles.sub}>Day type: {dayType}</Text>
                <Text style={styles.sub}>
                    Total: {Math.round(totals.kcal)} kcal, {Math.round(totals.protein)} g protein
                </Text>

                {mealDefs.map((m) => {
                    const mealKey = String(m.id);
                    const entries = meals[m.id] ?? [];
                    const printable = entries
                        .map((e) => {
                            const f = map.get(e.foodId);
                            if (!f) return null;
                            const kcal = e.portion * f.kcalPerUnit;
                            const p = e.portion * f.proteinPerUnit;
                            return (
                                <View key={e.entryId} style={styles.row}>
                                    <Text style={styles.cellName}>{f.name}</Text>
                                    <Text style={styles.cell}>
                                        {e.portion}
                                        {f.unit}
                                    </Text>
                                    <Text style={styles.cell}>{Math.round(kcal)} kcal</Text>
                                    <Text style={styles.cell}>{Math.round(p)} g</Text>
                                </View>
                            );
                        })
                        .filter(Boolean);

                    return (
                        <View key={mealKey} style={styles.section}>
                            <Text style={styles.mealTitle}>{m.name.toUpperCase()}</Text>

                            {printable.length === 0 ? (
                                <Text style={styles.muted}>No items</Text>
                            ) : (
                                printable
                            )}
                        </View>
                    );
                })}
            </Page>
        </Document>
    );
}

type PDFProps = {
    foods: FoodItem[];
    meals: Record<MealId, MealEntry[]>;
    mealDefs: MealDefinition[];
    totals: { kcal: number; protein: number };
    dayType: string;
};
