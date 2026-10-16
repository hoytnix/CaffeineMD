'use client';

import React from 'react';
import { Table as TableIcon, Kanban, List as ListIcon, LayoutList, LayoutGrid } from 'lucide-react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';

interface ViewSwitcherProps {
  databaseViewMode?: 'table' | 'board' | 'list';
  onSetViewMode?: (mode: 'table' | 'board' | 'list') => void;
}

export function ViewSwitcher({ databaseViewMode = 'table', onSetViewMode }: ViewSwitcherProps) {
  const { listViewLayout, setListViewLayout } = useWorkspaceStore();

  if (!onSetViewMode) return null;

  return (
    <div className="flex items-center gap-2">
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

      {databaseViewMode === 'list' && (
        <div
          role="group"
          aria-label="List view layout toggle"
          className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 text-xs border border-neutral-200 dark:border-neutral-700 animate-in fade-in duration-150"
        >
          <button
            type="button"
            onClick={() => setListViewLayout('list')}
            aria-label="Compact List"
            title="Compact List"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
              listViewLayout === 'list'
                ? 'bg-white dark:bg-neutral-900 text-[var(--foreground)] shadow-xs font-medium'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compact</span>
          </button>

          <button
            type="button"
            onClick={() => setListViewLayout('grid')}
            aria-label="Card Grid"
            title="Card Grid"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs cursor-pointer transition-colors ${
              listViewLayout === 'grid'
                ? 'bg-white dark:bg-neutral-900 text-[var(--foreground)] shadow-xs font-medium'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cards</span>
          </button>
        </div>
      )}
    </div>
  );
}
