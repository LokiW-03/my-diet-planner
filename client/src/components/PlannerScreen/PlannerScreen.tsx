"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { usePlannerScreen } from "@/client/src/hooks/usePlannerScreen";
import { TopToolBar } from "@/client/src/components/TopToolBar/TopToolBar";
import { UserProfileModal } from "@/client/src/components/UserProfileModal/UserProfileModal";
import { FoodModal } from "@/client/src/components/FoodModal/FoodModal";
import { TargetModal } from "@/client/src/components/TargetModal/TargetModal";
import styles from "./PlannerScreen.module.scss";

const DndShell = dynamic(
    () => import("@/client/src/components/PlannerWorkspace/PlannerWorkspace"),
    { ssr: false },
);

export default function PlannerScreen() {
    const { model, ui, actions } = usePlannerScreen();
    const [showProfile, setShowProfile] = useState(false);
    const [showTargets, setShowTargets] = useState(false);

    return (
        <div className={styles.page}>
            <div className={styles.wrap}>
                <TopToolBar
                    showProfile={showProfile}
                    onToggleProfile={() => setShowProfile((v) => !v)}
                    onEditTargets={() => setShowTargets(true)}
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
                    categories={model.categoriesById}
                    totals={model.totals}
                    dayType={model.dayType}
                    targets={model.targets}
                    weightKg={model.weightKg}
                    mealBoardActions={{
                        removeEntry: actions.removeEntryFromMeal,
                        setPortion: actions.setEntryPortion,
                        editFood: actions.openEditById,
                        removeMeal: actions.removeMealPanel,
                        renameMeal: actions.renameMealPanel,
                        insertMealPanel: actions.insertMealPanel,
                    }}
                    foodLibraryActions={{
                        openAdd: actions.openAdd,
                        openEdit: actions.openEdit,
                        renameCategory: actions.renameCategory,
                        addCategory: actions.addCategory,
                        removeCategory: actions.removeCategory,
                        changeFoodCategory: actions.changeFoodCategory,
                        removeFoodAndEntries: actions.removeFoodAndEntries,
                    }}
                    dndActions={{
                        reorderMealPanels: actions.setMealPanelOrder,
                        reorderCategories: actions.reorderCategories,
                        addEntryToMeal: actions.addEntryToMealWithDefaultPortion,
                        moveEntry: actions.moveEntry,
                    }}
                    clearAllMeals={actions.clearAllMeals}
                />
            </div>

            <UserProfileModal open={showProfile} onClose={() => setShowProfile(false)} />

            <FoodModal
                open={ui.foodModalOpen}
                mode={ui.foodModalMode}
                categories={ui.visibleCategories}
                name={ui.foodForm.name}
                categoryId={ui.foodForm.categoryId}
                unit={ui.foodForm.unit}
                kcalPerUnit={ui.foodForm.kcalPerUnit}
                proteinPerUnit={ui.foodForm.proteinPerUnit}
                defaultPortion={ui.foodForm.defaultPortion}
                canSave={ui.foodForm.canSave}
                onChangeName={actions.setFoodName}
                onChangeCategoryId={actions.setFoodCategoryId}
                onChangeUnit={actions.setFoodUnit}
                onChangeKcal={actions.setFoodKcal}
                onChangeProtein={actions.setFoodProtein}
                onChangeDefaultPortion={actions.setFoodDefaultPortion}
                onClose={actions.closeFoodModal}
                onSave={actions.saveFood}
                onDelete={
                    ui.foodModalMode === "edit" && ui.editingFoodId
                        ? actions.deleteEditingFood
                        : undefined
                }
            />

            {showTargets && (
                <TargetModal
                    open={showTargets}
                    targets={model.targets}
                    onClose={() => setShowTargets(false)}
                    onAddTarget={actions.addTarget}
                    onUpdateTarget={actions.updateTarget}
                    onRemoveTarget={actions.removeTargetAndFixDayType}
                    onResetToDefault={actions.resetTargetsToDefault}
                    onSaveAsDefault={async () => {
                        await actions.saveTargetsAsDefault();
                        setShowTargets(false);
                    }}
                />
            )}
        </div>
    );
}