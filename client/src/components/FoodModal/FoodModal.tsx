"use client";

import { FaTrash } from "react-icons/fa";
import type { CategoryId, FoodCategory } from "@/shared/models";
import { type Unit, UNITS } from "@/shared/models";
import { clampInt } from "@/shared/utils";
import { ModalShell } from "@/client/src/components/ModalShell/ModalShell";
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
    defaultPortion,
    canSave,
    onChangeName,
    onChangeCategoryId,
    onChangeUnit,
    onChangeKcal,
    onChangeProtein,
    onChangeDefaultPortion,
    onClose,
    onSave,
    onDelete,
}: FoodModalProps) {

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
                <select
                    id="foodModalCategory"
                    className={styles.input}
                    value={String(categoryId)}
                    onChange={(e) => onChangeCategoryId(e.target.value as unknown as CategoryId)}
                >
                    {categories.map((c) => (
                        <option key={String(c.id)} value={String(c.id)}>
                            {c.name}
                        </option>
                    ))}
                </select>
            </div>

            <div className={styles.row}>
                <label className={styles.label} htmlFor="foodModalUnit">Unit</label>
                <select
                    id="foodModalUnit"
                    className={styles.input}
                    value={unit}
                    onChange={(e) => onChangeUnit(e.target.value as Unit)}
                >
                    {UNITS.map((u) => (
                        <option key={u} value={u}>
                            {u}
                        </option>
                    ))}
                </select>
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
    defaultPortion: number;
    canSave: boolean;
    onChangeName: (value: string) => void;
    onChangeCategoryId: (id: CategoryId) => void;
    onChangeUnit: (unit: Unit) => void;
    onChangeKcal: (value: number) => void;
    onChangeProtein: (value: number) => void;
    onChangeDefaultPortion: (value: number) => void;
    onClose: () => void;
    onSave: () => void;
    onDelete?: () => void;
};