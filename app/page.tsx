"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { usePlannerStore, computeTotals } from "@/client/src/hooks/store";
import type { CategoryId, FoodItem, FoodId, MealDefinition, MealEntry } from "@/shared/models";
import { FoodModal } from "@/client/src/components/FoodModal";
import { UserProfilePanel } from "@/client/src/components/UserProfilePanel";
import { useProfile } from "@/client/src/hooks/useProfile";
import { TopToolBar } from "@/client/src/components/TopToolBar/TopToolBar";

const DndShell = dynamic(() => import("@/client/src/components/DndShell"), { ssr: false });

function computeMealTotals(
  foods: FoodItem[],
  meals: Record<string, MealEntry[]>,
  mealDefs: MealDefinition[]
) {
  const map = new Map<FoodId, FoodItem>(foods.map((f) => [f.id, f]));
  const out = {} as Record<string, { kcal: number; protein: number }>;

  for (const m of mealDefs) {
    const key = String(m.id);
    let kcal = 0, protein = 0;
    for (const e of meals[key] ?? []) {
      const f = map.get(e.foodId as FoodId);
      if (!f) continue;
      kcal += e.portion * f.kcalPerUnit;
      protein += e.portion * f.proteinPerUnit;
    }
    out[key] = { kcal, protein };
  }
  return out;
}

