export const CATEGORIES = ["Proteins", "Veggies", "Carbs", "Others"] as const;
export type Category = (typeof CATEGORIES)[number];

export const MEALS = ["breakfast", "lunch", "postworkout", "dinner"] as const;
export type MealKey = (typeof MEALS)[number];

export const UNITS = ["g", "pc"] as const;
export type Unit = (typeof UNITS)[number];

export type FoodItem = {
    id: string;
    name: string;
    category: Category;

    unit: Unit;              // g or pc
    kcalPerUnit: number;     // per 1g or per 1pc
    proteinPerUnit: number;  // per 1g or per 1pc

    defaultPortion: number;  // e.g. 100g or 2 pcs
};

export type MealEntry = {
    entryId: string;  // unique per placement
    foodId: string;   // reference FoodItem.id
    portion: number;
};
