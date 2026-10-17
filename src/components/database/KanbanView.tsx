'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { VaultFile, db, EisenhowerQuadrant } from '@/src/lib/storage/db';
import { normalizeEisenhower, serializeFrontmatter } from '@/src/lib/markdown/frontmatter';
import { executeVaultMutation } from '@/src/lib/storage/vaultMutationService';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { DEFAULT_KANBAN_BOARDS } from '@/src/stores/slices/kanbanSlice';
import { useKanbanDragAndDrop } from '@/src/hooks/useKanbanDragAndDrop';
import { KanbanColumn } from './kanban/KanbanColumn';
import { KanbanBoardSelector } from './kanban/KanbanBoardSelector';
import { KanbanBoardModals, BoardModalMode } from './kanban/KanbanBoardModals';
import { KanbanAddColumnCard } from './kanban/KanbanAddColumnCard';

interface KanbanViewProps {
  files: VaultFile[];
  groupKey?: string;
  onRefresh: () => void;
}

function normalizeStatusValue(raw: unknown): string {
  if (!raw) return 'Draft';
  const s = String(raw).trim();
  const lower = s.toLowerCase();
  if (lower === 'in progress' || lower === 'doing') return 'In Progress';
  if (lower === 'completed' || lower === 'done') return 'Completed';
  if (lower === 'archived') return 'Archived';
  if (lower === 'draft' || lower === 'todo' || lower === 'to do') return 'Draft';
  return s;
}

