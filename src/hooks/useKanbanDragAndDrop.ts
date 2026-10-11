import { useState, useCallback } from 'react';
import { VaultFile, db } from '@/src/lib/storage/db';
import { normalizeEisenhower } from '@/src/lib/markdown/frontmatter';

interface UseKanbanDragAndDropOptions {
  files: VaultFile[];
  isGroupingByStatus: boolean;
  isGroupingByEisenhower: boolean;
  activeGroupKey: string;
  onRefresh: () => void;
}

export function useKanbanDragAndDrop({
  files,
  isGroupingByStatus,
  isGroupingByEisenhower,
  activeGroupKey,
  onRefresh,
}: UseKanbanDragAndDropOptions) {
  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const normalizeStatus = (raw: any): string => {
    if (!raw) return 'Draft';
    const s = String(raw).trim();
    const lower = s.toLowerCase();
    if (lower === 'in progress' || lower === 'doing') return 'In Progress';
    if (lower === 'completed' || lower === 'done') return 'Completed';
    if (lower === 'archived') return 'Archived';
    if (lower === 'draft' || lower === 'todo' || lower === 'to do') return 'Draft';
    return s;
  };

  const handleMoveStatus = useCallback(
    async (file: VaultFile, targetCol: string) => {
      let updated: VaultFile;
      if (isGroupingByEisenhower) {
        updated = {
          ...file,
          eisenhower: targetCol as any,
          frontmatter: {
            ...file.frontmatter,
            eisenhower: targetCol,
          },
          updatedAt: Date.now(),
        };
      } else if (isGroupingByStatus) {
        updated = {
          ...file,
          frontmatter: {
            ...file.frontmatter,
            status: targetCol,
          },
          updatedAt: Date.now(),
        };
      } else {
        updated = {
          ...file,
          frontmatter: {
            ...file.frontmatter,
            [activeGroupKey]: targetCol,
          },
          updatedAt: Date.now(),
        };
      }

      await db.files.put(updated);
      onRefresh();
    },
    [isGroupingByEisenhower, isGroupingByStatus, activeGroupKey, onRefresh]
  );

  const updateNoteStatus = useCallback(
    async (notePath: string, targetCol: string) => {
      const targetFile = files.find((f) => f.path === notePath) || (await db.files.get(notePath));
      if (!targetFile) return;

      if (isGroupingByEisenhower) {
        const current = normalizeEisenhower(targetFile.eisenhower || targetFile.frontmatter?.eisenhower);
        if (current === targetCol) return;
      } else if (isGroupingByStatus) {
        const current = normalizeStatus(targetFile.frontmatter?.status || (targetFile as any).status);
        if (current.toLowerCase() === targetCol.toLowerCase()) return;
      }

      await handleMoveStatus(targetFile, targetCol);
    },
    [files, isGroupingByEisenhower, isGroupingByStatus, handleMoveStatus]
  );

  const handleDragStart = useCallback((e: React.DragEvent, path: string) => {
    e.dataTransfer.setData('text/plain', path);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedPath(path);
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedPath(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn((prev) => (prev !== col ? col : prev));
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent, col: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverColumn((prev) => (prev === col ? null : prev));
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent, col: string) => {
      e.preventDefault();
      setDragOverColumn(null);
      const notePath = e.dataTransfer.getData('text/plain');
      if (!notePath) return;
      await updateNoteStatus(notePath, col);
    },
    [updateNoteStatus]
  );

  return {
    draggedPath,
    dragOverColumn,
    handleMoveStatus,
    updateNoteStatus,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
  };
}
