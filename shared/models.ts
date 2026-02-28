import { Unit } from "./defaults";

export type MealId = string & { readonly __brand: "MealId" };
export type FoodId = string & { readonly __brand: "FoodId" };
export type TargetId = string & { readonly __brand: "TargetId" };
export type CategoryId = string & { readonly __brand: "CategoryId" };

export type FoodItem = {
    id: FoodId;
    name: string;
    categoryId: CategoryId;

    unit: Unit;              // g or pc
    kcalPerUnit: number;     // per 1g or per 1pc
    proteinPerUnit: number;  // per 1g or per 1pc

    defaultPortion: number;  // e.g. 100g or 2 pcs
};

export type MealEntry = {
    entryId: string;  // unique per placement
    foodId: FoodId;   // reference FoodItem.id
    portion: number;
};

export type MealDefinition = {
    id: MealId;
    name: string;
    order: number;    // UI order
    enabled: boolean;
}

export type UserProfile = {
    userId: string;
    userName: string;
    weightKg: number;
    targets: Record<TargetId, Target>;
    meals: Record<MealId, MealDefinition>;
    foods: Record<FoodId, FoodItem>;
};

export type Target = {
    id: TargetId;
    name: string;
    minKcal: number;
    maxKcal: number;
};


export type FoodCategory = {
    id: CategoryId;
    profileId: string; // or ProfileId if you brand it later
    name: string;
    order: number;
    enabled: boolean;
};