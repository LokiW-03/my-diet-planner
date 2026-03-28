"use client";

import { useMemo } from "react";
import {
  computeMealTotals,
  computeTotals,
} from "@/client/src/utils/computeTotals";
import type { MealEntry, MealId, TargetId, UserProfile } from "@/shared/models";

export function useModel({
  profile,
  plannerState,
}: {
  profile: UserProfile;
  plannerState: PlannerState;
}) {
  const foods = useMemo(() => Object.values(profile.foods), [profile.foods]);
  const categoriesById = profile.categories;
  const categories = useMemo(
    () => Object.values(profile.categories),
    [profile.categories],
  );
  const targets = useMemo(
    () =>
      Object.values(profile.targets)
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name)),
    [profile.targets],
  );

  const mealDefs = useMemo(() => {
    const profileDefs = Object.values(profile.meals).filter((m) => m.enabled);
    const defs = [...profileDefs].filter(
      (m) => !plannerState.hiddenMeals[m.id],
    );

    if (plannerState.mealPanelOrder.length === 0) {
      return defs.sort((a, b) => a.order - b.order);
    }

    const idx = new Map(plannerState.mealPanelOrder.map((id, i) => [id, i]));
    return defs.sort((a, b) => {
      const ai = idx.get(a.id) ?? Number.POSITIVE_INFINITY;
      const bi = idx.get(b.id) ?? Number.POSITIVE_INFINITY;
      if (ai !== bi) return ai - bi;
      return a.order - b.order;
    });
  }, [profile.meals, plannerState.hiddenMeals, plannerState.mealPanelOrder]);

  const totals = useMemo(
    () =>
      computeTotals(
        foods,
        plannerState.meals,
        mealDefs.map((m) => m.id),
      ),
    [foods, plannerState.meals, mealDefs],
  );

  const mealTotals = useMemo(
    () => computeMealTotals(foods, plannerState.meals, mealDefs),
    [foods, plannerState.meals, mealDefs],
  );

  return {
    foods,
    categoriesById,
    categories,
    targets,
    mealDefs,
    meals: plannerState.meals,
    totals,
    mealTotals,
    dayType: plannerState.dayType,
    weightKg: profile.weightKg,
    hiddenMeals: plannerState.hiddenMeals,
    mealPanelOrder: plannerState.mealPanelOrder,
  };
}

type PlannerState = {
  meals: Record<MealId, MealEntry[]>;
  dayType: TargetId;
  hiddenMeals: Record<MealId, true>;
  mealPanelOrder: MealId[];
};
