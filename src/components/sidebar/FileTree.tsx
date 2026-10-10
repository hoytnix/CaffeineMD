'use client';

import React, { useState, useMemo } from 'react';
import { db } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { scanDroppedItems, runIngestionPipeline } from '@/src/lib/storage/importPipeline';
import { useTreeStructure } from '@/src/hooks/useTreeStructure';
import { FileTreeItem } from './FileTreeItem';
import { NewNoteModal } from './NewNoteModal';
import { Plus, Search, FolderUp, X, Settings, Trash2, Undo2, ChevronDown, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { WorkspacePopover } from '@/src/components/workspace/WorkspacePopover';

export function FileTree() {
  const rawFiles = useLiveQuery(() => db.files.toArray());
  const files = useMemo(() => rawFiles ?? [], [rawFiles]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['Projects', 'Engineering']));
  const [isTrashOpen, setIsTrashOpen] = useState(false);
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
    promptDeleteNote,
    deleteNote,
    restoreNote,
    emptyTrashAll,
    purgeExpiredTrashNotes,
  } = useWorkspaceStore();

  // Run auto-purge of expired trash notes on mount
  React.useEffect(() => {
    purgeExpiredTrashNotes();
  }, [purgeExpiredTrashNotes]);

  const activeFiles = useMemo(() => files.filter((f) => !f.isTrash), [files]);
  const trashFiles = useMemo(() => files.filter((f) => f.isTrash), [files]);

  const treeData = useTreeStructure(activeFiles, filterQuery);

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

  const handleDeleteFile = (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    promptDeleteNote(path);
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`w-64 h-full flex flex-col bg-[var(--card)] border-r border-[var(--border)] text-[var(--foreground)] select-none transition-all ${
        isDragOverTree ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''
      }`}
    >
      {/* Top Vault Brand & Actions */}
      <div className="p-2.5 border-b border-[var(--border)]">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-1.5 truncate">
            <WorkspacePopover />
            <span className="font-semibold text-xs tracking-tight truncate">{vaultName}</span>
          </div>
          <button
            onClick={() => setNewNoteModal(true)}
            className="p-1 rounded-md text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-800/40 transition-colors cursor-pointer"
            title="Create new note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Filter / Search input */}
      <div className="px-3 py-2">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-[var(--background)] border border-[var(--border)] text-xs">
          <Search className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          <input
            type="text"
            placeholder="Filter files..."
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            className="w-full bg-transparent border-none outline-none text-[var(--foreground)] placeholder-neutral-400 text-xs"
          />
          {filterQuery && (
            <button onClick={() => setFilterQuery('')} className="text-neutral-400 hover:text-neutral-200 cursor-pointer">
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

      {/* Ephemeral Trash Folder Section */}
      <div className="border-t border-[var(--border)] px-1.5 py-1">
        <div
          onClick={() => setIsTrashOpen((prev) => !prev)}
          className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-neutral-800/30 cursor-pointer text-xs font-medium text-neutral-400 hover:text-[var(--foreground)] transition-colors select-none group"
        >
          <div className="flex items-center gap-1.5">
            {isTrashOpen ? (
              <ChevronDown className="w-3 h-3 text-neutral-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3 h-3 text-neutral-400 shrink-0" />
            )}
            <Trash2 className="w-3.5 h-3.5 text-rose-400/80 shrink-0" />
            <span>Trash</span>
          </div>
          <div className="flex items-center gap-1.5">
            {trashFiles.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/10 text-rose-400 font-mono">
                {trashFiles.length}
              </span>
            )}
          </div>
        </div>

        {isTrashOpen && (
          <div className="pl-4 pr-1 py-1 space-y-1">
            {trashFiles.length === 0 ? (
              <div className="text-[11px] text-neutral-500 py-1 pl-2">Trash is empty</div>
            ) : (
              <>
                <div className="flex items-center justify-between px-2 py-0.5 text-[10px] text-neutral-500">
                  <span>{trashFiles.length} item{trashFiles.length === 1 ? '' : 's'}</span>
                  <button
                    onClick={() => {
                      if (confirm('Permanently delete all notes in Trash?')) {
                        emptyTrashAll();
                      }
                    }}
                    className="text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    Empty
                  </button>
                </div>
                {trashFiles.map((tf) => (
                  <div
                    key={tf.path}
                    className="flex items-center justify-between py-1 px-2 rounded-md bg-neutral-900/30 text-xs text-neutral-400 group hover:text-[var(--foreground)]"
                  >
                    <span className="truncate text-[11px] line-through opacity-75">
                      {tf.title || tf.name}
                    </span>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => restoreNote(tf.path)}
                        title="Restore note"
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-300 hover:text-emerald-400 transition-colors cursor-pointer"
                      >
                        <Undo2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Permanently delete "${tf.title || tf.name}"?`)) {
                            deleteNote(tf.path);
                          }
                        }}
                        title="Delete permanently"
                        className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Bottom Quick-Import & Settings Action Bar */}
      <div className="p-2 border-t border-[var(--border)] bg-[var(--card)]/50 flex items-center gap-1.5">
        <button
          onClick={() => setImportModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-[var(--background)] hover:bg-neutral-800 text-neutral-300 font-medium text-xs transition-colors cursor-pointer truncate"
          title="Import or Mount Vault"
        >
          <FolderUp className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          <span className="truncate">Import / Mount Vault</span>
        </button>
        <Link
          href="/settings"
          className="p-1.5 rounded-md bg-[var(--background)] hover:bg-neutral-800 text-neutral-400 hover:text-[var(--foreground)] transition-colors cursor-pointer shrink-0"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>

      <NewNoteModal isOpen={newNoteModal} onClose={() => setNewNoteModal(false)} />
    </div>
  );
}
