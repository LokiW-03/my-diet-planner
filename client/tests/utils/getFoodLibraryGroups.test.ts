import { describe, expect, it } from "vitest";
import type {
  CategoryFolder,
  CategoryId,
  FoodCategory,
  FoodItem,
  FolderId,
  ProfileId,
} from "@/shared/models";
import { getFoodLibraryGroups } from "@/client/src/utils/getFoodLibraryGroups";

const categoryId = (s: string) => s as unknown as CategoryId;
const folderId = (s: string) => s as unknown as FolderId;
const profileId = (s: string) => s as unknown as ProfileId;

function folder(v: {
  id: FolderId;
  name: string;
  order: number;
  enabled: boolean;
}): CategoryFolder {
  return {
    id: v.id,
    profileId: profileId("profile:test"),
    name: v.name,
    order: v.order,
    enabled: v.enabled,
  };
}

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

describe("getFoodLibraryGroups", () => {
  it("orders categories by enabled folders then unfiled, keeping per-order sorting", () => {
    const f0 = folderId("folder:0");
    const f1 = folderId("folder:1");
    const fDisabled = folderId("folder:disabled");

    const c1 = categoryId("cat:1");
    const c2 = categoryId("cat:2");
    const c3 = categoryId("cat:3");
    const c4 = categoryId("cat:4");
    const c5 = categoryId("cat:5");

    const foldersById: Record<FolderId, CategoryFolder> = {
      [f1]: folder({ id: f1, name: "F1", order: 1, enabled: true }),
      [f0]: folder({ id: f0, name: "F0", order: 0, enabled: true }),
      [fDisabled]: folder({
        id: fDisabled,
        name: "Off",
        order: 2,
        enabled: false,
      }),
    };

    const categories: Record<CategoryId, FoodCategory> = {
      [c1]: cat({ id: c1, name: "C1", order: 2, enabled: true, folderId: f0 }),
      [c2]: cat({ id: c2, name: "C2", order: 1, enabled: true, folderId: f0 }),
      [c3]: cat({ id: c3, name: "C3", order: 0, enabled: true, folderId: f1 }),
      [c4]: cat({
        id: c4,
        name: "C4",
        order: 10,
        enabled: true,
        folderId: null,
      }),
      // folder disabled => treated as unfiled
      [c5]: cat({
        id: c5,
        name: "C5",
        order: 5,
        enabled: true,
        folderId: fDisabled,
      }),
    };

    const foods: FoodItem[] = [];

    const out = getFoodLibraryGroups(categories, foods, foldersById);

    expect(out.folders.map((f) => f.id)).toEqual([f0, f1]);
    expect(out.orderedCategoryIds).toEqual([c2, c1, c3, c5, c4]);
    expect(out.unfiledCategories.map((c) => c.id)).toEqual([c5, c4]);

    expect(out.categoriesByFolderId.get(f0)?.map((c) => c.id)).toEqual([
      c2,
      c1,
    ]);
    expect(out.categoriesByFolderId.get(f1)?.map((c) => c.id)).toEqual([c3]);
    expect(out.categoriesByFolderId.has(fDisabled)).toBe(false);
  });
});