export function KanbanView({ files, onRefresh }: KanbanViewProps) {
  const {
    openFileTab, activeWorkspaceId, kanbanBoards, activeBoardId, setActiveBoardId,
    createKanbanBoard, renameKanbanBoard, deleteKanbanBoard, reorderKanbanBoards,
    addColumnToBoard, renameColumnInBoard, deleteColumnFromBoard, showToast,
  } = useWorkspaceStore();

  const [modalMode, setModalMode] = useState<BoardModalMode>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [activeColumnForNew, setActiveColumnForNew] = useState<string | null>(null);

  const currentBoard = useMemo(
    () => kanbanBoards.find((b) => b.id === activeBoardId) || kanbanBoards[0] || DEFAULT_KANBAN_BOARDS[0],
    [kanbanBoards, activeBoardId]
  );

  const activeGroupKey = currentBoard.groupKey || 'status';
  const isGroupingByStatus = activeGroupKey === 'status';
  const isGroupingByEisenhower = activeGroupKey === 'eisenhower';

  const columns = useMemo(() => {
    const baseCols = currentBoard.columns.length > 0 ? currentBoard.columns : ['Draft'];
    if (isGroupingByEisenhower) return baseCols;

    const lowerBase = new Set(baseCols.map((c) => c.toLowerCase()));
    const extraCols: string[] = [];
    files.forEach((f) => {
      const rawVal = isGroupingByStatus ? f.frontmatter?.status : f.frontmatter?.[activeGroupKey];
      if (!rawVal) return;
      const resolved = isGroupingByStatus ? normalizeStatusValue(rawVal) : String(rawVal).trim();
      if (resolved && !lowerBase.has(resolved.toLowerCase())) {
        lowerBase.add(resolved.toLowerCase());
        extraCols.push(resolved);
      }
    });
    return [...baseCols, ...extraCols];
  }, [currentBoard.columns, files, isGroupingByEisenhower, isGroupingByStatus, activeGroupKey]);

  const {
    draggedPath, dragOverColumn, handleMoveStatus, handleDragStart,
    handleDragEnd, handleDragOver, handleDragLeave, handleDrop,
  } = useKanbanDragAndDrop({ files, isGroupingByStatus, isGroupingByEisenhower, activeGroupKey, onRefresh });

  const getFilesForColumn = useCallback(
    (col: string) =>
      files.filter((f) => {
        if (isGroupingByEisenhower) return normalizeEisenhower(f.eisenhower || f.frontmatter?.eisenhower) === col;
        if (isGroupingByStatus) return normalizeStatusValue(f.frontmatter?.status).toLowerCase() === col.toLowerCase();
        return String(f.frontmatter?.[activeGroupKey] || '').toLowerCase() === col.toLowerCase();
      }),
    [files, isGroupingByEisenhower, isGroupingByStatus, activeGroupKey]
  );

  const batchReassignColumnFiles = useCallback(
    async (matchingFiles: VaultFile[], targetValue: string) => {
      if (matchingFiles.length === 0) return;
      await executeVaultMutation(async () => {
        for (const file of matchingFiles) {
          const updatedFm = { ...file.frontmatter, [activeGroupKey]: targetValue };
          const updatedContent = serializeFrontmatter(updatedFm, file.content);
          await db.files.update(file.id, {
            frontmatter: updatedFm,
            ...(isGroupingByEisenhower ? { eisenhower: targetValue as EisenhowerQuadrant } : {}),
            content: updatedContent,
            updatedAt: Date.now(),
          });
        }
      });
    },
    [activeGroupKey, isGroupingByEisenhower]
  );

  const handleCreateCard = useCallback(
    async (col: string) => {
      if (!newCardTitle.trim()) return;
      const baseTitle = newCardTitle.trim();
      const fileName = `${baseTitle}.md`;
      const cardStatus = isGroupingByStatus ? col : 'Draft';
      const cardEisenhower: EisenhowerQuadrant = isGroupingByEisenhower
        ? (col as EisenhowerQuadrant)
        : 'Not Urgent & Not Immediate';
      const frontmatter = {
        title: baseTitle, tags: [], status: cardStatus, author: '', eisenhower: cardEisenhower,
        ...(!isGroupingByStatus && !isGroupingByEisenhower ? { [activeGroupKey]: col } : {}),
      };
      const content = serializeFrontmatter(frontmatter, `# ${baseTitle}\n`);

      await executeVaultMutation(() =>
        db.files.put({
          id: fileName, path: fileName, name: fileName, title: baseTitle, extension: 'md',
          content, frontmatter, tags: [], eisenhower: cardEisenhower, isBinary: false,
          size: content.length, createdAt: Date.now(), updatedAt: Date.now(),
          vaultId: activeWorkspaceId || 'default-vault',
        })
      );
      setNewCardTitle('');
      setActiveColumnForNew(null);
      onRefresh();
    },
    [newCardTitle, isGroupingByStatus, isGroupingByEisenhower, activeGroupKey, activeWorkspaceId, onRefresh]
  );

  const handleRenameColumn = useCallback(
    async (oldCol: string, newCol: string) => {
      renameColumnInBoard(currentBoard.id, oldCol, newCol);
      await batchReassignColumnFiles(getFilesForColumn(oldCol), newCol);
      showToast(`Renamed column "${oldCol}" to "${newCol}"`);
      onRefresh();
    },
    [currentBoard.id, renameColumnInBoard, batchReassignColumnFiles, getFilesForColumn, showToast, onRefresh]
  );

  const handleDeleteColumn = useCallback(
    async (col: string) => {
      const fallbackCol = columns.find((c) => c !== col) || 'Draft';
      const matchingFiles = getFilesForColumn(col);
      deleteColumnFromBoard(currentBoard.id, col);
      await batchReassignColumnFiles(matchingFiles, fallbackCol);
      showToast(`Removed column "${col}"`);
      onRefresh();
    },
    [columns, currentBoard.id, deleteColumnFromBoard, batchReassignColumnFiles, getFilesForColumn, showToast, onRefresh]
  );

  return (
    <div className="flex flex-col gap-3">
      <KanbanBoardSelector
        boards={kanbanBoards}
        activeBoard={currentBoard}
        onSelectBoard={setActiveBoardId}
        onOpenModal={setModalMode}
        onReorderBoards={reorderKanbanBoards}
      />

      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[500px]">
        {columns.map((col) => (
          <KanbanColumn
            key={col}
            col={col}
            files={getFilesForColumn(col)}
            columns={columns}
            isGroupingByEisenhower={isGroupingByEisenhower}
            isOver={dragOverColumn === col}
            draggedPath={draggedPath}
            activeColumnForNew={activeColumnForNew}
            newCardTitle={newCardTitle}
            onNewCardTitleChange={setNewCardTitle}
            onSetActiveColumnForNew={setActiveColumnForNew}
            onCreateCard={handleCreateCard}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onOpenFile={(path, title) => openFileTab(path, title)}
            onMoveStatus={handleMoveStatus}
            onRenameColumn={handleRenameColumn}
            onDeleteColumn={handleDeleteColumn}
            canDeleteColumn={columns.length > 1}
          />
        ))}
        <KanbanAddColumnCard
          onAddColumn={(name) => {
            addColumnToBoard(currentBoard.id, name);
            showToast(`Added column "${name}"`);
          }}
        />
      </div>

      <KanbanBoardModals
        mode={modalMode}
        activeBoard={currentBoard}
        onClose={() => setModalMode(null)}
        onCreateBoard={(name, gk, cols) => { createKanbanBoard(name, gk, cols); showToast(`Created board "${name}"`); }}
        onRenameBoard={(id, newName) => { renameKanbanBoard(id, newName); showToast(`Renamed board to "${newName}"`); }}
        onDeleteBoard={(id) => { deleteKanbanBoard(id); showToast('Deleted Kanban board'); }}
      />
    </div>
  );
}
