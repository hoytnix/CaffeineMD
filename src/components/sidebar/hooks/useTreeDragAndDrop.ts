'use client';

import { useState, useCallback } from 'react';
import { scanDroppedItems, runIngestionPipeline, ImportProgress } from '@/src/lib/storage/importPipeline';

export interface UseTreeDragAndDropProps {
  activeWorkspaceId: string;
  setImportProgress: (progress: ImportProgress | null) => void;
  openFileTab: (path: string, title?: string) => void;
  onRelocateNode?: (sourcePath: string, destinationFolderPath: string) => Promise<void>;
}

/**
 * useTreeDragAndDrop
 * Manages drag-and-drop ingestion from native desktop/file explorers into the sidebar,
 * as well as internal note/folder relocation drag states and drop target highlighting.
 */
export function useTreeDragAndDrop({
  activeWorkspaceId,
  setImportProgress,
  openFileTab,
  onRelocateNode,
}: UseTreeDragAndDropProps) {
  const [isDragOverTree, setIsDragOverTree] = useState(false);
  const [draggedNodePath, setDraggedNodePath] = useState<string | null>(null);
  const [dropTargetFolderPath, setDropTargetFolderPath] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    setIsDragOverTree(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    // Only clear if leaving the tree container completely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsDragOverTree(false);
      setDropTargetFolderPath(null);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOverTree(false);
      setDropTargetFolderPath(null);

      // 1. Check for internal note/folder relocation drag
      const internalDragPath = e.dataTransfer.getData('application/kite-node-path');
      if (internalDragPath && onRelocateNode) {
        await onRelocateNode(internalDragPath, dropTargetFolderPath || '');
        setDraggedNodePath(null);
        return;
      }

      // 2. Handle external filesystem drops via import pipeline
      const items = e.dataTransfer.items;
      if (!items || items.length === 0) return;

      const droppedFiles = await scanDroppedItems(items);
      if (droppedFiles.length > 0) {
        await runIngestionPipeline(
          droppedFiles,
          activeWorkspaceId || 'default-vault',
          (p) => setImportProgress(p)
        );
        openFileTab(
          droppedFiles[0].relativePath,
          droppedFiles[0].name.replace(/\.[^/.]+$/, '')
        );
      }
    },
    [activeWorkspaceId, dropTargetFolderPath, onRelocateNode, openFileTab, setImportProgress]
  );

  const handleNodeDragStart = useCallback((e: React.DragEvent, nodePath: string) => {
    setDraggedNodePath(nodePath);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/kite-node-path', nodePath);
  }, []);

  const handleNodeDragEnd = useCallback(() => {
    setDraggedNodePath(null);
    setDropTargetFolderPath(null);
  }, []);

  const handleFolderDragOver = useCallback((e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDropTargetFolderPath(folderPath);
  }, []);

  return {
    isDragOverTree,
    draggedNodePath,
    dropTargetFolderPath,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleNodeDragStart,
    handleNodeDragEnd,
    handleFolderDragOver,
  };
}
