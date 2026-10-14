'use client';

import React, { useState, useMemo } from 'react';
import { db, VaultFile } from '@/src/lib/storage/db';
import { executeVaultMutation } from '@/src/lib/storage/vaultMutationService';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { TableView } from './TableView';
import { KanbanView } from './KanbanView';
import { ListView } from './ListView';
import { DatabaseToolbar } from './DatabaseToolbar';
import { useDatabaseSchema } from '@/src/hooks/useDatabaseSchema';

export function DatabaseView({ mode }: { mode?: 'table' | 'board' | 'list' }) {
  const {
    databaseViewMode,
    setDatabaseViewMode,
    openFileTab,
    setActiveView,
    activeWorkspaceId,
  } = useWorkspaceStore();
  const currentMode = mode || databaseViewMode;
  const rawFiles = useLiveQuery(() => db.files.filter((f) => !f.isBinary && !f.isTrash).toArray());
  const files = useMemo(() => {
    const list = rawFiles ?? [];
    return list.filter((f) => {
      if (!activeWorkspaceId || activeWorkspaceId === 'default-vault') {
        return !f.vaultId || f.vaultId === 'default-vault';
      }
      return f.vaultId === activeWorkspaceId;
    });
  }, [rawFiles, activeWorkspaceId]);

  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterEisenhower, setFilterEisenhower] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { folders, tags, columns, statuses, filteredFiles } = useDatabaseSchema(
    files,
    filterFolder,
    filterTag,
    searchFilter,
    filterStatus,
    filterEisenhower,
    sortBy,
    sortOrder
  );

  const handleCreateNewNote = async () => {
    const timestamp = Date.now();
    const noteTitle = `New Note ${timestamp.toString().slice(-4)}`;
    const fileName = `${noteTitle}.md`;
    const targetFolder = filterFolder !== 'all' ? `${filterFolder}/` : '';
    const fullPath = `${targetFolder}${fileName}`;
    const initialTags = filterTag !== 'all' ? [filterTag] : [];

    const content = `---
title: "${noteTitle}"
tags: [${initialTags.map((t) => `"${t}"`).join(', ')}]
status: "Draft"
author: ""
eisenhower: "Not Urgent & Not Immediate"
---

# ${noteTitle}

Start writing here...
`;

    const newNote: VaultFile = {
      id: fullPath,
      path: fullPath,
      name: fileName,
      title: noteTitle,
      extension: 'md',
      content,
      frontmatter: {
        title: noteTitle,
        status: 'Draft',
        author: '',
        eisenhower: 'Not Urgent & Not Immediate',
        tags: initialTags,
      },
      tags: initialTags,
      eisenhower: 'Not Urgent & Not Immediate',
      isBinary: false,
      size: content.length,
      createdAt: timestamp,
      updatedAt: timestamp,
      vaultId: activeWorkspaceId || 'default-vault',
    };

    await executeVaultMutation(() => db.files.put(newNote));
    openFileTab(fullPath, newNote.title);
  };

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