export default function Page() {
  const meals = usePlannerStore((s) => s.meals);
  const dayType = usePlannerStore((s) => s.dayType);
  const setDayType = usePlannerStore((s) => s.setDayType);
  const addEntryToMeal = usePlannerStore((s) => s.addEntryToMeal);
  const removeEntryFromMeal = usePlannerStore((s) => s.removeEntryFromMeal);
  const moveEntry = usePlannerStore((s) => s.moveEntry);
  const setEntryPortion = usePlannerStore((s) => s.setEntryPortion);
  const removeEntriesForFood = usePlannerStore((s) => s.removeEntriesForFood);
  const removeMeal = usePlannerStore((s) => s.removeMeal);
  const hiddenMeals = usePlannerStore((s) => s.hiddenMeals);
  const resetHiddenMeals = usePlannerStore((s) => s.resetHiddenMeals);
  const mealPanelOrder = usePlannerStore((s) => s.mealPanelOrder);
  const setMealPanelOrder = usePlannerStore((s) => s.setMealPanelOrder);
  const resetMealPanelOrder = usePlannerStore((s) => s.resetMealPanelOrder);
  const clearAllMeals = usePlannerStore((s) => s.clearAllMeals);

  const { profile, addFood, updateFood, removeFood, addMeal, disableMeal, resetMealPanelsToDefault, saveMealPanelsAsDefault } = useProfile();
  const [showProfile, setShowProfile] = useState(false);

  // All data comes from profile
  const foods = useMemo(() => Object.values(profile.foods), [profile.foods]);
  const categories = useMemo(() => Object.values(profile.categories), [profile.categories]);
  const targets = useMemo(
    () => Object.values(profile.targets).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [profile.targets]
  );
  const mealDefs = useMemo(() => {
    const profileDefs = Object.values(profile.meals).filter((m) => m.enabled);

    const defs = [...profileDefs].filter((m) => !hiddenMeals[String(m.id)]);


    if (mealPanelOrder.length === 0) {
      return defs.sort((a, b) => a.order - b.order);
    }

    const idx = new Map(mealPanelOrder.map((id, i) => [id, i]));
    return defs.sort((a, b) => {
      const ai = idx.get(String(a.id)) ?? Number.POSITIVE_INFINITY;
      const bi = idx.get(String(b.id)) ?? Number.POSITIVE_INFINITY;
      if (ai !== bi) return ai - bi;
      return a.order - b.order;;
    });

  }, [profile.meals, hiddenMeals, mealPanelOrder]);

  const handleInsertMealPanel = (index: number) => {
    const name = window.prompt("Meal name?");
    if (!name) return;

    const trimmed = name.trim();
    if (!trimmed) return;

    const newId = addMeal({
      name: trimmed,
      enabled: true,
      order: 10_000,
    });

    // insert into current visual order
    const ids = mealDefs.map((m) => String(m.id));
    const clamped = Math.max(0, Math.min(index, ids.length));
    ids.splice(clamped, 0, String(newId));
    setMealPanelOrder(ids);
  };

  const totals = useMemo(() => computeTotals(foods, meals), [foods, meals]);
  const mealTotals = useMemo(() => computeMealTotals(foods, meals, mealDefs), [foods, meals, mealDefs]);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [categoryPreset, setCategoryPreset] = useState<CategoryId | undefined>(undefined);
  const [editingFoodId, setEditingFoodId] = useState<FoodId | null>(null);

  const editingFood = editingFoodId ? (profile.foods[editingFoodId] ?? null) : null;

  function openAdd(catId: CategoryId) {
    setModalMode("add");
    setCategoryPreset(catId);
    setEditingFoodId(null);
    setModalOpen(true);
  }

  function openEdit(food: FoodItem) {
    setModalMode("edit");
    setCategoryPreset(undefined);
    setEditingFoodId(food.id);
    setModalOpen(true);
  }

  function handleRemoveFood(foodId: FoodId) {
    removeFood(foodId);
    removeEntriesForFood(foodId);
    setModalOpen(false);
  }

  return (
    <div style={{ ...page, background: "var(--background)" }}>
      <header style={{ ...topBar, background: "var(--topbar-bg)", color: "var(--topbar-fg)" }}>
        <div style={{ fontWeight: 900, fontSize: 18 }}>Diet-Planner</div>
      </header>

      <div style={wrap}>

        <TopToolBar
          showProfile={showProfile}
          onToggleProfile={() => setShowProfile((v) => !v)}
          targets={targets}
          dayType={dayType}
          onDayTypeChange={setDayType}
          onSaveDefaults={() => void saveMealPanelsAsDefault(mealDefs.map((m) => m.id))}
          onReset={() => {
            resetMealPanelsToDefault();
            resetHiddenMeals();
            resetMealPanelOrder();
          }}
        />

        <DndShell
          foods={foods}
          meals={meals}
          mealDefs={mealDefs}
          mealTotals={mealTotals}
          totals={totals}
          dayType={dayType}
          targets={targets}
          weightKg={profile.weightKg}
          onRemoveEntry={(mealId, entryId) => removeEntryFromMeal(mealId, entryId)}
          onPortionChange={(mealId, entryId, portion) => setEntryPortion(mealId, entryId, portion)}
          onEditFood={(foodId) => {
            const f = profile.foods[foodId];
            if (f) openEdit(f);
          }}
          onRemoveMeal={(mealId) => {
            disableMeal(mealId);
            removeMeal(mealId);    // clear chips/entries
          }}
          onReorderMealPanels={(nextOrder) => setMealPanelOrder(nextOrder)}
          onInsertMealPanel={handleInsertMealPanel}
          openAdd={openAdd}
          openEdit={openEdit}
          addEntryToMeal={(mealId, foodId) => {
            const food = profile.foods[foodId];
            addEntryToMeal(mealId, foodId, food?.defaultPortion ?? 100);
          }}
          moveEntry={moveEntry}
          clearAll={clearAllMeals}
        />
      </div>

      <UserProfilePanel
        open={showProfile}
        onClose={() => setShowProfile(false)} />

      <FoodModal
        open={modalOpen}
        mode={modalMode}
        categories={categories}
        categoryPreset={categoryPreset}
        food={editingFood}
        onClose={() => setModalOpen(false)}
        onSave={(v) => {
          if (modalMode === "add") addFood(v);
          else if (editingFoodId) updateFood(editingFoodId, v);
        }}
        onDelete={
          modalMode === "edit" && editingFoodId
            ? () => handleRemoveFood(editingFoodId)
            : undefined
        }
      />
    </div >
  );
}

const page: React.CSSProperties = { minHeight: "100vh" };
const topBar: React.CSSProperties = { height: 54, display: "flex", alignItems: "center", justifyContent: "center" };
const wrap: React.CSSProperties = { padding: 18, maxWidth: 1200, margin: "0 auto" };