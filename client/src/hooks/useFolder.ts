"use client";

import { useCallback } from "react";
import type { CategoryFolder, FolderId } from "@/shared/models";

export function useFolder({
  updateFolder,
  addFolder,
  removeFolder,
  reorderFolders,
}: FolderProps) {
  const renameFolder = useCallback(
    (folderId: FolderId, name: string) => {
      const trimmed = name.trim();
      if (!trimmed) return;
      updateFolder(folderId, { name: trimmed });
    },
    [updateFolder],
  );

  return {
    ui: {},
    actions: {
      renameFolder,
      addFolder,
      removeFolder,
      reorderFolders,
    },
  };
}

type FolderProps = {
  updateFolder: (
    folderId: FolderId,
    patch: Partial<Omit<CategoryFolder, "id" | "profileId">>,
  ) => void;
  addFolder: (folder: Omit<CategoryFolder, "id">) => FolderId;
  removeFolder: (folderId: FolderId) => void;
  reorderFolders: (folderIds: FolderId[]) => void;
};
