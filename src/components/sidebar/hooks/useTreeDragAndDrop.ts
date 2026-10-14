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
      if (e.defaultPrevented) return;
      e.preventDefault();
      setIsDragOverTree(false);
      setDropTargetFolderPath(null);

      // 1. Check for internal note/folder relocation to root
      const internalDragPath = e.dataTransfer.getData('application/kite-node-path');
      if (internalDragPath && onRelocateNode) {
        await onRelocateNode(internalDragPath, '');
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
    [activeWorkspaceId, onRelocateNode, openFileTab, setImportProgress]
  );

  const handleNodeDragStart = useCallback((e: React.DragEvent, nodePath: string) => {
    setDraggedNodePath(nodePath);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('application/kite-node-path', nodePath);
    e.dataTransfer.setData('text/plain', nodePath);
  }, []);

  const handleNodeDragEnd = useCallback(() => {
    setDraggedNodePath(null);
    setDropTargetFolderPath(null);
  }, []);

  const handleFolderDragOver = useCallback((e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    const clean = folderPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
    if (dropTargetFolderPath !== clean) {
      setDropTargetFolderPath(clean);
    }
  }, [dropTargetFolderPath]);

  const handleFolderDragEnter = useCallback((e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    const clean = folderPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
    setDropTargetFolderPath(clean);
  }, []);

  const handleFolderDragLeave = useCallback((e: React.DragEvent, folderPath: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) {
      return;
    }
    const clean = folderPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
    setDropTargetFolderPath((prev) => (prev === clean ? null : prev));
  }, []);

  const handleFolderDrop = useCallback(
    async (e: React.DragEvent, targetFolderPath: string) => {
      e.preventDefault();
      e.stopPropagation();
      setDropTargetFolderPath(null);
      setIsDragOverTree(false);

      const cleanTarget = targetFolderPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');

      // 1. Internal note/folder relocation drag
      const internalDragPath = e.dataTransfer.getData('application/kite-node-path');
      if (internalDragPath && onRelocateNode) {
        if (internalDragPath !== cleanTarget) {
          await onRelocateNode(internalDragPath, cleanTarget);
        }
        setDraggedNodePath(null);
        return;
      }

      // 2. Handle external filesystem drops into this folder via import pipeline
      const items = e.dataTransfer.items;
      if (!items || items.length === 0) return;

      const droppedFiles = await scanDroppedItems(items);
      if (droppedFiles.length > 0) {
        const adjustedFiles = droppedFiles.map((f) => ({
          ...f,
          relativePath: cleanTarget ? `${cleanTarget}/${f.relativePath}` : f.relativePath,
        }));
        await runIngestionPipeline(
          adjustedFiles,
          activeWorkspaceId || 'default-vault',
          (p) => setImportProgress(p)
        );
        openFileTab(
          adjustedFiles[0].relativePath,
          adjustedFiles[0].name.replace(/\.[^/.]+$/, '')
        );
      }
    },
    [activeWorkspaceId, onRelocateNode, openFileTab, setImportProgress]
  );

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
    handleFolderDragEnter,
    handleFolderDragLeave,
    handleFolderDrop,
  };
}
