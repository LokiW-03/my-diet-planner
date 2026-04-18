"use client";

import { FaTrash } from "react-icons/fa";
import type { CategoryId, FoodCategory } from "@/shared/models";
import { type Unit, UNITS } from "@/shared/models";
import { clampInt } from "@/shared/utils";
import { ModalShell } from "@/client/src/components/ModalShell/ModalShell";
import { DropdownMenu } from "@/client/src/components/DropdownMenu/DropdownMenu";
import styles from "./FoodModal.module.scss";


export function FoodModal({
    open,
    mode,
    categories,
    name,
    categoryId,
    unit,
    kcalPerUnit,
    proteinPerUnit,
    fiberPerUnit,
    defaultPortion,
    canSave,
    onChangeName,
    onChangeCategoryId,
    onChangeUnit,
    onChangeKcal,
    onChangeProtein,
    onChangeFiber,
    onChangeDefaultPortion,
    onClose,
    onSave,
    onDelete,
}: FoodModalProps) {

    const selectedCategory = categories.find((c) => c.id === categoryId);

    if (!open) return null;

    return (
        <ModalShell
            open={open}
            title={mode === "add" ? "Add Food" : "Edit Food"}
            onClose={onClose}
            size="md"
            footer={
                <>
                    <div className={styles.footerLeft}>
                        {mode === "edit" && onDelete && (
                            <button
                                className={styles.dangerBtn}
                                onClick={onDelete}
                                type="button"
                                aria-label="Delete"
                                title="Delete"
                            >
                                <FaTrash />
                            </button>
                        )}
                    </div>
                    <div className={styles.footerRight}>
                        <button
                            className={styles.btn}
                            disabled={!canSave}
                            type="button"
                            onClick={() => {
                                if (!canSave) return;
                                onSave();
                            }}
                        >
                            Save
                        </button>
                    </div>
                </>
            }
        >
            <div className={styles.row}>
                <label className={styles.label} htmlFor="foodModalName">Name</label>
                <input
                    id="foodModalName"
                    className={styles.input}
                    value={name}
                    onChange={(e) => onChangeName(e.target.value)}
                />
            </div>

            <div className={styles.row}>
                <label className={styles.label} htmlFor="foodModalCategory">Category</label>
                <DropdownMenu
                    triggerId="foodModalCategory"
                    buttonLabel={selectedCategory?.name ?? ""}
                    options={categories.map((c) => ({
                        value: String(c.id),
                        label: c.name,
                        selected: c.id === categoryId,
                    }))}
                    onSelect={(value) => onChangeCategoryId(value as unknown as CategoryId)}
                    rootClassName={styles.dropdownRoot}
                    buttonClassName={`${styles.input} ${styles.dropdownButton}`}
                    menuClassName={styles.dropdownMenu}
                    optionClassName={styles.dropdownOption}
                    optionSelectedClassName={styles.dropdownOptionSelected}
                    closeOnMouseLeave={false}
                />
            </div>

            <div className={styles.row}>
                <label className={styles.label} htmlFor="foodModalUnit">Unit</label>
                <DropdownMenu
                    triggerId="foodModalUnit"
                    buttonLabel={unit}
                    options={UNITS.map((u) => ({
                        value: u,
                        label: u,
                        selected: u === unit,
                    }))}
                    onSelect={(value) => onChangeUnit(value as Unit)}
                    rootClassName={styles.dropdownRoot}
                    buttonClassName={`${styles.input} ${styles.dropdownButton}`}
                    menuClassName={styles.dropdownMenu}
                    optionClassName={styles.dropdownOption}
                    optionSelectedClassName={styles.dropdownOptionSelected}
                    closeOnMouseLeave={false}
                />
            </div>

            <div className={styles.row}>
                <label className={styles.label} htmlFor="foodModalKcal">Kcal per {unit}</label>
                <input
                    id="foodModalKcal"
                    className={styles.input}
                    type="number"
                    value={kcalPerUnit}
                    onChange={(e) => onChangeKcal(Number(e.target.value))}
                />
            </div>

            <div className={styles.row}>
                <label className={styles.label} htmlFor="foodModalProtein">Protein per {unit}</label>
                <input
                    id="foodModalProtein"
                    className={styles.input}
                    type="number"
                    value={proteinPerUnit}
                    onChange={(e) => onChangeProtein(Number(e.target.value))}
                />
            </div>

            <div className={styles.row}>
                <label className={styles.label} htmlFor="foodModalFiber">Fiber per {unit}</label>
                <input
                    id="foodModalFiber"
                    className={styles.input}
                    type="number"
                    value={fiberPerUnit}
                    onChange={(e) => onChangeFiber(Number(e.target.value))}
                />
            </div>

            <div className={styles.row}>
                <label className={styles.label} htmlFor="foodModalDefaultPortion">Default portion ({unit})</label>
                <input
                    id="foodModalDefaultPortion"
                    className={styles.input}
                    type="number"
                    value={defaultPortion}
                    onChange={(e) => onChangeDefaultPortion(clampInt(Number(e.target.value), 0, 100000))}
                />
            </div>
        </ModalShell>
    );
}


type FoodModalProps = {
    open: boolean;
    mode: "add" | "edit";
    categories: FoodCategory[];
    name: string;
    categoryId: CategoryId;
    unit: Unit;
    kcalPerUnit: number;
    proteinPerUnit: number;
    fiberPerUnit: number;
    defaultPortion: number;
    canSave: boolean;
    onChangeName: (value: string) => void;
    onChangeCategoryId: (id: CategoryId) => void;
    onChangeUnit: (unit: Unit) => void;
    onChangeKcal: (value: number) => void;
    onChangeProtein: (value: number) => void;
    onChangeFiber: (value: number) => void;
    onChangeDefaultPortion: (value: number) => void;
    onClose: () => void;
    onSave: () => void;
    onDelete?: () => void;
};