// @vitest-environment jsdom

import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// This test validates food CRUD UI behavior, not drag-and-drop.
// Mocking dnd-kit avoids needing JSDOM polyfills like ResizeObserver/PointerEvent/RAF.
type ChildrenProps = { children?: unknown };

vi.mock("@dnd-kit/core", () => {
    const Passthrough = ({ children }: ChildrenProps) => children ?? null;

    return {
        DndContext: Passthrough,
        DragOverlay: Passthrough,
        PointerSensor: class PointerSensor { },
        KeyboardSensor: class KeyboardSensor { },
        useSensor: () => ({}),
        useSensors: (...sensors: unknown[]) => sensors,
        closestCenter: () => [],
        pointerWithin: () => [],
        useDroppable: () => ({ setNodeRef: () => undefined, isOver: false }),
        useDraggable: () => ({
            attributes: {},
            listeners: {},
            setNodeRef: () => undefined,
            transform: null,
            isDragging: false,
        }),
    };
});

vi.mock("@dnd-kit/sortable", () => {
    const Passthrough = ({ children }: ChildrenProps) => children ?? null;

    return {
        SortableContext: Passthrough,
        rectSortingStrategy: {},
        verticalListSortingStrategy: {},
        useSortable: () => ({
            setNodeRef: () => undefined,
            setActivatorNodeRef: () => undefined,
            attributes: {},
            listeners: {},
            transform: null,
            transition: null,
            isDragging: false,
        }),
    };
});

vi.mock("@dnd-kit/utilities", () => ({
    CSS: {
        Transform: {
            toString: () => "",
        },
    },
}));

import { ProfileProvider } from "@/client/src/profile/ProfileProvider";
import { defaultUserProfile, defaultTargetId } from "@/shared/defaults";
import { usePlannerStore } from "@/client/src/hooks/useStore";
import { usePlannerScreen } from "@/client/src/hooks/usePlannerScreen";
import PlannerWorkspace from "@/client/src/components/PlannerWorkspace/PlannerWorkspace";
import { FoodModal } from "@/client/src/components/FoodModal/FoodModal";

function PlannerHarness() {
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

beforeEach(() => {
    // Keep Zustand persist + profile storage from leaking between tests.
    try {
        usePlannerStore.persist?.clearStorage?.();
    } catch {
        // ignore
    }

    usePlannerStore.setState({
        meals: {},
        hiddenMeals: {},
        mealPanelOrder: [],
        dayType: defaultTargetId("FULL"),
    });
});

describe("Food add/edit/delete (UI integration)", () => {
    it("adds, edits, and deletes a food and updates the library UI", async () => {
        render(
            <ProfileProvider initialProfile={defaultUserProfile}>
                <PlannerHarness />
            </ProfileProvider>,
        );

        // Baseline: an existing default food should be visible.
        expect(screen.getByRole("button", { name: "Chicken" })).toBeTruthy();

        // Add new food in Proteins.
        fireEvent.click(screen.getByTitle("Add new food to Proteins"));

        const dialog = await screen.findByRole("dialog");
        expect(screen.getByText("Add Food")).toBeTruthy();

        const nameInput = screen.getByLabelText("Name");
        fireEvent.change(nameInput, { target: { value: "Test Food" } });

        const saveButton = screen.getByRole("button", { name: "Save" }) as HTMLButtonElement;
        await waitFor(() => expect(saveButton.disabled).toBe(false));
        fireEvent.click(saveButton);

        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
        await screen.findByRole("button", { name: "Test Food" });

        // Edit the food.
        fireEvent.click(screen.getByRole("button", { name: "Test Food" }));
        await screen.findByText("Edit Food");

        fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Test Food Updated" } });
        await waitFor(() =>
            expect((screen.getByRole("button", { name: "Save" }) as HTMLButtonElement).disabled).toBe(false),
        );
        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        await screen.findByRole("button", { name: "Test Food Updated" });
        expect(screen.queryByRole("button", { name: "Test Food" })).toBeNull();

        // Delete the food.
        fireEvent.click(screen.getByRole("button", { name: "Test Food Updated" }));
        await screen.findByText("Edit Food");
        fireEvent.click(screen.getByRole("button", { name: "Delete" }));

        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
        await waitFor(() => expect(screen.queryByRole("button", { name: "Test Food Updated" })).toBeNull());

        // Baseline item should still exist.
        expect(screen.getByRole("button", { name: "Chicken" })).toBeTruthy();

        void dialog;
    });
});
