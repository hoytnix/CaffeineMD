'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { db } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { scanDroppedItems, runIngestionPipeline } from '@/src/lib/storage/importPipeline';
import { useTreeStructure, TreeNode } from '@/src/hooks/useTreeStructure';
import { FileTreeItem } from './FileTreeItem';
import { NewNoteModal } from './NewNoteModal';
import { FileActionMenu } from './FileActionMenu';
import { RenameModal, MoveModal } from './FileModals';
import { TrashSection } from './TrashSection';
import { useFileTreeActions } from './useFileTreeActions';
import { Search, FolderUp, Settings } from 'lucide-react';
import Link from 'next/link';

export function FileTree() {
  const rawFiles = useLiveQuery(() => db.files.toArray());
  const files = useMemo(() => rawFiles ?? [], [rawFiles]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['Projects', 'Engineering']));
  const [isDragOverTree, setIsDragOverTree] = useState(false);
  const [newNoteModal, setNewNoteModal] = useState(false);

  // File action drawer/menu state
  const [activeMenuNode, setActiveMenuNode] = useState<TreeNode | null>(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);

  // Rename & Move modal state
  const [renameTarget, setRenameTarget] = useState<TreeNode | null>(null);
  const [moveTarget, setMoveTarget] = useState<TreeNode | null>(null);

  const {
    activeFilePath,
    activeWorkspaceId,
    openFileTab,
    renameFileTab,
    setImportProgress,
    setIsSearchOpen,
    setImportModalOpen,
    promptDeleteNote,
    showToast,
    purgeExpiredTrashNotes,
  } = useWorkspaceStore();

  React.useEffect(() => {
    purgeExpiredTrashNotes();
  }, [purgeExpiredTrashNotes]);

  const activeFiles = useMemo(() => {
    return files.filter((f) => {
      if (f.isTrash) return false;
      if (!activeWorkspaceId || activeWorkspaceId === 'default-vault') {
        return !f.vaultId || f.vaultId === 'default-vault';
      }
      return f.vaultId === activeWorkspaceId;
    });
  }, [files, activeWorkspaceId]);

  const trashFiles = useMemo(() => {
    return files.filter((f) => {
      if (!f.isTrash) return false;
      if (!activeWorkspaceId || activeWorkspaceId === 'default-vault') {
        return !f.vaultId || f.vaultId === 'default-vault';
      }
      return f.vaultId === activeWorkspaceId;
    });
  }, [files, activeWorkspaceId]);

  const treeData = useTreeStructure(activeFiles, '');

  const folderSuggestions = useMemo(() => {
    const set = new Set<string>();
    activeFiles.forEach((f) => {
      if (f.path.includes('/')) {
        const parts = f.path.split('/');
        for (let i = 1; i < parts.length; i++) {
          set.add(parts.slice(0, i).join('/'));
        }
      }
    });
    return Array.from(set).sort();
  }, [activeFiles]);

  const { duplicateNode, renameNode, moveNode } = useFileTreeActions({
    activeFiles,
    showToast,
    openFileTab,
    renameFileTab,
  });

  const toggleFolder = useCallback((path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }, []);

  const handleOpenActionMenu = useCallback((e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuAnchorRect(rect);
    setActiveMenuNode(node);
  }, []);

  const handleCloseActionMenu = useCallback(() => {
    setActiveMenuNode(null);
    setMenuAnchorRect(null);
  }, []);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOverTree(false);
    const items = e.dataTransfer.items;
    if (!items || items.length === 0) return;

    const droppedFiles = await scanDroppedItems(items);
    if (droppedFiles.length > 0) {
      await runIngestionPipeline(
        droppedFiles,
        activeWorkspaceId || 'default-vault',
        (p) => setImportProgress(p)
      );
      openFileTab(droppedFiles[0].relativePath, droppedFiles[0].name.replace(/\.[^/.]+$/, ''));
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragOverTree(true); }}
      onDragLeave={(e) => { e.preventDefault(); setIsDragOverTree(false); }}
      onDrop={handleDrop}
      className={`w-64 h-full flex flex-col bg-[var(--card)] border-r border-[var(--border)] text-[var(--foreground)] select-none transition-all ${
        isDragOverTree ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''
      }`}
    >
      {/* ⌘K Search Bar */}
      <div className="p-2 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--background)] hover:bg-[var(--border)]/40 border border-[var(--border)] text-xs text-neutral-400 hover:text-[var(--foreground)] transition-colors cursor-pointer group"
          title="Search notes (⌘K)"
          aria-label="Search notes (⌘K)"
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[var(--foreground)] shrink-0 transition-colors" />
            <span className="truncate text-xs">Search notes...</span>
          </div>
          <kbd className="font-mono text-[10px] text-neutral-400 group-hover:text-[var(--foreground)] border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 rounded shrink-0 transition-colors">
            ⌘K
          </kbd>
        </button>
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
              onOpenActionMenu={handleOpenActionMenu}
            />
          ))
        )}
      </div>

      {/* Ephemeral Trash Folder Section */}
      <TrashSection trashFiles={trashFiles} />

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

      {/* Action Popover Menu */}
      <FileActionMenu
        isOpen={Boolean(activeMenuNode && menuAnchorRect)}
        onClose={handleCloseActionMenu}
        anchorRect={menuAnchorRect}
        filePath={activeMenuNode?.path || ''}
        fileName={activeMenuNode?.file?.title || activeMenuNode?.name || ''}
        isFolder={Boolean(activeMenuNode?.isFolder)}
        onRename={() => setRenameTarget(activeMenuNode)}
        onDuplicate={() => activeMenuNode && duplicateNode(activeMenuNode)}
        onMove={() => setMoveTarget(activeMenuNode)}
        onTrash={() => {
          if (activeMenuNode) {
            promptDeleteNote(activeMenuNode.path, activeMenuNode.file?.title || activeMenuNode.name);
          }
        }}
      />

      {/* Rename Dialog Modal */}
      <RenameModal
        isOpen={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        currentTitle={renameTarget?.file?.title || renameTarget?.name?.replace(/\.[^/.]+$/, '') || ''}
        isFolder={Boolean(renameTarget?.isFolder)}
        onConfirm={(newName) => renameTarget ? renameNode(renameTarget, newName) : Promise.resolve()}
      />

      {/* Move Dialog Modal */}
      <MoveModal
        isOpen={Boolean(moveTarget)}
        onClose={() => setMoveTarget(null)}
        fileName={moveTarget?.file?.title || moveTarget?.name || ''}
        currentFolder={
          moveTarget?.path.includes('/')
            ? moveTarget.path.substring(0, moveTarget.path.lastIndexOf('/'))
            : ''
        }
        folderSuggestions={folderSuggestions}
        onConfirm={(targetFolder) => moveTarget ? moveNode(moveTarget, targetFolder) : Promise.resolve()}
      />
    </div>
  );
}
