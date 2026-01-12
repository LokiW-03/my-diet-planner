"use client";

import { useMemo, useState } from "react";
import { FoodCell } from "@/components/FoodCell";
import { DayTypePicker } from "@/components/DayTypePicker";
import { CARBS, EXTRAS, PROTEINS, VEGGIES, type Unit, type Option, NUTRITION } from "@/lib/foodCatalog";
import type { MealKey } from "@/lib/mealModels";
import { TARGETS } from "@/lib/targets";

/**
 * Assumed IDs in foodCatalog.ts:
 * - breakfast protein: "protein_yogurt"
 * - breakfast carbs: "bread_roll"
 * - postworkout protein options: "protein_yogurt", "protein_shake"
 * - proteins: "beef", "pork", "chicken", "eggs"
 * - carbs: "rice", "dumplings" (bread options may exist but will be filtered out for lunch/dinner)
 * - extras: include "protein_yogurt"; "protein_shake" exists but will be filtered out for lunch/dinner extras
 */

// Meals
const MEALS: { key: MealKey; title: string }[] = [
  { key: "breakfast", title: "Breakfast" },
  { key: "lunch", title: "Lunch" },
  { key: "postworkout", title: "Post-workout" },
  { key: "dinner", title: "Dinner" },
];

// Breakfast & post-workout only show protein + carbs
const MEAL_COLUMNS: Record<
  MealKey,
  { protein: boolean; veggie: boolean; carbs: boolean; extra: boolean }
> = {
  breakfast: { protein: true, veggie: false, carbs: true, extra: false },
  lunch: { protein: true, veggie: true, carbs: true, extra: true },
  postworkout: { protein: true, veggie: false, carbs: true, extra: false },
  dinner: { protein: true, veggie: true, carbs: true, extra: true },
};

type CellSelection = {
  typeId: string;
  qty: number;
  unit: Unit;
  userEditedQty?: boolean;
};

type MealRowState = {
  protein: CellSelection; // main protein (meat) OR post-workout protein
  protein2?: CellSelection; // dinner only (eggs)
  veggie: CellSelection;
  carbs: CellSelection;
  extra: CellSelection;
};

type PlannerStateLocal = Record<MealKey, MealRowState>;

// "None" option
const NONE: Option = { id: "none", name: "None", defaultQty: 0, defaultUnit: "g" };

// Fixed breakfast
const FIXED_BREAKFAST = {
  protein: { typeId: "protein_yogurt", qty: 1, unit: "pcs" as Unit },
  carbs: { typeId: "bread_roll", qty: 1, unit: "pcs" as Unit },
};

// Postworkout protein options
const POSTWORKOUT_PROTEIN_IDS = ["protein_yogurt", "protein_shake"];

// Defaults requested
const DEFAULTS = {
  veggieG: 100,
  riceG: 80,
  dumplingsG: 40,
  extraYogurtPack: 1,
};

function findOption(options: Option[], id: string) {
  return options.find((o) => o.id === id);
}

