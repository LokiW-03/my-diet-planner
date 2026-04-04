import { IoMdArrowDropdown, IoMdArrowDropleft } from "react-icons/io";
import { IoMdCreate } from "react-icons/io";
import { FaFolderOpen } from "react-icons/fa";
import { FaTrash } from "react-icons/fa";

import { useDroppable } from "@dnd-kit/core";
import { useEffect, useRef } from "react";
import type { CategoryFolder } from "@/shared/models";
import styles from "./FolderRow.module.scss";

export function FolderRow({
    folder,
    isCollapsed,
    isToggleDisabled,
    isEditing,
    editingName,
    onToggleCollapse,
    onStartRename,
    onCommitRename,
    onCancelRename,
    onEditingNameChange,
    onRemove,
    dragHandleRef,
    dragHandleAttributes,
    dragHandleListeners,
}: FolderRowProps) {
    const { setNodeRef, isOver } = useDroppable({ id: `drop:folder:${String(folder.id)}` });
    const cancelRenameOnBlurRef = useRef(false);

    useEffect(() => {
        if (!isEditing) {
            cancelRenameOnBlurRef.current = false;
        }
    }, [isEditing]);

    return (
        <div
            ref={setNodeRef}
            className={styles.folderRow}
            style={{
                boxShadow: isOver ? "0 0 0 2px var(--accent)" : undefined,
            }}
        >
            <FaFolderOpen />
            {isEditing ? (
                <input
                    className={styles.renameInput}
                    value={editingName ?? ""}
                    autoFocus
                    onChange={(e) => onEditingNameChange?.(e.target.value)}
                    onBlur={() => {
                        if (cancelRenameOnBlurRef.current) {
                            cancelRenameOnBlurRef.current = false;
                            return;
                        }
                        onCommitRename?.();
                    }}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") {
                            e.preventDefault();
                            onCommitRename?.();
                            return;
                        }

                        if (e.key === "Escape") {
                            e.preventDefault();
                            cancelRenameOnBlurRef.current = true;
                            onCancelRename?.();
                        }
                    }}
                    aria-label={`Edit folder name for ${folder.name}`}
                />
            ) : (
                <span className={styles.folderName}>{folder.name}</span>
            )}

            {dragHandleRef && !isEditing ? (
                <button
                    type="button"
                    ref={dragHandleRef}
                    {...(dragHandleAttributes ?? {})}
                    {...(dragHandleListeners ?? {})}
                    className={`${styles.dragHandle} ${styles.iconBtn}`}
                    title="Drag to reorder"
                    aria-label={`Drag to reorder folder ${folder.name}`}
                >
                    ⋮⋮
                </button>
            ) : null}

            {!isEditing && onStartRename ? (
                <button
                    type="button"
                    className={styles.iconBtn}
                    onClick={onStartRename}
                    title={`Rename folder ${folder.name}`}
                    aria-label={`Rename folder ${folder.name}`}
                >
                    <IoMdCreate />
                </button>
            ) : null}

            {onRemove ? (
                <button
                    type="button"
                    className={`${styles.iconBtn} ${styles.deleteBtn}`}
                    onClick={onRemove}
                    title={`Remove folder ${folder.name}`}
                    aria-label={`Remove folder ${folder.name}`}
                >
                    <FaTrash />
                </button>
            ) : null}
            <button
                type="button"
                className={styles.iconBtn}
                onClick={onToggleCollapse}
                disabled={!!isToggleDisabled}
                aria-disabled={!!isToggleDisabled}
                title={isCollapsed ? "Expand folder" : "Collapse folder"}
                aria-label={`${isCollapsed ? "Expand" : "Collapse"} folder ${folder.name}`}
            >
                {isCollapsed ? <IoMdArrowDropdown /> : <IoMdArrowDropleft />}
            </button>
        </div>
    );
}

export type FolderRowProps = {
    folder: CategoryFolder;
    isCollapsed: boolean;
    isToggleDisabled?: boolean;
    isEditing?: boolean;
    editingName?: string;
    onToggleCollapse: () => void;
    onStartRename?: () => void;
    onCommitRename?: () => void;
    onCancelRename?: () => void;
    onEditingNameChange?: (name: string) => void;
    onRemove?: () => void;

    dragHandleRef?: (node: HTMLButtonElement | null) => void;
    dragHandleAttributes?: any;
    dragHandleListeners?: any;
};
