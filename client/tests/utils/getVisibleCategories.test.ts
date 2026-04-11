import { describe, expect, it } from "vitest";
import type {
  CategoryId,
  FoodCategory,
  FoodId,
  FoodItem,
  FolderId,
  ProfileId,
} from "@/shared/models";
import { UNKNOWN_CATEGORY_ID } from "@/shared/defaults";
import { getVisibleCategories } from "@/client/src/utils/getVisibleCategories";

const categoryId = (s: string) => s as unknown as CategoryId;
const foodId = (s: string) => s as unknown as FoodId;
const profileId = (s: string) => s as unknown as ProfileId;

function cat(v: {
  id: CategoryId;
  name: string;
  order: number;
  enabled: boolean;
  folderId?: FolderId | null;
}): FoodCategory {
  return {
    id: v.id,
    profileId: profileId("profile:test"),
    name: v.name,
    order: v.order,
    enabled: v.enabled,
    folderId: v.folderId ?? null,
  };
}

function food(v: { id: string; categoryId: CategoryId }): FoodItem {
  return {
    id: foodId(v.id),
    name: "Food",
    categoryId: v.categoryId,
    unit: "g",
    kcalPerUnit: 1,
    proteinPerUnit: 1,
    fiberPerUnit: 0,
    defaultPortion: 100,
  };
}

describe("getVisibleCategories", () => {
  it("filters disabled categories and sorts by order", () => {
    const c1 = categoryId("cat:1");
    const c2 = categoryId("cat:2");

    const categories: Record<CategoryId, FoodCategory> = {
      [c1]: cat({ id: c1, name: "One", order: 2, enabled: true }),
      [c2]: cat({ id: c2, name: "Two", order: 1, enabled: true }),
      [categoryId("cat:disabled")]: cat({
        id: categoryId("cat:disabled"),
        name: "Disabled",
        order: 0,
        enabled: false,
      }),
      [UNKNOWN_CATEGORY_ID]: cat({
        id: UNKNOWN_CATEGORY_ID,
        name: "Unknown",
        order: 99,
        enabled: true,
      }),
    };

    const out = getVisibleCategories(categories, []);
    expect(out.map((c) => c.id)).toEqual([c2, c1]);
  });

  it("includes UNKNOWN_CATEGORY_ID only when it has foods", () => {
    const categories: Record<CategoryId, FoodCategory> = {
      [UNKNOWN_CATEGORY_ID]: cat({
        id: UNKNOWN_CATEGORY_ID,
        name: "Unknown",
        order: 0,
        enabled: true,
      }),
    };

    expect(getVisibleCategories(categories, []).length).toBe(0);

    const out = getVisibleCategories(categories, [
      food({ id: "food:x", categoryId: UNKNOWN_CATEGORY_ID }),
    ]);
    expect(out.map((c) => c.id)).toEqual([UNKNOWN_CATEGORY_ID]);
  });
});
