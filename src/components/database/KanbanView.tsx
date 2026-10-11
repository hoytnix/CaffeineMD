'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { VaultFile, db, EisenhowerQuadrant, EISENHOWER_CONFIG } from '@/src/lib/storage/db';
import { normalizeEisenhower, DEFAULT_NOTE_PROPERTIES } from '@/src/lib/markdown/frontmatter';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Plus, MoreHorizontal, FileText, Layers, Flag, User, Tag } from 'lucide-react';

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

  // Determine columns based on active group mode
  const columns = useMemo(() => {
    if (isGroupingByEisenhower) {
      return Array.from(EISENHOWER_COLUMNS);
    }

    if (isGroupingByStatus) {
      const discoveredValues = new Set<string>();
      files.forEach((f) => {
        const val = f.frontmatter?.status || (f as any).status;
        if (val) {
          const norm = normalizeStatus(val);
          if (!DEFAULT_STATUS_COLUMNS.includes(norm as any)) {
            discoveredValues.add(norm);
          }
        }
      });
      return [...DEFAULT_STATUS_COLUMNS, ...Array.from(discoveredValues)];
    }

    // Generic fallback for any other group key
    const genericSet = new Set<string>();
    files.forEach((f) => {
      const val = f.frontmatter?.[activeGroupKey] || (f as any)[activeGroupKey];
      if (val) genericSet.add(String(val));
    });
    return Array.from(genericSet);
  }, [files, isGroupingByEisenhower, isGroupingByStatus, activeGroupKey]);

  const getFilesForColumn = (col: string) => {
    return files.filter((f) => {
      if (isGroupingByEisenhower) {
        const raw = f.eisenhower || f.frontmatter?.eisenhower;
        const norm = normalizeEisenhower(raw);
        return norm === col;
      }
      if (isGroupingByStatus) {
        const val = f.frontmatter?.status || (f as any).status;
        const norm = normalizeStatus(val);
        return norm.toLowerCase() === col.toLowerCase();
      }
      const val = f.frontmatter?.[activeGroupKey] || (f as any)[activeGroupKey];
      return String(val || '').toLowerCase() === col.toLowerCase();
    });
  };

  const handleCreateCard = React.useCallback(
    async (col: string) => {
      if (!newCardTitle.trim()) return;

      const baseTitle = newCardTitle.trim();
      const fileName = `${baseTitle}.md`;

      const cardStatus = isGroupingByStatus ? col : 'Draft';
      const cardEisenhower = isGroupingByEisenhower ? (col as any) : 'Not Urgent & Not Immediate';

      const content = `---
title: "${baseTitle}"
tags: []
status: "${cardStatus}"
author: ""
eisenhower: "${cardEisenhower}"
---

# ${baseTitle}
`;

      const newNote: VaultFile = {
        id: fileName,
        path: fileName,
        name: fileName,
        title: baseTitle,
        extension: 'md',
        content,
        frontmatter: {
          title: baseTitle,
          tags: [],
          status: cardStatus,
          author: '',
          eisenhower: cardEisenhower,
        },
        tags: [],
        eisenhower: cardEisenhower,
        isBinary: false,
        size: content.length,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        vaultId: activeWorkspaceId || 'default-vault',
      };

      await db.files.put(newNote);
      setNewCardTitle('');
      setActiveColumnForNew(null);
      onRefresh();
    },
    [newCardTitle, isGroupingByStatus, isGroupingByEisenhower, activeWorkspaceId, onRefresh]
  );

  const [draggedPath, setDraggedPath] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  const handleMoveStatus = React.useCallback(
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

  const updateNoteStatus = React.useCallback(
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

  return (
    <div className="flex flex-col gap-3">
      {/* Board Layout Switcher: Status vs Eisenhower Matrix */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-neutral-500">Group by:</span>
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--card)] border border-[var(--border)] text-xs shadow-2xs">
            <button
              type="button"
              onClick={() => setOverrideGroupKey('status')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                isGroupingByStatus
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-[var(--foreground)]'
              }`}
              title="Group cards by Status"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Status</span>
            </button>
            <button
              type="button"
              onClick={() => setOverrideGroupKey('eisenhower')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                isGroupingByEisenhower
                  ? 'bg-[var(--accent)] text-white shadow-xs'
                  : 'text-neutral-400 hover:text-[var(--foreground)]'
              }`}
              title="Group cards by Eisenhower Matrix priority"
            >
              <Flag className="w-3.5 h-3.5" />
              <span>Eisenhower</span>
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[500px]">
      {columns.map((col) => {
        const columnFiles = getFilesForColumn(col);
        const isColumnOver = dragOverColumn === col;

        return (
          <div
            key={col}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (dragOverColumn !== col) {
                setDragOverColumn(col);
              }
            }}
            onDragLeave={(e) => {
              if (e.currentTarget.contains(e.relatedTarget as Node)) return;
              setDragOverColumn((prev) => (prev === col ? null : prev));
            }}
            onDrop={async (e) => {
              e.preventDefault();
              setDragOverColumn(null);
              const notePath = e.dataTransfer.getData('text/plain');
              if (!notePath) return;
              await updateNoteStatus(notePath, col);
            }}
            className={`w-72 shrink-0 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/60 border transition-all flex flex-col p-3 shadow-xs ${
              isColumnOver
                ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/20 ring-2 ring-indigo-500/30'
                : 'border-neutral-200/80 dark:border-neutral-800'
            }`}
          >
            {/* Column Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  {col}
                </span>
                <span className="text-[11px] text-neutral-400 font-mono tabular-nums">
                  {columnFiles.length}
                </span>
              </div>
              <button
                onClick={() => setActiveColumnForNew(col)}
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cards List / Drop Target */}
            <div className="space-y-2 flex-1 min-h-[120px]">
              {columnFiles.map((file) => {
                const rawQuadrant = (file.eisenhower || file.frontmatter?.eisenhower) as EisenhowerQuadrant | undefined;
                const opt = rawQuadrant && EISENHOWER_CONFIG[rawQuadrant] ? EISENHOWER_CONFIG[rawQuadrant] : null;
                const isDraggingCard = draggedPath === file.path;

                return (
                  <div
                    key={file.path}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/plain', file.path);
                      e.dataTransfer.effectAllowed = 'move';
                      setDraggedPath(file.path);
                    }}
                    onDragEnd={() => {
                      setDraggedPath(null);
                      setDragOverColumn(null);
                    }}
                    className={`p-3 rounded-lg bg-white dark:bg-neutral-800/90 border shadow-xs transition-all group cursor-grab active:cursor-grabbing ${
                      isDraggingCard
                        ? 'opacity-40 border-indigo-400 scale-[0.98]'
                        : 'border-neutral-200 dark:border-neutral-700/80 hover:border-neutral-300 dark:hover:border-neutral-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <button
                        onClick={() => openFileTab(file.path, file.title)}
                        className="text-left font-medium text-xs text-neutral-900 dark:text-neutral-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate flex-1 cursor-pointer"
                      >
                        {file.title || file.name}
                      </button>

                      {opt && (
                        <span
                          title={`Eisenhower: ${opt.label}`}
                          aria-label={opt.label}
                          className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${opt.dotBg}`}
                        />
                      )}
                    </div>

                    {/* Properties preview */}
                    <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
                      {isGroupingByEisenhower && (
                        <span className="px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium">
                          {file.frontmatter?.status || 'Draft'}
                        </span>
                      )}
                      {file.frontmatter?.author && (
                        <span className="flex items-center gap-0.5 text-neutral-500 font-mono">
                          <User className="w-2.5 h-2.5" />
                          <span>{file.frontmatter.author}</span>
                        </span>
                      )}
                      {file.frontmatter?.priority && (
                        <span className="text-neutral-500 font-mono">
                          Priority: {file.frontmatter.priority}
                        </span>
                      )}
                    </div>

                    {file.tags && file.tags.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1 text-[10px] text-neutral-400">
                        {file.tags.map((t) => (
                          <span key={t}>#{t}</span>
                        ))}
                      </div>
                    )}

                    {/* Quick move status dropdown */}
                    <div className="mt-2.5 pt-2 border-t border-neutral-100 dark:border-neutral-700/60 flex items-center justify-between text-[10px] text-neutral-400">
                      <span>Move to:</span>
                      <select
                        value={col}
                        onChange={(e) => handleMoveStatus(file, e.target.value)}
                        className="bg-transparent text-[11px] text-neutral-600 dark:text-neutral-300 outline-none cursor-pointer max-w-[160px] truncate"
                      >
                        {columns.map((c) => (
                          <option key={c} value={c} className="bg-white dark:bg-neutral-900">
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}

              {/* Add Card Form */}
              {activeColumnForNew === col ? (
                <div className="p-2.5 rounded-lg bg-white dark:bg-neutral-800 border border-indigo-500 shadow-xs">
                  <input
                    type="text"
                    value={newCardTitle}
                    onChange={(e) => setNewCardTitle(e.target.value)}
                    placeholder="Note title..."
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleCreateCard(col);
                      if (e.key === 'Escape') setActiveColumnForNew(null);
                    }}
                    className="w-full text-xs bg-transparent border-none outline-none mb-2 text-neutral-900 dark:text-neutral-100"
                  />
                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => setActiveColumnForNew(null)}
                      className="px-2 py-0.5 text-[11px] text-neutral-500 hover:text-neutral-700"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleCreateCard(col)}
                      className="px-2.5 py-1 text-[11px] font-medium bg-indigo-600 text-white rounded hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setActiveColumnForNew(col)}
                  className="w-full py-1.5 flex items-center justify-center gap-1 text-xs text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New note</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
