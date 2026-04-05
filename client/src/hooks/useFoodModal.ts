"use client";

import { useCallback, useMemo, useState } from "react";
import type {
  CategoryId,
  FoodCategory,
  FoodId,
  FoodItem,
  Unit,
} from "@/shared/models";
import { clampInt } from "@/shared/utils";

export function useFoodModal({
  foodsById,
  categories,
  addFood,
  updateFood,
  removeFoodAndEntries,
}: FoodModalProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [editingFoodId, setEditingFoodId] = useState<FoodId | null>(null);

  const [name, setName] = useState("");
  const [categoryId, setCategoryId] = useState<CategoryId>("" as CategoryId);
  const [unit, setUnit] = useState<Unit>("g" as Unit);
  const [kcalPerUnit, setKcal] = useState<number>(0);
  const [proteinPerUnit, setProtein] = useState<number>(0);
  const [defaultPortion, setPortion] = useState<number>(100);

  const editingFood = editingFoodId
    ? (foodsById[String(editingFoodId)] ?? null)
    : null;

  const visibleCategories = useMemo(
    () =>
      (categories ?? [])
        .filter((c) => c.enabled)
        .slice()
        .sort((a, b) => a.order - b.order),
    [categories],
  );

  const openAdd = useCallback((catId: CategoryId) => {
    setModalMode("add");
    setEditingFoodId(null);

    setName("");
    setCategoryId(catId);
    setUnit("g" as Unit);
    setKcal(0);
    setProtein(0);
    setPortion(100);

    setModalOpen(true);
  }, []);

  const openEdit = useCallback((food: FoodItem) => {
    setModalMode("edit");
    setEditingFoodId(food.id);

    setName(food.name);
    setCategoryId(food.categoryId);
    setUnit(food.unit);
    setKcal(food.kcalPerUnit);
    setProtein(food.proteinPerUnit);
    setPortion(food.defaultPortion);

    setModalOpen(true);
  }, []);

  const closeFoodModal = useCallback(() => {
    setModalOpen(false);
  }, []);

  const saveFood = useCallback(() => {
    const payload: Omit<FoodItem, "id"> = {
      name: name.trim(),
      categoryId,
      unit,
      kcalPerUnit: Number(kcalPerUnit) || 0,
      proteinPerUnit: Number(proteinPerUnit) || 0,
      defaultPortion: clampInt(Number(defaultPortion), 0, 100000),
    };

    if (!payload.name || !String(payload.categoryId)) return;

    if (modalMode === "add") {
      addFood(payload);
    } else if (modalMode === "edit" && editingFoodId) {
      updateFood(editingFoodId, payload);
    }

    setModalOpen(false);
  }, [
    addFood,
    categoryId,
    defaultPortion,
    editingFoodId,
    kcalPerUnit,
    modalMode,
    name,
    proteinPerUnit,
    unit,
    updateFood,
  ]);

  const deleteEditingFood = useCallback(() => {
    if (!editingFoodId) return;
    removeFoodAndEntries(editingFoodId);
    setModalOpen(false);
  }, [editingFoodId, removeFoodAndEntries]);

  const canSave = name.trim().length > 0 && String(categoryId).length > 0;

  return {
    ui: {
      foodModalOpen: modalOpen,
      foodModalMode: modalMode,
      editingFood,
      editingFoodId,
      visibleCategories,
      foodForm: {
        name,
        categoryId,
        unit,
        kcalPerUnit,
        proteinPerUnit,
        defaultPortion,
        canSave,
      },
    },
    actions: {
      openAdd,
      openEdit,
      closeFoodModal,
      saveFood,
      deleteEditingFood,
      setFoodName: setName,
      setFoodCategoryId: setCategoryId,
      setFoodUnit: setUnit,
      setFoodKcal: setKcal,
      setFoodProtein: setProtein,
      setFoodDefaultPortion: setPortion,
    },
  };
}

type FoodModalProps = {
  foodsById: Record<string, FoodItem>;
  categories: FoodCategory[];
  addFood: (v: Omit<FoodItem, "id">) => void;
  updateFood: (foodId: FoodId, patch: Partial<Omit<FoodItem, "id">>) => void;
  removeFoodAndEntries: (foodId: FoodId) => void;
};
