'use client';

import React, { useState, useMemo } from 'react';
import { db } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { scanDroppedItems, runIngestionPipeline } from '@/src/lib/storage/importPipeline';
import { useTreeStructure } from '@/src/hooks/useTreeStructure';
import { FileTreeItem } from './FileTreeItem';
import { NewNoteModal } from './NewNoteModal';
import { Plus, Search, FolderUp, X, Settings } from 'lucide-react';
import Link from 'next/link';
import { WorkspacePopover } from '@/src/components/workspace/WorkspacePopover';

export function FileTree() {
  const rawFiles = useLiveQuery(() => db.files.toArray());
  const files = useMemo(() => rawFiles ?? [], [rawFiles]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['Projects', 'Engineering']));
  const [isDragOverTree, setIsDragOverTree] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [newNoteModal, setNewNoteModal] = useState(false);

  const {
    activeFilePath,
    openFileTab,
    vaultName,
    setImportProgress,
    activeView,
    setActiveView,
    setImportModalOpen,
    deleteNote,
  } = useWorkspaceStore();

  const treeData = useTreeStructure(files, filterQuery);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverTree(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverTree(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverTree(false);

    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    const droppedFiles = await scanDroppedItems(items);
    if (droppedFiles.length > 0) {
      await runIngestionPipeline(droppedFiles, 'default-vault', (p) => setImportProgress(p));
      openFileTab(droppedFiles[0].relativePath, droppedFiles[0].name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleDeleteFile = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (confirm(`Delete ${path}?`)) {
      await deleteNote(path);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-64 h-full flex flex-col bg-neutral-50/70 dark:bg-neutral-900/50 border-r border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200 select-none transition-all ${
        isDragOverTree ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''
      }`}
    >
      {/* Top Vault Brand & Actions */}
      <div className="p-2.5 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <WorkspacePopover />
            <span className="font-semibold text-xs tracking-tight truncate">{vaultName}</span>
          </div>
          <button
            onClick={() => setNewNoteModal(true)}
            className="p-1 rounded-md text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title="Create new note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter / Search input */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/60 dark:border-neutral-700/60 text-xs">
          <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder="Filter files..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 text-xs"
          />
          {filterQuery && (
            <button onClick={() => setFilterQuery('')} className="text-neutral-400 hover:text-neutral-600 cursor-pointer">
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* File Tree List */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5">
        {treeData.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-xs">
            No notes found.
            <div className="mt-1 text-[11px]">Drop folders or click import below.</div>
          </div>
        ) : (
          treeData.map((node) => (
            <FileTreeItem
              key={node.path}
              node={node}
              depth={0}
              openFolders={openFolders}
              activeFilePath={activeFilePath}
              onToggleFolder={toggleFolder}
              onOpenFile={openFileTab}
              onDeleteFile={handleDeleteFile}
            />
          ))
        )}
      </div>

      {/* Bottom Quick-Import & Settings Action Bar */}
      <div className="p-2 border-t border-neutral-200/80 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/30 flex items-center gap-1.5">
        <button
          onClick={() => setImportModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition-colors cursor-pointer truncate"
          title="Import or Mount Vault"
        >
          <FolderUp className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">Import / Mount Vault</span>
        </button>
        <Link
          href="/settings"
          className="p-1.5 rounded-md bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-colors cursor-pointer shrink-0"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>

      <NewNoteModal isOpen={newNoteModal} onClose={() => setNewNoteModal(false)} />
    </div>
  );
}
