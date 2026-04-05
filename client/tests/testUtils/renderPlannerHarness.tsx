import React from "react";
import { render } from "@testing-library/react";

import "@/client/tests/testUtils/dndKitMocks";

import type { UserProfile } from "@/shared/models";
import { defaultUserProfile } from "@/shared/defaults";
import { ProfileProvider } from "@/client/src/profile/ProfileProvider";
import { usePlannerScreen } from "@/client/src/hooks/usePlannerScreen";
import PlannerWorkspace from "@/client/src/components/PlannerWorkspace/PlannerWorkspace";
import { FoodModal } from "@/client/src/components/FoodModal/FoodModal";

export function PlannerHarness() {
    const { model, ui, actions } = usePlannerScreen();

    return (
        <>
            <PlannerWorkspace
                foods={model.foods}
                meals={model.meals}
                mealDefs={model.mealDefs}
                mealTotals={model.mealTotals}
                folders={model.foldersById}
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
                    addFolder: actions.addFolder,
                    removeFolder: actions.removeFolder,
                    renameFolder: actions.renameFolder,
                    setCategoryFolder: actions.setCategoryFolder,
                    changeFoodCategory: actions.changeFoodCategory,
                    removeFoodAndEntries: actions.removeFoodAndEntries,
                }}
                dndActions={{
                    reorderMealPanels: actions.setMealPanelOrder,
                    reorderCategories: actions.reorderCategories,
                    reorderFolders: actions.reorderFolders,
                    addEntryToMeal: actions.addEntryToMealWithDefaultPortion,
                    moveEntry: actions.moveEntry,
                }}
                clearAllMeals={actions.clearAllMeals}
            />

            {/* FoodModal isn't used directly in some tests but mounts in the real screen; keeping it ensures wiring matches reality. */}
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
                onDelete={ui.foodModalMode === "edit" && ui.editingFoodId ? actions.deleteEditingFood : undefined}
            />
        </>
    );
}

export function renderPlannerHarness(opts?: { initialProfile?: Partial<UserProfile> }) {
    return render(
        <ProfileProvider initialProfile={opts?.initialProfile ?? defaultUserProfile}>
            <PlannerHarness />
        </ProfileProvider>,
    );
}
