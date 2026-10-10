'use client';

import React from 'react';
import {
  Table as TableIcon,
  Kanban,
  List as ListIcon,
  Plus,
  Folder,
  Tag,
  Search,
} from 'lucide-react';

interface DatabaseToolbarProps {
  databaseViewMode: 'table' | 'board' | 'list';
  onSetViewMode: (mode: 'table' | 'board' | 'list') => void;
  onCreateNewRow: () => void;
  searchFilter: string;
  onSearchChange: (value: string) => void;
  filterFolder: string;
  onFolderChange: (folder: string) => void;
  folders: string[];
  filterTag: string;
  onTagChange: (tag: string) => void;
  tags: string[];
  recordCount: number;
}

export function DatabaseToolbar({
  databaseViewMode,
  onSetViewMode,
  onCreateNewRow,
  searchFilter,
  onSearchChange,
  filterFolder,
  onFolderChange,
  folders,
  filterTag,
  onTagChange,
  tags,
  recordCount,
}: DatabaseToolbarProps) {
  return (
    <>
      {/* Header & Controls */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vault Database</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Notion-style structured database reading and updating YAML frontmatter properties.
          </p>
        </div>

        {/* View Switcher & New Note Button */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-neutral-200/60 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200 dark:border-neutral-700">
            <button
              onClick={() => onSetViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                databaseViewMode === 'table'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => onSetViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                databaseViewMode === 'board'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => onSetViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                databaseViewMode === 'list'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <ListIcon className="w-3.5 h-3.5" />
              <span>List</span>
            </button>
          </div>

          <button
            onClick={onCreateNewRow}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Row</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-3 mb-6 p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
        <div className="flex items-center gap-2 flex-1 min-w-[200px] border border-neutral-200 dark:border-neutral-800 rounded-md px-2.5 py-1.5 bg-neutral-50/50 dark:bg-neutral-950">
          <Search className="w-3.5 h-3.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Filter records..."
            value={searchFilter}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
          />
        </div>

        {/* Folder filter */}
        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
          <Folder className="w-3.5 h-3.5" />
          <select
            value={filterFolder}
            onChange={(e) => onFolderChange(e.target.value)}
            className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
          >
            <option value="all">All Folders</option>
            {folders.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </div>

        {/* Tag filter */}
        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
          <Tag className="w-3.5 h-3.5" />
          <select
            value={filterTag}
            onChange={(e) => onTagChange(e.target.value)}
            className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
          >
            <option value="all">All Tags</option>
            {tags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        </div>

        <span className="text-neutral-400 text-xs ml-auto">
          {recordCount} {recordCount === 1 ? 'record' : 'records'}
        </span>
      </div>
    </>
  );
}
