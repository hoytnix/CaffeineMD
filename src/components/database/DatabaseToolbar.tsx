'use client';

import React from 'react';
import { Plus } from 'lucide-react';
import { ToolbarSearchInput } from './toolbar/ToolbarSearchInput';
import { FilterPopover } from './toolbar/FilterPopover';
import { SortPopover } from './toolbar/SortPopover';
import { ViewSwitcher } from './toolbar/ViewSwitcher';

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
  statuses,
  filterEisenhower = 'all',
  onEisenhowerChange,
  sortBy = 'updatedAt',
  onSortByChange,
  recordCount,
}: DatabaseToolbarProps) {
  return (
    <>
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Vault Database</h1>
          <p className="text-xs text-neutral-500 mt-1">
            Structured database views with native title, tags, status, author, and Eisenhower properties.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ViewSwitcher databaseViewMode={databaseViewMode} onSetViewMode={onSetViewMode} />
          <button
            onClick={onCreateNewRow}
            style={{ backgroundColor: 'var(--theme-accent)' }}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white hover:opacity-90 rounded-lg transition-opacity shadow-xs cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Row</span>
          </button>
        </div>
      </div>

      <div
        style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'var(--theme-border)' }}
        className="flex flex-wrap items-center gap-2.5 mb-6 p-3 rounded-lg border text-xs"
      >
        <ToolbarSearchInput searchFilter={searchFilter} onSearchChange={onSearchChange} />
        <FilterPopover
          filterFolder={filterFolder}
          onFolderChange={onFolderChange}
          folders={folders}
          filterTag={filterTag}
          onTagChange={onTagChange}
          tags={tags}
          filterStatus={filterStatus}
          onStatusChange={onStatusChange}
          statuses={statuses}
          filterEisenhower={filterEisenhower}
          onEisenhowerChange={onEisenhowerChange}
        />
        <SortPopover sortBy={sortBy} onSortByChange={onSortByChange} />

        <span className="text-neutral-400 text-xs ml-auto font-mono">
          {recordCount} {recordCount === 1 ? 'record' : 'records'}
        </span>
      </div>
    </>
  );
}