function makeInitialState(): PlannerStateLocal {
  const beef = findOption(PROTEINS, "beef") ?? PROTEINS[0];
  const broccoli = VEGGIES[0];
  const rice = findOption(CARBS, "rice") ?? CARBS[0];

  // Default extra to None
  const extra = NONE;
  const eggs = findOption(PROTEINS, "eggs");

  const row = (): MealRowState => ({
    protein: {
      typeId: beef.id,
      qty: beef.defaultQty ?? 100,
      unit: (beef.defaultUnit ?? "g") as Unit,
      userEditedQty: false,
    },
    veggie: { typeId: broccoli.id, qty: DEFAULTS.veggieG, unit: "g", userEditedQty: false },
    carbs: { typeId: rice.id, qty: DEFAULTS.riceG, unit: "g", userEditedQty: false },
    extra: { typeId: extra.id, qty: 0, unit: "g", userEditedQty: false },
    // protein2 (eggs) is only applied to dinner below
  });

  const base: PlannerStateLocal = {
    breakfast: row(),
    lunch: row(),
    postworkout: row(),
    dinner: row(),
  };

  // Force breakfast fixed
  base.breakfast.protein = { ...FIXED_BREAKFAST.protein, userEditedQty: false };
  base.breakfast.carbs = { ...FIXED_BREAKFAST.carbs, userEditedQty: false };
  base.breakfast.veggie.qty = 0;
  base.breakfast.extra.qty = 0;

  // Postworkout: default protein shake 1 bottle, carbs default none/0
  base.postworkout.protein = { typeId: "protein_shake", qty: 1, unit: "pcs", userEditedQty: false };
  base.postworkout.carbs = { typeId: "none", qty: 0, unit: "g", userEditedQty: false };
  base.postworkout.veggie.qty = 0;
  base.postworkout.extra.qty = 0;

  // Add eggs as protein2 only to dinner
  if (eggs) {
    base.dinner.protein2 = {
      typeId: eggs.id,
      qty: eggs.defaultQty ?? 2,
      unit: (eggs.defaultUnit ?? "pcs") as Unit,
      userEditedQty: false,
    };
  }

  return base;
}

