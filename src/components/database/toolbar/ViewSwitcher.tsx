'use client';

import React from 'react';
import { Table as TableIcon, Kanban, List as ListIcon } from 'lucide-react';

interface ViewSwitcherProps {
  databaseViewMode?: 'table' | 'board' | 'list';
  onSetViewMode?: (mode: 'table' | 'board' | 'list') => void;
}

export function ViewSwitcher({ databaseViewMode = 'table', onSetViewMode }: ViewSwitcherProps) {
  if (!onSetViewMode) return null;

  return (
    <div className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs border border-neutral-200 dark:border-neutral-700">
      <button
        type="button"
        onClick={() => onSetViewMode('table')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer ${
          databaseViewMode === 'table'
            ? 'bg-white dark:bg-neutral-900 text-[var(--foreground)] shadow-xs font-medium'
            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
        }`}
        title="Table view"
      >
        <TableIcon className="w-3.5 h-3.5" />
        <span>Table</span>
      </button>

      <button
        type="button"
        onClick={() => onSetViewMode('board')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer ${
          databaseViewMode === 'board'
            ? 'bg-white dark:bg-neutral-900 text-[var(--foreground)] shadow-xs font-medium'
            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
        }`}
        title="Board view"
      >
        <Kanban className="w-3.5 h-3.5" />
        <span>Board</span>
      </button>

      <button
        type="button"
        onClick={() => onSetViewMode('list')}
        className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer ${
          databaseViewMode === 'list'
            ? 'bg-white dark:bg-neutral-900 text-[var(--foreground)] shadow-xs font-medium'
            : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
        }`}
        title="List view"
      >
        <ListIcon className="w-3.5 h-3.5" />
        <span>List</span>
      </button>
    </div>
  );
}
