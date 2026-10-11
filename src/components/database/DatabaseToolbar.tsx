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
  Layers,
  Flag,
  ArrowUpDown,
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
  filterStatus?: string;
  onStatusChange?: (status: string) => void;
  statuses?: string[];
  filterEisenhower?: string;
  onEisenhowerChange?: (eisenhower: string) => void;
  sortBy?: string;
  onSortByChange?: (sort: string) => void;
  recordCount: number;
}

const EISENHOWER_FILTER_OPTIONS = [
  'Urgent & Immediate',
  'Urgent & Not Immediate',
  'Not Urgent & Immediate',
  'Not Urgent & Not Immediate',
];

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
  filterStatus = 'all',
  onStatusChange,
  statuses = ['Draft', 'In Progress', 'Completed', 'Archived'],
  filterEisenhower = 'all',
  onEisenhowerChange,
  sortBy = 'updatedAt',
  onSortByChange,
  recordCount,
}: DatabaseToolbarProps) {
  return (
    <>
      {/* Header & Controls */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vault Database</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Structured database views with native title, tags, status, author, and Eisenhower properties.
          </p>
        </div>

        {/* Action Button: New Note / Row */}
        <div className="flex items-center gap-3">
          <button
            onClick={onCreateNewRow}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-[var(--primary)] hover:opacity-90 rounded-lg transition-opacity shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Row</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center gap-2.5 mb-6 p-3 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs">
        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[180px] border border-neutral-200 dark:border-neutral-800 rounded-md px-2.5 py-1.5 bg-neutral-50/50 dark:bg-neutral-950">
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
          <Folder className="w-3.5 h-3.5 text-neutral-400" />
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
          <Tag className="w-3.5 h-3.5 text-neutral-400" />
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

        {/* Status filter */}
        {onStatusChange && (
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={filterStatus}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
            >
              <option value="all">All Statuses</option>
              {statuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Eisenhower filter */}
        {onEisenhowerChange && (
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
            <Flag className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={filterEisenhower}
              onChange={(e) => onEisenhowerChange(e.target.value)}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
            >
              <option value="all">All Priorities</option>
              {EISENHOWER_FILTER_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Sort by */}
        {onSortByChange && (
          <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
            <ArrowUpDown className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value)}
              className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs outline-none cursor-pointer"
            >
              <option value="updatedAt">Sort: Updated</option>
              <option value="createdAt">Sort: Created</option>
              <option value="title">Sort: Title</option>
              <option value="status">Sort: Status</option>
              <option value="author">Sort: Author</option>
              <option value="eisenhower">Sort: Priority</option>
            </select>
          </div>
        )}

        <span className="text-neutral-400 text-xs ml-auto">
          {recordCount} {recordCount === 1 ? 'record' : 'records'}
        </span>
      </div>
    </>
  );
}
