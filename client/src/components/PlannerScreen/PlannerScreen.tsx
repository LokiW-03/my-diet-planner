"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { usePlannerScreen } from "@/client/src/hooks/usePlannerScreen";
import { TopToolBar } from "@/client/src/components/TopToolBar/TopToolBar";
import { UserProfileModal } from "@/client/src/components/UserProfileModal/UserProfileModal";
import { FoodModal } from "@/client/src/components/FoodModal/FoodModal";
import styles from "./PlannerScreen.module.scss";

const DndShell = dynamic(
    () => import("@/client/src/components/PlannerWorkspace/PlannerWorkspace"),
    { ssr: false },
);

export default function PlannerScreen() {
    const { model, ui, actions } = usePlannerScreen();
    const [showProfile, setShowProfile] = useState(false);

    return (
        <div className={styles.page}>
            <header className={styles.topBar}>
                <div className={styles.title}>Diet-Planner</div>
            </header>

            <div className={styles.wrap}>
                <TopToolBar
                    showProfile={showProfile}
                    onToggleProfile={() => setShowProfile((v) => !v)}
                    targets={model.targets}
                    dayType={model.dayType}
                    onDayTypeChange={actions.setDayType}
                    onSaveDefaults={actions.saveMealPanelsAsDefaultForCurrentOrder}
                    onReset={actions.resetAllMealPanels}
                />

                <DndShell
                    foods={model.foods}
                    meals={model.meals}
                    mealDefs={model.mealDefs}
                    mealTotals={model.mealTotals}
                    totals={model.totals}
                    dayType={model.dayType}
                    targets={model.targets}
                    weightKg={model.weightKg}
                    onRemoveEntry={actions.removeEntryFromMeal}
                    onPortionChange={actions.setEntryPortion}
                    onEditFood={actions.openEditById}
                    onRemoveMeal={actions.removeMealPanel}
                    onReorderMealPanels={actions.setMealPanelOrder}
                    onInsertMealPanel={actions.insertMealPanel}
                    openAdd={actions.openAdd}
                    openEdit={actions.openEdit}
                    addEntryToMeal={actions.addEntryToMealWithDefaultPortion}
                    moveEntry={actions.moveEntry}
                    clearAll={actions.clearAllMeals}
                />
            </div>

            <UserProfileModal open={showProfile} onClose={() => setShowProfile(false)} />

            <FoodModal
                open={ui.foodModalOpen}
                mode={ui.foodModalMode}
                categories={model.categories}
                categoryPreset={ui.categoryPreset}
                food={ui.editingFood}
                onClose={actions.closeFoodModal}
                onSave={actions.saveFood}
                onDelete={
                    ui.foodModalMode === "edit" && ui.editingFoodId
                        ? actions.deleteEditingFood
                        : undefined
                }
            />
        </div>
    );
}