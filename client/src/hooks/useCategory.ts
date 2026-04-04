"use client";

import { useCallback } from "react";
import type { CategoryId, FoodCategory, FolderId } from "@/shared/models";

export function useCategory({
  updateCategory,
  addCategory,
  removeCategory,
  reorderCategories,
}: CategoryProps) {
  const renameCategory = useCallback(
    (categoryId: CategoryId, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateCategory(categoryId, { name: trimmed });
    },
    [updateCategory],
  );

  const setCategoryFolder = useCallback(
    (categoryId: CategoryId, folderId: FolderId | null) => {
      updateCategory(categoryId, { folderId });
    },
    [updateCategory],
  );

  return {
    ui: {},
    actions: {
      renameCategory,
      setCategoryFolder,
      addCategory,
      removeCategory,
      reorderCategories,
    },
  };
}

type CategoryProps = {
  updateCategory: (
    categoryId: CategoryId,
    patch: Partial<Omit<FoodCategory, "id" | "profileId">>,
  ) => void;
  addCategory: (category: Omit<FoodCategory, "id">) => CategoryId;
  removeCategory: (categoryId: CategoryId) => void;
  reorderCategories: (categoryIds: CategoryId[]) => void;
};
