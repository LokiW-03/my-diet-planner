"use client";
import { FaSearch } from "react-icons/fa";
import styles from "./FoodLibraryToolBar.module.scss"

export function FoodLibraryToolBar({ search, onSearchChange }: FoodLibraryToolBarProps) {
    return (
        <div className={styles.bar}>
            <FaSearch className={styles.searchIcon} />
            <input
                type="text"
                className={styles.searchInput}
                placeholder="Search for food"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
            />
        </div>
    );
}

type FoodLibraryToolBarProps = {
    search: string;
    onSearchChange: (value: string) => void;
}
