'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { VaultFile, db } from '@/src/lib/storage/db';
import { normalizeEisenhower } from '@/src/lib/markdown/frontmatter';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { useKanbanDragAndDrop } from '@/src/hooks/useKanbanDragAndDrop';
import { KanbanColumn } from './kanban/KanbanColumn';
import { Layers, Flag } from 'lucide-react';

interface KanbanViewProps {
  files: VaultFile[];
  groupKey?: string;
  onRefresh: () => void;
}

const DEFAULT_STATUS_COLUMNS = ['Draft', 'In Progress', 'Completed', 'Archived'] as const;
const EISENHOWER_COLUMNS = [
  'Urgent & Immediate',
  'Urgent & Not Immediate',
  'Not Urgent & Immediate',
  'Not Urgent & Not Immediate',
] as const;

export function KanbanView({ files, groupKey = 'status', onRefresh }: KanbanViewProps) {
  const { openFileTab, activeWorkspaceId } = useWorkspaceStore();
  const [overrideGroupKey, setOverrideGroupKey] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [activeColumnForNew, setActiveColumnForNew] = useState<string | null>(null);

  const activeGroupKey = overrideGroupKey ?? groupKey;
  const isGroupingByStatus = activeGroupKey === 'status';
  const isGroupingByEisenhower = activeGroupKey === 'eisenhower';

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

  const columns = useMemo(() => {
    if (isGroupingByEisenhower) return Array.from(EISENHOWER_COLUMNS);
    if (isGroupingByStatus) {
      const discoveredValues = new Set<string>();
      files.forEach((f) => {
        const val = f.frontmatter?.status || (f as any).status;
        if (val) {
          const norm = normalizeStatus(val);
          if (!DEFAULT_STATUS_COLUMNS.includes(norm as any)) discoveredValues.add(norm);
        }
      });
      return [...DEFAULT_STATUS_COLUMNS, ...Array.from(discoveredValues)];
    }
    const genericSet = new Set<string>();
    files.forEach((f) => {
      const val = f.frontmatter?.[activeGroupKey] || (f as any)[activeGroupKey];
      if (val) genericSet.add(String(val));
    });
    return Array.from(genericSet);
  }, [files, isGroupingByEisenhower, isGroupingByStatus, activeGroupKey]);

  const {
    draggedPath, dragOverColumn, handleMoveStatus, handleDragStart,
    handleDragEnd, handleDragOver, handleDragLeave, handleDrop,
  } = useKanbanDragAndDrop({ files, isGroupingByStatus, isGroupingByEisenhower, activeGroupKey, onRefresh });

  const getFilesForColumn = (col: string) => {
    return files.filter((f) => {
      if (isGroupingByEisenhower) {
        return normalizeEisenhower(f.eisenhower || f.frontmatter?.eisenhower) === col;
      }
      if (isGroupingByStatus) {
        const val = f.frontmatter?.status || (f as any).status;
        return normalizeStatus(val).toLowerCase() === col.toLowerCase();
      }
      const val = f.frontmatter?.[activeGroupKey] || (f as any)[activeGroupKey];
      return String(val || '').toLowerCase() === col.toLowerCase();
    });
  };

  const handleCreateCard = useCallback(async (col: string) => {
    if (!newCardTitle.trim()) return;
    const baseTitle = newCardTitle.trim();
    const fileName = `${baseTitle}.md`;
    const cardStatus = isGroupingByStatus ? col : 'Draft';
    const cardEisenhower = isGroupingByEisenhower ? (col as any) : 'Not Urgent & Not Immediate';
    const content = `---\ntitle: "${baseTitle}"\ntags: []\nstatus: "${cardStatus}"\nauthor: ""\neisenhower: "${cardEisenhower}"\n---\n\n# ${baseTitle}\n`;

    await db.files.put({
      id: fileName, path: fileName, name: fileName, title: baseTitle, extension: 'md',
      content, frontmatter: { title: baseTitle, tags: [], status: cardStatus, author: '', eisenhower: cardEisenhower },
      tags: [], eisenhower: cardEisenhower, isBinary: false, size: content.length,
      createdAt: Date.now(), updatedAt: Date.now(), vaultId: activeWorkspaceId || 'default-vault',
    });
    setNewCardTitle('');
    setActiveColumnForNew(null);
    onRefresh();
  }, [newCardTitle, isGroupingByStatus, isGroupingByEisenhower, activeWorkspaceId, onRefresh]);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">Group by:</span>
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setOverrideGroupKey('status')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                isGroupingByStatus ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-neutral-400 hover:text-[var(--foreground)]'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Status</span>
            </button>
            <button
              type="button"
              onClick={() => setOverrideGroupKey('eisenhower')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                isGroupingByEisenhower ? 'bg-[var(--accent)] text-white shadow-xs' : 'text-neutral-400 hover:text-[var(--foreground)]'
              }`}
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Eisenhower</span>
            </button>
          </div>
        </div>
      </div>

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
          />
        ))}
      </div>
    </div>
  );
}
