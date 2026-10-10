'use client';

import React, { useState } from 'react';
import { VaultFile, db } from '@/src/lib/storage/db';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Plus, MoreHorizontal, FileText } from 'lucide-react';

interface KanbanViewProps {
  files: VaultFile[];
  groupKey?: string;
  onRefresh: () => void;
}

export function KanbanView({ files, groupKey = 'status', onRefresh }: KanbanViewProps) {
  const { openFileTab } = useWorkspaceStore();
  const [newCardTitle, setNewCardTitle] = useState('');
  const [activeColumnForNew, setActiveColumnForNew] = useState<string | null>(null);

  // Group files by groupKey
  const defaultColumns = ['Planning', 'In Progress', 'Completed', 'Backlog'];

  // Discover existing values
  const discoveredValues = new Set<string>();
  files.forEach((f) => {
    const val = f.frontmatter?.[groupKey];
    if (val) discoveredValues.add(String(val));
  });

  const columns = Array.from(new Set([...defaultColumns, ...Array.from(discoveredValues)]));

  const getFilesForColumn = (col: string) => {
    return files.filter((f) => {
      const val = f.frontmatter?.[groupKey];
      if (!val && col === 'Backlog') return true;
      return String(val).toLowerCase() === col.toLowerCase();
    });
  };

  const handleCreateCard = async (col: string) => {
    if (!newCardTitle.trim()) return;

    const fileName = `${newCardTitle.trim()}.md`;
    const newNote: VaultFile = {
      id: fileName,
      path: fileName,
      name: fileName,
      title: newCardTitle.trim(),
      extension: 'md',
      content: `---
title: ${newCardTitle.trim()}
${groupKey}: ${col}
---

# ${newCardTitle.trim()}
`,
      frontmatter: {
        title: newCardTitle.trim(),
        [groupKey]: col,
      },
      tags: [],
      isBinary: false,
      size: 80,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      vaultId: 'default-vault',
    };

    await db.files.put(newNote);
    setNewCardTitle('');
    setActiveColumnForNew(null);
    onRefresh();
  };

  const handleMoveStatus = async (file: VaultFile, targetStatus: string) => {
    const updated = {
      ...file,
      frontmatter: {
        ...file.frontmatter,
        [groupKey]: targetStatus,
      },
      updatedAt: Date.now(),
    };
    await db.files.put(updated);
    onRefresh();
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4 pt-1 items-start min-h-[500px]">
      {columns.map((col) => {
        const columnFiles = getFilesForColumn(col);

        return (
          <div
            key={col}
            className="w-72 shrink-0 rounded-xl bg-neutral-50/80 dark:bg-neutral-900/60 border border-neutral-200/80 dark:border-neutral-800 flex flex-col p-3 shadow-xs"
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
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Cards List */}
            <div className="space-y-2 flex-1 min-h-[100px]">
              {columnFiles.map((file) => (
                <div
                  key={file.path}
                  className="p-3 rounded-lg bg-white dark:bg-neutral-800/90 border border-neutral-200 dark:border-neutral-700/80 shadow-xs hover:border-neutral-300 dark:hover:border-neutral-600 transition-all group"
                >
                  <div className="flex items-start justify-between">
                    <button
                      onClick={() => openFileTab(file.path, file.title)}
                      className="text-left font-medium text-xs text-neutral-900 dark:text-neutral-100 hover:text-indigo-600 dark:hover:text-indigo-400 truncate flex-1"
                    >
                      {file.title || file.name}
                    </button>
                  </div>

                  {/* Properties preview */}
                  {file.frontmatter?.priority && (
                    <div className="mt-2 text-[10px] text-neutral-500 font-mono">
                      Priority: {file.frontmatter.priority}
                    </div>
                  )}

                  {file.tags && file.tags.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1 text-[10px] text-neutral-400">
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
                      className="bg-transparent text-[11px] text-neutral-600 dark:text-neutral-300 outline-none cursor-pointer"
                    >
                      {columns.map((c) => (
                        <option key={c} value={c} className="bg-white dark:bg-neutral-900">
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

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
  );
}
