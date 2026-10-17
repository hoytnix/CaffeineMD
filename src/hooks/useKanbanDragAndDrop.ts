import { useState, useCallback } from 'react';
import { VaultFile, db } from '@/src/lib/storage/db';
import { normalizeEisenhower } from '@/src/lib/markdown/frontmatter';

interface UseKanbanDragAndDropOptions {
  files: VaultFile[];
  isGroupingByStatus: boolean;
  isGroupingByEisenhower: boolean;
  activeGroupKey: string;
  onRefresh: () => void;
  onReorderColumns?: (startIndex: number, endIndex: number) => void;
}

export function useKanbanDragAndDrop({
  files,
  isGroupingByStatus,
  isGroupingByEisenhower,
  activeGroupKey,
  onRefresh,
  onReorderColumns,
}: UseKanbanDragAndDropOptions) {
  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);
  const [draggedColumnIndex, setDraggedColumnIndex] = useState<number | null>(null);
  const [dragOverColumnIndex, setDragOverColumnIndex] = useState<number | null>(null);

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

  const handleDragOver = useCallback(
    (e: React.DragEvent, col: string) => {
      if (draggedColumnIndex !== null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverColumn((prev) => (prev !== col ? col : prev));
    },
    [draggedColumnIndex]
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent, col: string) => {
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      setDragOverColumn((prev) => (prev === col ? null : prev));
    },
    []
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent, col: string) => {
      if (draggedColumnIndex !== null) return;
      e.preventDefault();
      setDragOverColumn(null);
      const notePath = e.dataTransfer.getData('text/plain');
      if (!notePath) return;
      await updateNoteStatus(notePath, col);
    },
    [draggedColumnIndex, updateNoteStatus]
  );

  const handleColumnDragStart = useCallback((e: React.DragEvent, index: number) => {
    e.dataTransfer.setData('application/x-caffeinemd-kanban-column', String(index));
    e.dataTransfer.effectAllowed = 'move';
    setDraggedColumnIndex(index);
  }, []);

  const handleColumnDragEnd = useCallback(() => {
    setDraggedColumnIndex(null);
    setDragOverColumnIndex(null);
  }, []);

  const handleColumnDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      if (draggedColumnIndex === null) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      setDragOverColumnIndex((prev) => (prev !== index ? index : prev));
    },
    [draggedColumnIndex]
  );

  const handleColumnDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      if (draggedColumnIndex === null) return;
      e.preventDefault();
      if (draggedColumnIndex !== targetIndex) {
        onReorderColumns?.(draggedColumnIndex, targetIndex);
      }
      setDraggedColumnIndex(null);
      setDragOverColumnIndex(null);
    },
    [draggedColumnIndex, onReorderColumns]
  );

  return {
    draggedPath,
    dragOverColumn,
    draggedColumnIndex,
    dragOverColumnIndex,
    handleMoveStatus,
    updateNoteStatus,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleColumnDragStart,
    handleColumnDragEnd,
    handleColumnDragOver,
    handleColumnDrop,
  };
}
