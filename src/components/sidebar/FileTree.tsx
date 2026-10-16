'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { db } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { useTreeStructure, TreeNode, collectAllFolderPaths } from '@/src/hooks/useTreeStructure';
import { FolderNode } from './tree/FolderNode';
import { FileNodeRow } from './tree/FileNodeRow';
import { FileTreeModals } from './tree/FileTreeModals';
import { TrashSection } from './TrashSection';
import { useFileTreeActions } from './useFileTreeActions';
import { useTreeDragAndDrop } from './hooks/useTreeDragAndDrop';
import { useSidebarResize } from './hooks/useSidebarResize';
import { SidebarResizer } from './SidebarResizer';
import { Search, FolderUp, Settings, Replace } from 'lucide-react';
import Link from 'next/link';
import { useContextMenu } from '@/src/hooks/useContextMenu';
import { FileTreeCanvasContextMenu } from './tree/FileTreeCanvasContextMenu';
import { useFindReplaceStore } from '@/src/stores/findReplaceStore';
import { formatShortcutForDisplay } from '@/src/lib/shortcuts/shortcutManager';

export function FileTree() {
  const rawFiles = useLiveQuery(() => db.files.toArray());
  const files = useMemo(() => rawFiles ?? [], [rawFiles]);

  // File action drawer/menu and modal targets
  const [activeMenuNode, setActiveMenuNode] = useState<TreeNode | null>(null);
  const [menuAnchorRect, setMenuAnchorRect] = useState<DOMRect | null>(null);
  const [renameTarget, setRenameTarget] = useState<TreeNode | null>(null);
  const [moveTarget, setMoveTarget] = useState<TreeNode | null>(null);

  const {
    isOpen: isCanvasMenuOpen,
    position: canvasMenuPosition,
    openMenu: openCanvasMenu,
    closeMenu: closeCanvasMenu,
  } = useContextMenu();

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
    isNewNoteModalOpen,
    setNewNoteModalOpen,
    customFolders,
    keyboardShortcuts,
    expandedFolders,
    toggleExpandedFolder,
    setExpandedFolders,
  } = useWorkspaceStore();

  const openFolders = useMemo(() => new Set(expandedFolders), [expandedFolders]);

  const {
    sidebarWidth,
    isResizing,
    startResize,
    resetWidth,
    setSidebarWidth,
  } = useSidebarResize();

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

  const treeData = useTreeStructure(activeFiles, '', customFolders);

  const folderSuggestions = useMemo(() => {
    return collectAllFolderPaths(treeData, activeFiles, customFolders);
  }, [treeData, activeFiles, customFolders]);

  const { duplicateNode, renameNode, moveNode, handleNewNoteInFolder } = useFileTreeActions({
    activeFiles,
    showToast,
    openFileTab,
    renameFileTab,
  });

  const handleRelocateNode = useCallback(
    async (sourcePath: string, destFolder: string) => {
      const file = activeFiles.find((f) => f.path === sourcePath);
      const node: TreeNode = {
        id: file ? (file.id || sourcePath) : `folder:${sourcePath}`,
        name: sourcePath.split('/').pop() || sourcePath,
        path: sourcePath,
        isFolder: !file,
        file,
      };
      await moveNode(node, destFolder);
    },
    [activeFiles, moveNode]
  );

  const {
    isDragOverTree,
    draggedNodePath,
    dropTargetFolderPath,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleNodeDragStart,
    handleNodeDragEnd,
    handleFolderDragOver,
    handleFolderDragEnter,
    handleFolderDragLeave,
    handleFolderDrop,
  } = useTreeDragAndDrop({
    activeWorkspaceId: activeWorkspaceId || 'default-vault',
    setImportProgress,
    openFileTab,
    onRelocateNode: handleRelocateNode,
  });

  const toggleFolder = useCallback((path: string) => {
    toggleExpandedFolder(path);
  }, [toggleExpandedFolder]);

  const handleOpenActionMenu = useCallback((e: React.MouseEvent, node: TreeNode) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'contextmenu') {
      setMenuAnchorRect({
        left: e.clientX,
        top: e.clientY,
        right: e.clientX,
        bottom: e.clientY,
        width: 0,
        height: 0,
      } as DOMRect);
    } else {
      setMenuAnchorRect((e.currentTarget as HTMLElement).getBoundingClientRect());
    }
    setActiveMenuNode(node);
  }, []);

  return (
    <div
      style={{ width: `${sidebarWidth}px` }}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => {
        if (e.defaultPrevented) return;
        handleDrop(e);
      }}
      className={`relative shrink-0 h-full flex flex-col bg-[var(--card)] border-r border-[var(--border)] text-[var(--foreground)] select-none ${
        isResizing ? '' : 'transition-[background-color,border-color]'
      } ${
        isDragOverTree ? 'ring-2 ring-indigo-500 bg-indigo-50/20' : ''
      }`}
    >
      {/* Search Bar & Vault RegEx Find-and-Replace */}
      <div className="p-2 border-b border-[var(--border)] flex items-center gap-1.5">
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          className="flex-1 min-w-0 flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-[var(--background)] hover:bg-[var(--border)]/40 border border-[var(--border)] text-xs text-neutral-400 hover:text-[var(--foreground)] transition-colors cursor-pointer group"
          title={`Search notes (${formatShortcutForDisplay(keyboardShortcuts.quickSearch)})`}
          aria-label={`Search notes (${formatShortcutForDisplay(keyboardShortcuts.quickSearch)})`}
        >
          <div className="flex items-center gap-2 truncate">
            <Search className="w-3.5 h-3.5 text-neutral-400 group-hover:text-[var(--foreground)] shrink-0 transition-colors" />
            <span className="truncate text-xs">Search notes...</span>
          </div>
          <kbd className="font-mono text-[10px] text-neutral-400 group-hover:text-[var(--foreground)] border border-[var(--border)] bg-[var(--card)] px-1 py-0.5 rounded shrink-0 transition-colors">
            {formatShortcutForDisplay(keyboardShortcuts.quickSearch)}
          </kbd>
        </button>
        <button
          type="button"
          onClick={() => useFindReplaceStore.getState().setOpen(true)}
          title={`Vault RegEx Find & Replace (${formatShortcutForDisplay(keyboardShortcuts.findReplace)})`}
          aria-label={`Vault RegEx Find & Replace (${formatShortcutForDisplay(keyboardShortcuts.findReplace)})`}
          className="p-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--border)]/40 text-neutral-400 hover:text-[var(--foreground)] transition-colors shrink-0 cursor-pointer"
        >
          <Replace className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* File Tree List */}
      <div
        className="flex-1 overflow-y-auto px-1.5 py-1 space-y-0.5"
        onContextMenu={(e) => {
          if (e.target === e.currentTarget || !(e.target as HTMLElement).closest('[role="treeitem"]')) {
            openCanvasMenu(e);
          }
        }}
      >
        {treeData.length === 0 ? (
          <div className="text-center py-8 text-neutral-400 text-xs">
            No notes found.
            <div className="mt-1 text-[11px]">Drop folders or click import below.</div>
          </div>
        ) : (
          treeData.map((node) =>
            node.isFolder ? (
              <FolderNode
                key={node.path}
                node={node}
                depth={0}
                openFolders={openFolders}
                activeFilePath={activeFilePath}
                onToggleFolder={toggleFolder}
                onOpenFile={openFileTab}
                onOpenActionMenu={handleOpenActionMenu}
                dropTargetFolderPath={dropTargetFolderPath}
                draggedNodePath={draggedNodePath}
                onFolderDragOver={handleFolderDragOver}
                onFolderDragEnter={handleFolderDragEnter}
                onFolderDragLeave={handleFolderDragLeave}
                onFolderDrop={handleFolderDrop}
                onNodeDragStart={handleNodeDragStart}
                onNodeDragEnd={handleNodeDragEnd}
              />
            ) : (
              <FileNodeRow
                key={node.path}
                node={node}
                depth={0}
                activeFilePath={activeFilePath}
                onOpenFile={openFileTab}
                onOpenActionMenu={handleOpenActionMenu}
                draggedNodePath={draggedNodePath}
                onNodeDragStart={handleNodeDragStart}
                onNodeDragEnd={handleNodeDragEnd}
              />
            )
          )
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

      {/* Modals and Context Menus Container */}
      <FileTreeModals
        activeMenuNode={activeMenuNode}
        menuAnchorRect={menuAnchorRect}
        onCloseActionMenu={() => { setActiveMenuNode(null); setMenuAnchorRect(null); }}
        renameTarget={renameTarget}
        setRenameTarget={setRenameTarget}
        moveTarget={moveTarget}
        setMoveTarget={setMoveTarget}
        newNoteModal={isNewNoteModalOpen}
        setNewNoteModal={setNewNoteModalOpen}
        folderSuggestions={folderSuggestions}
        duplicateNode={duplicateNode}
        renameNode={renameNode}
        moveNode={moveNode}
        promptDeleteNote={promptDeleteNote}
        onNewNoteInFolder={handleNewNoteInFolder}
      />

      {/* Canvas Context Menu (Right-click on Empty Space) */}
      <FileTreeCanvasContextMenu
        isOpen={isCanvasMenuOpen}
        position={canvasMenuPosition}
        onClose={closeCanvasMenu}
        onCollapseAll={() => setExpandedFolders([])}
      />

      {/* Draggable Sidebar Resizer Handle */}
      <SidebarResizer
        onStartResize={startResize}
        onReset={resetWidth}
        currentWidth={sidebarWidth}
        onKeyDownResize={setSidebarWidth}
        isResizing={isResizing}
      />
    </div>
  );
}
