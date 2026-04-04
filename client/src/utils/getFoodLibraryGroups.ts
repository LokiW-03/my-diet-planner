import type {
  CategoryFolder,
  CategoryId,
  FoodCategory,
  FoodItem,
  FolderId,
} from "@/shared/models";
import { getVisibleCategories } from "@/client/src/utils/getVisibleCategories";

export function getFoodLibraryGroups(
  categories: Record<CategoryId, FoodCategory>,
  foods: FoodItem[],
  foldersById: Record<FolderId, CategoryFolder>,
): FoodLibraryGroups {
  const visibleCats = getVisibleCategories(categories, foods);
  const enabledFolders = Object.values(foldersById)
    .filter((f) => f.enabled)
    .slice()
    .sort((a, b) => a.order - b.order);

  const enabledFolderIds = new Set(enabledFolders.map((f) => f.id));

  const categoriesByFolderId = new Map<FolderId, FoodCategory[]>();
  const unfiledCategories: FoodCategory[] = [];

  for (const cat of visibleCats) {
    if (cat.folderId && enabledFolderIds.has(cat.folderId)) {
      const list = categoriesByFolderId.get(cat.folderId) ?? [];
      list.push(cat);
      categoriesByFolderId.set(cat.folderId, list);
    } else {
      unfiledCategories.push(cat);
    }
  }

  const orderedCategories: FoodCategory[] = [];
  for (const folder of enabledFolders) {
    const list = categoriesByFolderId.get(folder.id) ?? [];
    list.sort((a, b) => a.order - b.order);
    orderedCategories.push(...list);
  }
  unfiledCategories.sort((a, b) => a.order - b.order);
  orderedCategories.push(...unfiledCategories);

  return {
    orderedCategories,
    orderedCategoryIds: orderedCategories.map((c) => c.id),
    folders: enabledFolders,
    categoriesByFolderId,
    unfiledCategories,
  };
}

export type FoodLibraryGroups = {
  orderedCategories: FoodCategory[];
  orderedCategoryIds: CategoryId[];
  folders: CategoryFolder[];
  categoriesByFolderId: Map<FolderId, FoodCategory[]>;
  unfiledCategories: FoodCategory[];
};
