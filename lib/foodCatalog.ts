export type Unit = "g" | "pcs";

export type Option = {
    id: string;
    name: string;
    defaultQty?: number;
    defaultUnit?: Unit;
};

export const PROTEINS: Option[] = [
    { id: "beef", name: "Beef", defaultQty: 100, defaultUnit: "g" },
    { id: "pork", name: "Pork", defaultQty: 100, defaultUnit: "g" },
    { id: "chicken", name: "Chicken", defaultQty: 110, defaultUnit: "g" },
    { id: "eggs", name: "Eggs", defaultQty: 2, defaultUnit: "pcs" },
];

export const VEGGIES: Option[] = [
    { id: "broccoli", name: "Broccoli" },
    { id: "bokchoy", name: "Bok choy" },
    { id: "cabbage", name: "Cabbage" },
    { id: "spinach", name: "Spinach" },
];

export const CARBS: Option[] = [
    { id: "rice", name: "Rice" },
    { id: "dumplings", name: "Dumplings" },
    { id: "bread", name: "Bread" },
];

export const EXTRAS: Option[] = [
    { id: "protein_shake", name: "Protein shake", defaultQty: 1, defaultUnit: "pcs" },
    { id: "protein_yogurt", name: "Protein yogurt", defaultQty: 1, defaultUnit: "pcs" },
    { id: "babybel", name: "Babybel", defaultQty: 1, defaultUnit: "pcs" },
    { id: "cracker", name: "Cracker", defaultQty: 1, defaultUnit: "pcs" },
];

export type Nutrition = {
    kcalPerG?: number;
    proteinPerG?: number;
    kcalPerPc?: number;
    proteinPerPc?: number;
};

// Nutrition values adjusted to match diet plan PDF
export const NUTRITION: Record<string, Nutrition> = {
    // Proteins
    chicken: {
        // 110–120g = 190–200 kcal → ~1.67 kcal/g
        kcalPerG: 1.7,
        // ~23–25g protein per 120g → ~0.21 g/g
        proteinPerG: 0.21,
    },

    beef: {
        // Hotpot fatty beef: 263–319 kcal per 100g
        kcalPerG: 3.0,
        proteinPerG: 0.25,
    },

    pork: {
        // Hotpot pork: ~300 kcal per 100g
        kcalPerG: 3.0,
        proteinPerG: 0.25,
    },

    eggs: {
        // 2 eggs = ~140–160 kcal → ~75 kcal each
        kcalPerPc: 75,
        proteinPerPc: 6,
    },

    // Carbs
    rice: {
        // Plain cooked rice (~130 kcal per 100g)
        kcalPerG: 1.3,
        proteinPerG: 0.028,
    },

    dumplings: {
        // 190–201 kcal per 100g
        kcalPerG: 1.95,
        proteinPerG: 0.06,
    },

    bread_roll: {
        // Brioche roll: 122–123 kcal per piece
        kcalPerPc: 123,
        proteinPerPc: 4,
    },

    // Dairy / Supplements
    protein_yogurt: {
        // Fixed in PDF
        kcalPerPc: 142,
        proteinPerPc: 20,
    },

    protein_shake: {
        // Fixed in PDF
        kcalPerPc: 158,
        proteinPerPc: 25,
    },

    babybel: {
        // Fixed in PDF
        kcalPerPc: 66,
        proteinPerPc: 5,
    },

    cracker: {
        // Fixed in PDF
        kcalPerPc: 35,
        proteinPerPc: 1,
    },

    // Veggies (100g portions, boiled)
    broccoli: { kcalPerG: 0.25, proteinPerG: 0.02 },
    spinach: { kcalPerG: 0.23, proteinPerG: 0.03 },
    bokchoy: { kcalPerG: 0.25, proteinPerG: 0.02 },
    cabbage: { kcalPerG: 0.23, proteinPerG: 0.02 },
};

