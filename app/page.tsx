"use client";

import { useMemo, useState } from "react";
import { FaUserCircle } from "react-icons/fa"
import dynamic from "next/dynamic";
import { usePlannerStore, computeTotals } from "@/client/src/hooks/store";
import type { CategoryId, FoodCategory, FoodItem, FoodId } from "@/shared/models";
import type { Category, MealKey } from "@/shared/defaults";
import { MEALS, DEFAULT_TARGETS } from "@/shared/defaults";
import { FoodModal } from "@/client/src/components/FoodModal";
import { UserProfilePanel } from "@/client/src/components/UserProfilePanel";
import { useProfile } from "@/client/src/hooks/useProfile";

const DndShell = dynamic(() => import("@/client/src/components/DndShell"), { ssr: false });

function computeMealTotals(foods: FoodItem[], meals: Record<MealKey, any[]>) {
  const map = new Map<FoodId, FoodItem>(foods.map((f) => [f.id, f]));
  const out = {} as Record<MealKey, { kcal: number; protein: number }>;

  for (const k of MEALS) {
    let kcal = 0, protein = 0;

    for (const e of meals[k]) {
      const f = map.get(e.foodId as FoodId);
      if (!f) continue;
      kcal += e.portion * f.kcalPerUnit;
      protein += e.portion * f.proteinPerUnit;
    }
    out[k] = { kcal, protein };
  }
  return out;
}

export default function Page() {
  const categories = usePlannerStore((s) => s.categories);
  const foods = usePlannerStore((s) => s.foods);
  const meals = usePlannerStore((s) => s.meals);

  const dayType = usePlannerStore((s) => s.dayType);
  const setDayType = usePlannerStore((s) => s.setDayType);

  const addFood = usePlannerStore((s) => s.addFood);
  const updateFood = usePlannerStore((s) => s.updateFood);
  const removeFood = usePlannerStore((s) => s.removeFood);

  const addEntryToMeal = usePlannerStore((s) => s.addEntryToMeal);
  const removeEntryFromMeal = usePlannerStore((s) => s.removeEntryFromMeal);
  const moveEntry = usePlannerStore((s) => s.moveEntry);
  const setEntryPortion = usePlannerStore((s) => s.setEntryPortion);

  const clearAllMeals = usePlannerStore((s) => s.clearAllMeals);

  const totals = useMemo(() => computeTotals(foods, meals), [foods, meals]);
  const mealTotals = useMemo(() => computeMealTotals(foods, meals), [foods, meals]);

  const { profile } = useProfile();
  const [showProfile, setShowProfile] = useState(false);

  const targets = useMemo(() => {
    return Object.values(profile.targets).slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [profile.targets]);

  // modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"add" | "edit">("add");
  const [categoryPreset, setCategoryPreset] = useState<CategoryId | undefined>(undefined);
  const [editingFoodId, setEditingFoodId] = useState<FoodId | null>(null);

  const editingFood = editingFoodId ? foods.find((f) => f.id === editingFoodId) ?? null : null;

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
          {DEFAULT_TARGETS.map((t) => (
            <button
              key={t.name}
              style={dayBtn(dayType === t.name)}
              onClick={() => setDayType(t.name)}
            >
              {t.name}
            </button>
          ))}
        </div>

        <DndShell
          categories={categories}
          foods={foods}
          meals={meals}
          mealTotals={mealTotals}
          totals={totals}
          dayType={dayType}
          onRemoveEntry={(meal, entryId) => removeEntryFromMeal(meal, entryId)}
          onPortionChange={(meal, entryId, portion) => setEntryPortion(meal, entryId, portion)}
          onEditFood={(foodId) => {
            const f = foods.find((x) => x.id === foodId);
            if (f) openEdit(f);
          }}
          openAdd={openAdd}
          openEdit={openEdit}
          addEntryToMeal={addEntryToMeal}
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
            ? () => {
              removeFood(editingFoodId);
              setModalOpen(false);
            }
            : undefined
        }
      />
    </div>
  );
}

const page: React.CSSProperties = { minHeight: "100vh" };
const topBar: React.CSSProperties = { height: 54, display: "flex", alignItems: "center", justifyContent: "center" };

const wrap: React.CSSProperties = { padding: 18, maxWidth: 1200, margin: "0 auto" };

const mainGrid: React.CSSProperties = { display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 16, alignItems: "start" };

const bottomBar: React.CSSProperties = { marginTop: 14, display: "flex", gap: 14, alignItems: "center" };
const summaryCard: React.CSSProperties = { border: "1px solid var(--card-border)", borderRadius: 14, padding: 14, minWidth: 220, background: "var(--card-bg)" };

const dayBtn = (active: boolean): React.CSSProperties => ({
  padding: "10px 18px",
  borderRadius: 12,
  border: "1px solid var(--btn-border)",
  background: active ? "var(--btn-bg)" : "var(--card-bg)",
  color: active ? "var(--btn-fg)" : "var(--background)",
  fontWeight: 900,
  opacity: 1,
});
