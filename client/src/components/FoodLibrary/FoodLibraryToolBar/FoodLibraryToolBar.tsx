"use client";
import { FaSearch, FaTrash } from "react-icons/fa";
import { BiSolidSelectMultiple } from "react-icons/bi";
import { IoMdAddCircle } from "react-icons/io";
import { FaFolderPlus } from "react-icons/fa6";
import { MdCancel } from "react-icons/md";
import type { CategoryId, MealId } from "@/shared/models";
import { FoodLibBulkSelect } from "./BulkSelect/FoodLibBulkSelect";
import styles from "./FoodLibraryToolBar.module.scss";

export function FoodLibraryToolBar({
    search,
    onSearchChange,
    isSelecting,
    hasSelection,
    onToggleSelectMode,
    onAddCategory,
    onAddFolder,
    categories,
    mealPanels,
    onBulkMoveToCategory,
    onBulkAddToMealPanel,
    onBulkRemoveSelected,
}: FoodLibraryToolBarProps) {
    return (
        <>
            <div className={styles.bar}>
                <div className={styles.searchGroup}>
                    <FaSearch className={styles.searchIcon} />
                    <input
                        type="text"
                        className={styles.searchInput}
                        placeholder="Search for food"
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        disabled={isSelecting}
                        aria-disabled={isSelecting}
                    />
                </div>
                <div className={styles.toolbarButtons}>
                    <button
                        type="button"
                        className={styles.selectBtn}
                        onClick={onAddCategory}
                        title="Add new category"
                    >
                        <IoMdAddCircle />
                    </button>
                    <button
                        type="button"
                        className={styles.selectBtn}
                        onClick={onAddFolder}
                        title="Add new folder"
                    >
                        <FaFolderPlus />
                    </button>
                    <button
                        type="button"
                        className={`${styles.selectBtn} ${isSelecting ? styles.selectBtnActive : ""}`}
                        onClick={onToggleSelectMode}
                        aria-pressed={isSelecting}
                        title={isSelecting ? "Exit selection mode" : "Enter bulk select foods mode"}
                    >
                        {isSelecting ? <MdCancel /> : <BiSolidSelectMultiple />}
                    </button>

                </div>
            </div>
            {isSelecting && (
                <div className={styles.bulkBar}>
                    <span className={styles.bulkActionLabel}>Action:</span>
                    <div className={styles.bulkActionsRow}>
                        <label className={styles.bulkLabel}>
                            <span>Move to</span>
                            <FoodLibBulkSelect
                                placeholder="[CATEGORY]"
                                options={categories.map((c) => ({
                                    value: String(c.id),
                                    label: c.name,
                                }))}
                                disabled={!hasSelection}
                                onSelect={(val) => {
                                    if (!hasSelection) return;
                                    onBulkMoveToCategory(val as CategoryId);
                                }}
                                title={"Move selected foods to this category"}
                            />
                        </label>
                        <label className={styles.bulkLabel}>
                            <span>Add to</span>
                            <FoodLibBulkSelect
                                placeholder="[MEAL PANEL]"
                                options={mealPanels.map((m) => ({
                                    value: String(m.id),
                                    label: m.name,
                                }))}
                                disabled={!hasSelection}
                                onSelect={(val) => {
                                    if (!hasSelection) return;
                                    onBulkAddToMealPanel(val as MealId);
                                }}
                                title={"Add selected foods to this meal panel"}
                            />
                        </label>
                    </div>
                    <button
                        type="button"
                        className={styles.bulkRemoveBtn}
                        onClick={onBulkRemoveSelected}
                        disabled={!hasSelection}
                        title={"Remove food from food library and any meals"}
                    >
                        <FaTrash />
                    </button>
                </div>
            )}
        </>
    );
}

type FoodLibraryToolBarProps = {
    search: string;
    onSearchChange: (value: string) => void;
    isSelecting: boolean;
    hasSelection: boolean;
    onToggleSelectMode: () => void;
    onAddCategory: () => void;
    onAddFolder: () => void;
    categories: { id: CategoryId; name: string }[];
    mealPanels: { id: MealId; name: string }[];
    onBulkMoveToCategory: (categoryId: CategoryId) => void;
    onBulkAddToMealPanel: (mealId: MealId) => void;
    onBulkRemoveSelected: () => void;
};
