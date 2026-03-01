"use client";

import { useMemo, useState } from "react";
import { FaUserCircle } from "react-icons/fa"
import dynamic from "next/dynamic";
import { usePlannerStore, computeTotals } from "@/client/src/hooks/store";
import type { CategoryId, FoodItem, FoodId, MealDefinition } from "@/shared/models";
import { FoodModal } from "@/client/src/components/FoodModal";
import { UserProfilePanel } from "@/client/src/components/UserProfilePanel";
import { useProfile } from "@/client/src/hooks/useProfile";

const DndShell = dynamic(() => import("@/client/src/components/DndShell"), { ssr: false });

function computeMealTotals(
  foods: FoodItem[],
  meals: Record<string, any[]>,
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
  const clearAllMeals = usePlannerStore((s) => s.clearAllMeals);

  const { profile, addFood, updateFood, removeFood } = useProfile();
  const [showProfile, setShowProfile] = useState(false);

  // All data comes from profile
  const foods = useMemo(() => Object.values(profile.foods), [profile.foods]);
  const categories = useMemo(() => Object.values(profile.categories), [profile.categories]);
  const targets = useMemo(
    () => Object.values(profile.targets).slice().sort((a, b) => a.name.localeCompare(b.name)),
    [profile.targets]
  );
  const mealDefs = useMemo(
    () => Object.values(profile.meals).filter((m) => m.enabled).sort((a, b) => a.order - b.order),
    [profile.meals]
  );

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
        <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
          <button style={dayBtn(showProfile)} onClick={() => setShowProfile((v) => !v)}>
            <FaUserCircle size={18} />
          </button>
          {targets.map((t) => (
            <button
              key={String(t.id)}
              style={dayBtn(dayType === String(t.id))}
              onClick={() => setDayType(String(t.id))}
            >
              {t.name}
            </button>
          ))}
        </div>

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
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh" };
const topBar: React.CSSProperties = { height: 54, display: "flex", alignItems: "center", justifyContent: "center" };

const wrap: React.CSSProperties = { padding: 18, maxWidth: 1200, margin: "0 auto" };

const dayBtn = (active: boolean): React.CSSProperties => ({
  padding: "10px 18px",
  borderRadius: 12,
  border: "1px solid var(--btn-border)",
  background: active ? "var(--btn-bg)" : "var(--card-bg)",
  color: active ? "var(--btn-fg)" : "var(--background)",
  fontWeight: 900,
  opacity: 1,
});
