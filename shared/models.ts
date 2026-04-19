export type MealId = string & { readonly __brand: "MealId" };
export type FoodId = string & { readonly __brand: "FoodId" };
export type TargetId = string & { readonly __brand: "TargetId" };
export type CategoryId = string & { readonly __brand: "CategoryId" };
export type UserId = string & { readonly __brand: "UserId" };
export type ProfileId = string & { readonly __brand: "ProfileId" };
export type FolderId = string & { readonly __brand: "FolderId" };

export const UNITS = ["g", "pc"] as const;
export type Unit = (typeof UNITS)[number];

export type IsoDateString = string & { readonly __brand: "IsoDateString" }; // YYYY-MM-DD

export type FoodItem = {
  id: FoodId;
  name: string;
  categoryId: CategoryId;

  unit: Unit; // g or pc
  kcalPerUnit: number; // per 1g or per 1pc
  proteinPerUnit: number; // per 1g or per 1pc
  fiberPerUnit: number; // per 1g or per 1pc

  defaultPortion: number; // e.g. 100g or 2 pcs
};

export type MealEntry = {
  entryId: string; // unique per placement
  foodId: FoodId; // reference FoodItem.id
  portion: number;
};

export type MealDefinition = {
  id: MealId;
  name: string;
  order: number; // UI order
  enabled: boolean;
};

export type UserProfile = {
  userId: UserId;
  profileId: ProfileId;
  userName: string;
  weightKg: number;
  targets: Record<TargetId, Target>;
  meals: Record<MealId, MealDefinition>;
  folders: Record<FolderId, CategoryFolder>;
  categories: Record<CategoryId, FoodCategory>;
  foods: Record<FoodId, FoodItem>;
  schedule: TargetSchedule;
};

export type TargetScheduleRule = {
  id: string;
  targetId: TargetId;
  dtstart: IsoDateString;
  rrule: string; // RFC5545 RRULE string (e.g. FREQ=WEEKLY;BYDAY=MO,WE,FR).
  enabled: boolean;
  priority: number; // Higher wins when multiple rules match the same day.
  createdAt: string; // ISO datetime
};

export type TargetSchedule = {
  rules: TargetScheduleRule[];
  overridesByDate: Record<IsoDateString, TargetId | null>;
};

export type Target = {
  id: TargetId;
  name: string;
  minKcal: number;
  maxKcal: number;
};

export type FoodCategory = {
  id: CategoryId;
  profileId: ProfileId;
  name: string;
  order: number;
  enabled: boolean;
  folderId: FolderId | null;
};

export type CategoryFolder = {
  id: FolderId;
  profileId: ProfileId;
  name: string;
  order: number;
  enabled: boolean;
};