function FixedCell(props: { label: string; name: string; qty: number; unit: Unit }) {
  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ fontSize: 12, opacity: 0.75 }}>{props.label}</div>
      <div
        style={{
          padding: 10,
          borderRadius: 6,
          border: "1px solid #444",
          background: "#0b0b0b",
          color: "#fff",
        }}
      >
        {props.name}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <div
          style={{
            width: "100%",
            padding: 10,
            borderRadius: 6,
            border: "1px solid #444",
            background: "#0b0b0b",
            color: "#fff",
          }}
        >
          {props.qty}
        </div>
        <div
          style={{
            minWidth: 80,
            padding: 10,
            borderRadius: 6,
            border: "1px solid #444",
            background: "#0b0b0b",
            color: "#bbb",
            display: "grid",
            placeItems: "center",
          }}
        >
          {props.unit}
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [planner, setPlanner] = useState<PlannerStateLocal>(() => makeInitialState());



  const extrasById = useMemo(() => new Map(EXTRAS.map((e) => [e.id, e.name])), []);
  const carbsById = useMemo(() => new Map(CARBS.map((c) => [c.id, c.name])), []);

  const calcCellNutrition = (cell: CellSelection | undefined) => {
    if (!cell) return { kcal: 0, protein: 0 };
    if (cell.typeId === "none") return { kcal: 0, protein: 0 };
    const n = NUTRITION[cell.typeId] ?? {};
    if (cell.unit === "g") {
      const kcal = (n.kcalPerG ?? 0) * cell.qty;
      const protein = (n.proteinPerG ?? 0) * cell.qty;
      return { kcal, protein };
    }
    // pcs
    const kcal = (n.kcalPerPc ?? 0) * cell.qty;
    const protein = (n.proteinPerPc ?? 0) * cell.qty;
    return { kcal, protein };
  };

  const perMealTotals = useMemo(() => {
    const result: Record<string, { kcal: number; protein: number }> = {};
    const mealKeys: MealKey[] = ["breakfast", "lunch", "postworkout", "dinner"];
    let totalK = 0;
    let totalP = 0;

    for (const k of mealKeys) {
      const r = planner[k];
      const cells = [r.protein, r.protein2, r.veggie, r.carbs, r.extra];
      let kcal = 0;
      let protein = 0;
      for (const c of cells) {
        const v = calcCellNutrition(c as CellSelection | undefined);
        kcal += v.kcal;
        protein += v.protein;
      }
      result[k] = { kcal, protein };
      totalK += kcal;
      totalP += protein;
    }

    result.total = { kcal: totalK, protein: totalP };
    return result as Record<string, { kcal: number; protein: number }>;
  }, [planner]);

  // Postworkout protein options from EXTRAS (yogurt/shake) + None
  const postworkoutProteinOptions = useMemo(() => {
    const opts = EXTRAS.filter((e) => POSTWORKOUT_PROTEIN_IDS.includes(e.id));
    return [NONE, ...opts];
  }, []);

  // Lunch/Dinner carbs: exclude bread options; keep rice/dumplings etc (NO bread) — and NO "None" (you always pick carbs or set qty 0)
  const lunchDinnerCarbOptions = useMemo(() => {
    const banned = new Set(["bread", "bread_roll", "brioche"]);
    return CARBS.filter((c) => !banned.has(c.id));
  }, []);

  // Postworkout carbs can be None + (optionally) carbs list
  const postworkoutCarbOptions = useMemo(() => {
    // You can also filter bread here if you don’t want it post-workout
    const banned = new Set(["bread", "bread_roll", "brioche"]);
    return [NONE, ...CARBS.filter((c) => !banned.has(c.id))];
  }, []);

  // Lunch/Dinner extras: exclude protein_shake; include None; default protein_yogurt (1 pack)
  const lunchDinnerExtraOptions = useMemo(() => {
    const base = EXTRAS.filter((e) => e.id !== "protein_shake");
    return [NONE, ...base];
  }, []);

  // Dinner main proteins: meat options (exclude eggs from main protein dropdown)
  const dinnerMainProteinOptions = useMemo(() => PROTEINS.filter((p) => p.id !== "eggs"), []);
  const eggsOption = useMemo(() => PROTEINS.find((p) => p.id === "eggs"), []);

  // Defaults for carbs (rice 80g, dumplings 40g, none => 0)
  const applyCarbDefault = (typeId: string, prev: CellSelection): CellSelection => {
    if (prev.userEditedQty) return { ...prev, typeId };

    if (typeId === "none") return { typeId, qty: 0, unit: "g", userEditedQty: false };
    if (typeId === "rice") return { typeId, qty: DEFAULTS.riceG, unit: "g", userEditedQty: false };
    if (typeId === "dumplings") return { typeId, qty: DEFAULTS.dumplingsG, unit: "g", userEditedQty: false };

    return { ...prev, typeId, unit: "g" };
  };

  // Veggie default 100g
  const applyVeggieDefault = (typeId: string, prev: CellSelection): CellSelection => {
    if (prev.userEditedQty) return { ...prev, typeId };
    return { typeId, qty: DEFAULTS.veggieG, unit: "g", userEditedQty: false };
  };

  // Extra default: None => 0, protein yogurt => 1 pack
  const applyExtraDefault = (typeId: string, prev: CellSelection): CellSelection => {
    if (prev.userEditedQty) return { ...prev, typeId };

    if (typeId === "none") return { typeId, qty: 0, unit: "g", userEditedQty: false };
    if (typeId === "protein_yogurt")
      return { typeId, qty: DEFAULTS.extraYogurtPack, unit: "pcs", userEditedQty: false };

    return { ...prev, typeId };
  };

  // Day type (currently does not change planner values)
  const [dayType, setDayType] = useState<"FULL" | "HALF" | "REST">("FULL");

  return (
    <main className="planner-main">
      <h1 style={{ fontSize: 24, marginBottom: 16 }}>Diet Planner (UI v1)</h1>

      <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 13, opacity: 0.85 }}>Day type:</div>
        <DayTypePicker value={dayType} onChange={(v) => setDayType(v)} />
      </div>

      {/* Column headers (kept consistent for alignment) */}
      <div className="planner-grid">
        <div />
        <div className="planner-header">Protein</div>
        <div className="planner-header">Veggie</div>
        <div className="planner-header">Carbs</div>
        <div className="planner-header">Extra</div>
        <div className="planner-header">Kcal · Protein</div>
      </div>

      <div style={{ height: 12 }} />

      {/* Rows */}
      <div style={{ display: "grid", gap: 12 }}>
        {MEALS.map(({ key, title }) => {
          const row = planner[key];
          const visible = MEAL_COLUMNS[key];

          const isBreakfast = key === "breakfast";
          const isPostworkout = key === "postworkout";
          const isLunch = key === "lunch";
          const isDinner = key === "dinner";

          return (
            <div key={key} className="planner-grid">
              <div className="planner-mealLabel">{title}</div>

              {/* Protein column */}
              {visible.protein ? (
                <div className="planner-card">
                  {isBreakfast ? (
                    <FixedCell
                      label="Protein"
                      name={extrasById.get(FIXED_BREAKFAST.protein.typeId) ?? "Protein yogurt"}
                      qty={FIXED_BREAKFAST.protein.qty}
                      unit={FIXED_BREAKFAST.protein.unit}
                    />
                  ) : isPostworkout ? (
                    <FoodCell
                      label="Protein"
                      options={postworkoutProteinOptions}
                      value={row.protein}
                      userEditedQty={!!row.protein.userEditedQty}
                      unitMode="fixed-pcs"
                      applyDefaultsOnTypeChange={false}
                      onChange={(next) =>
                        setPlanner((p) => {
                          // None => 0; yogurt/shake => always 1 pack/bottle
                          const isNone = next.typeId === "none";
                          return {
                            ...p,
                            postworkout: {
                              ...p.postworkout,
                              protein: {
                                ...p.postworkout.protein,
                                ...next,
                                qty: isNone ? 0 : 1,
                                unit: "pcs",
                                userEditedQty: false,
                              },
                            },
                          };
                        })
                      }
                    />
                  ) : isDinner ? (
                    <div style={{ display: "grid", gap: 16 }}>
                      {/* Dinner protein 1: meat */}
                      <FoodCell
                        label="Protein (Meat)"
                        options={dinnerMainProteinOptions}
                        value={row.protein}
                        userEditedQty={!!row.protein.userEditedQty}
                        unitMode="fixed-g"
                        applyDefaultsOnTypeChange={true}
                        onChange={(next) =>
                          setPlanner((p) => ({
                            ...p,
                            dinner: {
                              ...p.dinner,
                              protein: {
                                ...p.dinner.protein,
                                ...next,
                                unit: "g",
                              },
                            },
                          }))
                        }
                      />

                      {/* Dinner protein 2: eggs (always available as second protein if in catalog) */}
                      {eggsOption ? (
                        <FoodCell
                          label="Protein (Eggs)"
                          options={[eggsOption]}
                          value={
                            row.protein2 ?? { typeId: "eggs", qty: 2, unit: "pcs", userEditedQty: false }
                          }
                          userEditedQty={!!row.protein2?.userEditedQty}
                          unitMode="fixed-pcs"
                          applyDefaultsOnTypeChange={true}
                          onChange={(next) =>
                            setPlanner((p) => ({
                              ...p,
                              dinner: {
                                ...p.dinner,
                                protein2: {
                                  ...(p.dinner.protein2 ?? { typeId: "eggs", qty: 2, unit: "pcs" as Unit }),
                                  ...next,
                                  typeId: "eggs",
                                  unit: "pcs",
                                },
                              },
                            }))
                          }
                        />
                      ) : (
                        <div style={{ fontSize: 12, opacity: 0.8 }}>
                          (Add an "eggs" option to PROTEINS in foodCatalog.ts to enable dinner 2nd protein)
                        </div>
                      )}
                    </div>
                  ) : (
                    <FoodCell
                      label="Protein"
                      options={PROTEINS}
                      value={row.protein}
                      userEditedQty={!!row.protein.userEditedQty}
                      unitMode="g-or-pcs"
                      applyDefaultsOnTypeChange={true}
                      onChange={(next) =>
                        setPlanner((p) => ({
                          ...p,
                          [key]: { ...p[key], protein: { ...p[key].protein, ...next } },
                        }))
                      }
                    />
                  )}
                </div>
              ) : (
                <div />
              )}

              {/* Veggie */}
              {visible.veggie ? (
                <div className="planner-card">
                  <FoodCell
                    label="Veggie"
                    options={VEGGIES}
                    value={row.veggie}
                    userEditedQty={!!row.veggie.userEditedQty}
                    unitMode="fixed-g"
                    onChange={(next) =>
                      setPlanner((p) => ({
                        ...p,
                        [key]: {
                          ...p[key],
                          veggie: applyVeggieDefault(next.typeId, { ...p[key].veggie, ...next, unit: "g" }),
                        },
                      }))
                    }
                  />
                </div>
              ) : (
                <div />
              )}

              {/* Carbs */}
              {visible.carbs ? (
                <div className="planner-card">
                  {isBreakfast ? (
                    <FixedCell
                      label="Carbs"
                      name={carbsById.get(FIXED_BREAKFAST.carbs.typeId) ?? "Bread roll"}
                      qty={FIXED_BREAKFAST.carbs.qty}
                      unit={FIXED_BREAKFAST.carbs.unit}
                    />
                  ) : (
                    <FoodCell
                      label="Carbs"
                      options={isPostworkout ? postworkoutCarbOptions : isLunch || isDinner ? lunchDinnerCarbOptions : CARBS}
                      value={row.carbs}
                      userEditedQty={!!row.carbs.userEditedQty}
                      unitMode="fixed-g"
                      applyDefaultsOnTypeChange={false}
                      onChange={(next) =>
                        setPlanner((p) => ({
                          ...p,
                          [key]: {
                            ...p[key],
                            carbs: applyCarbDefault(next.typeId, { ...p[key].carbs, ...next, unit: "g" }),
                          },
                        }))
                      }
                    />
                  )}
                </div>
              ) : (
                <div />
              )}

              {/* Extra (lunch/dinner only) */}
              {visible.extra ? (
                <div className="planner-card">
                  <FoodCell
                    label="Extra"
                    options={isLunch || isDinner ? lunchDinnerExtraOptions : EXTRAS}
                    value={row.extra}
                    userEditedQty={!!row.extra.userEditedQty}
                    unitMode="g-or-pcs"
                    applyDefaultsOnTypeChange={false}
                    onChange={(next) =>
                      setPlanner((p) => ({
                        ...p,
                        [key]: {
                          ...p[key],
                          extra: applyExtraDefault(next.typeId, { ...p[key].extra, ...next }),
                        },
                      }))
                    }
                  />
                </div>
              ) : (
                <div />
              )}
              {/* Per-meal nutrition summary */}
              <div className="planner-card planner-nutrition">
                <div style={{ fontSize: 14, fontWeight: 600 }}>{Math.round(perMealTotals[key].kcal)} kcal</div>
                <div style={{ fontSize: 12, opacity: 0.85 }}>{Math.round(perMealTotals[key].protein)} g protein</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 12 }} />

      {/* Totals row */}
      <div className="planner-grid">
        <div className="planner-mealLabel">Total</div>
        <div />
        <div />
        <div />
        <div />
        <div className="planner-card planner-nutrition">
          <div style={{ fontSize: 16, fontWeight: 700 }}>{Math.round(perMealTotals.total.kcal)} kcal</div>
          <div style={{ fontSize: 13, opacity: 0.9 }}>{Math.round(perMealTotals.total.protein)} g protein</div>
        </div>
      </div>

      <div style={{ height: 12 }} />

      {/* Debug output */}
      <pre
        style={{
          whiteSpace: "pre-wrap",
          padding: 16,
          borderRadius: 12,
          background: "#0b0b0b",
          border: "1px solid #2a2a2a",
        }}
      >
        {JSON.stringify(planner, null, 2)}
      </pre>
    </main>
  );
}
