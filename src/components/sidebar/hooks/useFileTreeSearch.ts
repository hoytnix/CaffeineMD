'use client';

import { useState, useMemo, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/src/lib/storage/db';
import { useTreeStructure, collectAllFolderPaths } from '@/src/hooks/useTreeStructure';

export interface UseFileTreeSearchProps {
  activeWorkspaceId: string;
  customFolders: string[];
  purgeExpiredTrashNotes: () => Promise<number>;
}

/**
 * Manages live IndexedDB file queries, workspace filtering, search state,
 * tree hierarchy construction, and folder path suggestions for the sidebar.
 */
export function useFileTreeSearch({
  activeWorkspaceId,
  customFolders,
  purgeExpiredTrashNotes,
}: UseFileTreeSearchProps) {
  const [searchFilter, setSearchFilter] = useState('');
  const rawFiles = useLiveQuery(() => db.files.toArray());
  const files = useMemo(() => rawFiles ?? [], [rawFiles]);

  useEffect(() => {
    purgeExpiredTrashNotes();
  }, [purgeExpiredTrashNotes]);

  const activeFiles = useMemo(() => {
    return files.filter((f) => {
      if (f.isTrash) return false;
      if (!activeWorkspaceId || activeWorkspaceId === 'default-vault') {
        return !f.vaultId || f.vaultId === 'default-vault';
      }
      return f.vaultId === activeWorkspaceId;
    });
  }, [files, activeWorkspaceId]);

  const trashFiles = useMemo(() => {
    return files.filter((f) => {
      if (!f.isTrash) return false;
      if (!activeWorkspaceId || activeWorkspaceId === 'default-vault') {
        return !f.vaultId || f.vaultId === 'default-vault';
      }
      return f.vaultId === activeWorkspaceId;
    });
  }, [files, activeWorkspaceId]);

  const treeData = useTreeStructure(activeFiles, searchFilter, customFolders);

  const folderSuggestions = useMemo(() => {
    return collectAllFolderPaths(treeData, activeFiles, customFolders);
  }, [treeData, activeFiles, customFolders]);

  return {
    searchFilter,
    setSearchFilter,
    activeFiles,
    trashFiles,
    treeData,
    folderSuggestions,
  };
}
