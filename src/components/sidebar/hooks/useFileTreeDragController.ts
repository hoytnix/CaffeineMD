'use client';

import { useCallback } from 'react';
import { VaultFile } from '@/src/lib/storage/db';
import { TreeNode } from '@/src/hooks/useTreeStructure';
import { ImportProgress } from '@/src/lib/storage/importPipeline';
import { useTreeDragAndDrop } from './useTreeDragAndDrop';

export interface UseFileTreeDragControllerProps {
  activeWorkspaceId: string;
  activeFiles: VaultFile[];
  setImportProgress: (progress: ImportProgress | null) => void;
  openFileTab: (path: string, title?: string) => void;
  moveNode: (node: TreeNode, destFolder: string) => Promise<void>;
}

/**
 * Coordinates internal file/folder drag-and-drop relocation and external
 * folder/file drop ingestion for the FileTree sidebar.
 */
export function useFileTreeDragController({
  activeWorkspaceId,
  activeFiles,
  setImportProgress,
  openFileTab,
  moveNode,
}: UseFileTreeDragControllerProps) {
  const handleRelocateNode = useCallback(
    async (sourcePath: string, destFolder: string) => {
      const file = activeFiles.find((f) => f.path === sourcePath);
      const node: TreeNode = {
        id: file ? file.id || sourcePath : `folder:${sourcePath}`,
        name: sourcePath.split('/').pop() || sourcePath,
        path: sourcePath,
        isFolder: !file,
        file,
      };
      await moveNode(node, destFolder);
    },
    [activeFiles, moveNode]
  );

  return useTreeDragAndDrop({
    activeWorkspaceId: activeWorkspaceId || 'default-vault',
    setImportProgress,
    openFileTab,
    onRelocateNode: handleRelocateNode,
  });
}
