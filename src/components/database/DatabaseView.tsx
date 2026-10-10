'use client';

import React, { useState, useMemo } from 'react';
import { db, VaultFile } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { TableView } from './TableView';
import { KanbanView } from './KanbanView';
import { ListView } from './ListView';
import { DatabaseToolbar } from './DatabaseToolbar';
import { useDatabaseSchema } from '@/src/hooks/useDatabaseSchema';

export function DatabaseView({ mode }: { mode?: 'table' | 'board' | 'list' }) {
  const { databaseViewMode, setDatabaseViewMode, openFileTab, setActiveView } = useWorkspaceStore();
  const currentMode = mode || databaseViewMode;
  const rawFiles = useLiveQuery(() => db.files.filter((f) => !f.isBinary && !f.isTrash).toArray());
  const files = useMemo(() => rawFiles ?? [], [rawFiles]);

  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const { folders, tags, columns, filteredFiles } = useDatabaseSchema(
    files,
    filterFolder,
    filterTag,
    searchFilter
  );

  const handleCreateNewNote = async () => {
    const timestamp = Date.now();
    const fileName = `New Note ${timestamp.toString().slice(-4)}.md`;
    const targetFolder = filterFolder !== 'all' ? `${filterFolder}/` : '';
    const fullPath = `${targetFolder}${fileName}`;

    const newNote: VaultFile = {
      id: fullPath,
      path: fullPath,
      name: fileName,
      title: `New Note ${timestamp.toString().slice(-4)}`,
      extension: 'md',
      content: `---
title: New Note ${timestamp.toString().slice(-4)}
status: ToDO
priority: Medium
eisenhower: urgent_immediate
tags: [${filterTag !== 'all' ? filterTag : 'note'}]
---

# New Note
`,
      frontmatter: {
        title: `New Note ${timestamp.toString().slice(-4)}`,
        status: 'ToDO',
        priority: 'Medium',
        eisenhower: 'urgent_immediate',
        tags: filterTag !== 'all' ? [filterTag] : ['note'],
      },
      tags: filterTag !== 'all' ? [filterTag] : ['note'],
      eisenhower: 'urgent_immediate',
      isBinary: false,
      size: 120,
      createdAt: timestamp,
      updatedAt: timestamp,
      vaultId: 'default-vault',
    };

    await db.files.put(newNote);
    openFileTab(fullPath, newNote.title);
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[var(--background)] p-8 text-[var(--foreground)]">
      <DatabaseToolbar
        databaseViewMode={currentMode}
        onSetViewMode={(m) => {
          setDatabaseViewMode(m);
          setActiveView(m);
        }}
        onCreateNewRow={handleCreateNewNote}
        searchFilter={searchFilter}
        onSearchChange={setSearchFilter}
        filterFolder={filterFolder}
        onFolderChange={setFilterFolder}
        folders={folders}
        filterTag={filterTag}
        onTagChange={setFilterTag}
        tags={tags}
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
