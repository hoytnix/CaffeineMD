'use client';

import React, { useState } from 'react';
import { Filter, ChevronDown, ChevronRight, X } from 'lucide-react';
import { ToolbarSearchInput } from './toolbar/ToolbarSearchInput';
import { FilterPopover } from './toolbar/FilterPopover';
import { SortPopover } from './toolbar/SortPopover';
import { ViewSwitcher } from './toolbar/ViewSwitcher';

interface DatabaseToolbarProps {
  databaseViewMode: 'table' | 'board' | 'list';
  onSetViewMode: (mode: 'table' | 'board' | 'list') => void;
  onCreateNewRow?: () => void;
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
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Calculate active filter count (excluding defaults)
  const activeFilterCount =
    (filterFolder !== 'all' ? 1 : 0) +
    (filterTag !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterEisenhower !== 'all' ? 1 : 0) +
    (searchFilter.trim() ? 1 : 0);

  const handleResetFilters = () => {
    onFolderChange('all');
    onTagChange('all');
    if (onStatusChange) onStatusChange('all');
    if (onEisenhowerChange) onEisenhowerChange('all');
    onSearchChange('');
  };

  return (
    <div className="mb-4 space-y-2">
      {/* Streamlined View Switcher & Compact Filter Spoiler Toggle */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <ViewSwitcher databaseViewMode={databaseViewMode} onSetViewMode={onSetViewMode} />

          {/* Filter Spoiler Toggle Button */}
          <button
            type="button"
            onClick={() => setFiltersOpen((prev) => !prev)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              filtersOpen || activeFilterCount > 0
                ? 'bg-[var(--theme-accent)] text-white border-transparent shadow-xs'
                : 'bg-[var(--theme-bg-sidebar)] hover:bg-[var(--theme-bg-card)] text-[var(--theme-text-secondary)] border-[var(--theme-border)]'
            }`}
            title={filtersOpen ? 'Hide Filters' : 'Show Filters'}
            aria-expanded={filtersOpen}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeFilterCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-white/20 text-white flex items-center justify-center text-[10px] font-bold">
                {activeFilterCount}
              </span>
            )}
            {filtersOpen ? (
              <ChevronDown className="w-3.5 h-3.5 opacity-80" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 opacity-80" />
            )}
          </button>

          {activeFilterCount > 0 && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 cursor-pointer px-1.5 py-0.5 rounded hover:bg-neutral-800/40"
              title="Clear active filters"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>

        <span className="text-neutral-400 text-xs font-mono">
          {recordCount} {recordCount === 1 ? 'record' : 'records'}
        </span>
      </div>

      {/* Spoilable Filter & Sort Controls Block */}
      {filtersOpen && (
        <div
          style={{ backgroundColor: 'var(--theme-bg-sidebar)', borderColor: 'var(--theme-border)' }}
          className="flex flex-wrap items-center gap-2.5 p-3 rounded-lg border text-xs animate-in fade-in duration-150"
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
        </div>
      )}
    </div>
  );
}
