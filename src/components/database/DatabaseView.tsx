'use client';

import React from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { TableView } from './TableView';
import { KanbanView } from './KanbanView';
import { ListView } from './ListView';
import { DatabaseToolbar } from './DatabaseToolbar';
import { useDatabaseFilterState } from './hooks/useDatabaseFilterState';
import { useDatabaseMutations } from './hooks/useDatabaseMutations';

export function DatabaseView({ mode }: { mode?: 'table' | 'board' | 'list' }) {
  const {
    databaseViewMode,
    setDatabaseViewMode,
    openFileTab,
    setActiveView,
    activeWorkspaceId,
  } = useWorkspaceStore();
  const currentMode = mode || databaseViewMode;

  const {
    filterFolder,
    setFilterFolder,
    filterTag,
    setFilterTag,
    searchFilter,
    setSearchFilter,
    filterStatus,
    setFilterStatus,
    filterEisenhower,
    setFilterEisenhower,
    sortBy,
    setSortBy,
    folders,
    tags,
    columns,
    statuses,
    filteredFiles,
  } = useDatabaseFilterState(activeWorkspaceId || 'default-vault');

  useDatabaseMutations({
    activeWorkspaceId: activeWorkspaceId || 'default-vault',
    filterFolder,
    filterTag,
    openFileTab,
  });

  return (
    <div
      style={{ color: 'var(--theme-text-primary)' }}
      className="flex-1 flex flex-col h-full overflow-y-auto p-4 sm:p-6 md:p-8 bg-transparent"
    >
      <DatabaseToolbar
        databaseViewMode={currentMode}
        onSetViewMode={(m) => {
          setDatabaseViewMode(m);
          setActiveView(m);
        }}
        searchFilter={searchFilter}
        onSearchChange={setSearchFilter}
        filterFolder={filterFolder}
        onFolderChange={setFilterFolder}
        folders={folders}
        filterTag={filterTag}
        onTagChange={setFilterTag}
        tags={tags}
        filterStatus={filterStatus}
        onStatusChange={setFilterStatus}
        statuses={statuses}
        filterEisenhower={filterEisenhower}
        onEisenhowerChange={setFilterEisenhower}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        recordCount={filteredFiles.length}
      />

      {currentMode === 'table' && (
        <TableView files={filteredFiles} columns={columns} onRefresh={() => {}} />
      )}

      {currentMode === 'board' && (
        <KanbanView files={filteredFiles} groupKey="status" onRefresh={() => {}} />
      )}

      {currentMode === 'list' && (
        <ListView files={filteredFiles} />
      )}
    </div>
  );
}
