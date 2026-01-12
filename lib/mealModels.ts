import type { Unit } from "./foodCatalog";

export type MealKey = "breakfast" | "lunch" | "postworkout" | "dinner";

export type CellSelection = {
    typeId: string;    // dropdown selection
    qty: number;       // numeric input
    unit: Unit;        // g or pcs
    userEditedQty?: boolean; // to decide whether to overwrite defaults
};

export type MealRowState = {
    protein: CellSelection;
    veggie: CellSelection;
    carbs: CellSelection;
    extra: CellSelection;
};

export type PlannerState = Record<MealKey, MealRowState>;
