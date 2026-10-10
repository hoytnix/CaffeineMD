'use client';

import React, { useState, useMemo } from 'react';
import { db, VaultFile } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { TableView } from './TableView';
import { KanbanView } from './KanbanView';
import {
  Table as TableIcon,
  Kanban,
  List as ListIcon,
  Plus,
  Filter,
  Folder,
  Tag,
  Search,
} from 'lucide-react';

export function DatabaseView() {
  const { databaseViewMode, setDatabaseViewMode, openFileTab } = useWorkspaceStore();
  const rawFiles = useLiveQuery(() => db.files.where('isBinary').equals(0).toArray());
  const files = useMemo(() => rawFiles ?? [], [rawFiles]);
  const [filterFolder, setFilterFolder] = useState<string>('all');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [searchFilter, setSearchFilter] = useState('');

  const { folders, tags, columns } = useMemo(() => {
    const folderSet = new Set<string>();
    const tagSet = new Set<string>();
    const propKeys = new Set<string>();

    files.forEach((f) => {
      const parts = f.path.split('/');
      if (parts.length > 1) {
        folderSet.add(parts[0]);
      }
      f.tags?.forEach((t) => tagSet.add(t));
      if (f.frontmatter) {
        Object.keys(f.frontmatter).forEach((k) => {
          if (!['title', 'tags'].includes(k)) {
            propKeys.add(k);
          }
        });
      }
    });

    return {
      folders: Array.from(folderSet),
      tags: Array.from(tagSet),
      columns: Array.from(propKeys),
    };
  }, [files]);

  // Filtered files
  const filteredFiles = files.filter((f) => {
    if (filterFolder !== 'all') {
      if (!f.path.startsWith(`${filterFolder}/`)) return false;
    }
    if (filterTag !== 'all') {
      if (!f.tags?.includes(filterTag)) return false;
    }
    if (searchFilter.trim()) {
      const q = searchFilter.toLowerCase();
      const matchTitle = (f.title || f.name).toLowerCase().includes(q);
      const matchContent = f.content?.toLowerCase().includes(q);
      if (!matchTitle && !matchContent) return false;
    }
    return true;
  });

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
status: Planning
priority: Medium
tags: [${filterTag !== 'all' ? filterTag : 'note'}]
---

# New Note
`,
      frontmatter: {
        title: `New Note ${timestamp.toString().slice(-4)}`,
        status: 'Planning',
        priority: 'Medium',
        tags: filterTag !== 'all' ? [filterTag] : ['note'],
      },
      tags: filterTag !== 'all' ? [filterTag] : ['note'],
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-neutral-50/50 dark:bg-neutral-950 p-8 text-neutral-900 dark:text-neutral-100">
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
              onClick={() => setDatabaseViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                databaseViewMode === 'table'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setDatabaseViewMode('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                databaseViewMode === 'board'
                  ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Board</span>
            </button>
            <button
              onClick={() => setDatabaseViewMode('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
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
            onClick={handleCreateNewNote}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
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
            onChange={(e) => setSearchFilter(e.target.value)}
            className="bg-transparent border-none outline-none w-full text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400"
          />
        </div>

        {/* Folder filter */}
        <div className="flex items-center gap-1.5 text-neutral-600 dark:text-neutral-400">
          <Folder className="w-3.5 h-3.5" />
          <select
            value={filterFolder}
            onChange={(e) => setFilterFolder(e.target.value)}
            className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs outline-none"
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
            onChange={(e) => setFilterTag(e.target.value)}
            className="bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-md px-2 py-1 text-xs outline-none"
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
          {filteredFiles.length} {filteredFiles.length === 1 ? 'record' : 'records'}
        </span>
      </div>

      {/* Main View Display */}
      {databaseViewMode === 'table' && (
        <TableView files={filteredFiles} columns={columns} onRefresh={() => {}} />
      )}

      {databaseViewMode === 'board' && (
        <KanbanView files={filteredFiles} groupKey="status" onRefresh={() => {}} />
      )}

      {databaseViewMode === 'list' && (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
          {filteredFiles.map((file) => (
            <div
              key={file.path}
              onClick={() => openFileTab(file.path, file.title)}
              className="p-3.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
                  {file.title || file.name}
                </span>
                {file.frontmatter?.status && (
                  <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                    · {file.frontmatter.status}
                  </span>
                )}
                {file.frontmatter?.priority && (
                  <span className="text-[11px] font-mono text-neutral-500">
                    · {file.frontmatter.priority}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-xs text-neutral-400">
                {file.tags && file.tags.length > 0 && (
                  <div className="flex gap-1.5">
                    {file.tags.map((t) => (
                      <span key={t}>#{t}</span>
                    ))}
                  </div>
                )}
                <span className="font-mono text-[11px]">
                  {new Date(file.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
