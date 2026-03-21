"use client";

import { useCallback, useState } from "react";
import type { CategoryId, FoodId, FoodItem } from "@/shared/models";

export function useFoodModal({
  foodsById,
  addFood,
  updateFood,
  removeFoodAndEntries,
}: FoodModalProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingFoodId, setEditingFoodId] = useState<FoodId | null>(null);
  const [categoryPreset, setCategoryPreset] = useState<CategoryId | undefined>(
    undefined,
  );

  const editingFood = editingFoodId
    ? (foodsById[String(editingFoodId)] ?? null)
    : null;

  const openAdd = useCallback((catId: CategoryId) => {
    setModalMode("add");
    setCategoryPreset(catId);
    setEditingFoodId(null);
    setModalOpen(true);
  }, []);

  const openEdit = useCallback((food: FoodItem) => {
    setModalMode("edit");
    setCategoryPreset(undefined);
    setEditingFoodId(food.id);
    setModalOpen(true);
  }, []);

  const closeFoodModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const saveFood = useCallback(
    (v: Omit<FoodItem, "id">) => {
      if (modalMode === "add") {
        addFood(v);
        return;
      }

      if (modalMode === "edit" && editingFoodId) {
        updateFood(editingFoodId, v);
      }
    },
    [addFood, editingFoodId, modalMode, updateFood],
  );

  const deleteEditingFood = useCallback(() => {
    if (!editingFoodId) return;
    removeFoodAndEntries(editingFoodId);
    setModalOpen(false);
  }, [editingFoodId, removeFoodAndEntries]);

  return {
    ui: {
      foodModalOpen: modalOpen,
      foodModalMode: modalMode,
      categoryPreset,
      editingFood,
      editingFoodId,
    },
    actions: {
      openAdd,
      openEdit,
      closeFoodModal,
      saveFood,
      deleteEditingFood,
    },
  };
}

type FoodModalProps = {
  foodsById: Record<string, FoodItem>;
  addFood: (v: Omit<FoodItem, "id">) => void;
  updateFood: (foodId: FoodId, patch: Partial<Omit<FoodItem, "id">>) => void;
  removeFoodAndEntries: (foodId: FoodId) => void;
};
