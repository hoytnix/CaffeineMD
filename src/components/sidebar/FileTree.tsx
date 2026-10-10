'use client';

import React, { useState, useMemo, useRef } from 'react';
import { db, VaultFile } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { NativeFileSystemAdapter } from '@/src/lib/storage/fileSystem';
import {
  scanDroppedItems,
  processStandardFileInput,
  runIngestionPipeline,
} from '@/src/lib/storage/importPipeline';
import {
  Folder,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Paperclip,
  Plus,
  Search,
  HardDrive,
  FolderUp,
  FilePlus,
  ChevronRight,
  ChevronDown,
  Trash2,
  Share2,
  Database,
  Sliders,
  X,
} from 'lucide-react';

interface TreeNode {
  name: string;
  path: string;
  isFolder: boolean;
  children?: TreeNode[];
  file?: VaultFile;
}

export function FileTree() {
  const rawFiles = useLiveQuery(() => db.files.toArray());
  const files = useMemo(() => rawFiles ?? [], [rawFiles]);
  const [openFolders, setOpenFolders] = useState<Set<string>>(new Set(['Projects', 'Engineering']));
  const [isDragOverTree, setIsDragOverTree] = useState(false);
  const [filterQuery, setFilterQuery] = useState('');
  const [newNoteModal, setNewNoteModal] = useState(false);
  const [newNoteName, setNewNoteName] = useState('');

  const folderInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    activeFilePath,
    openFileTab,
    vaultName,
    setImportProgress,
    activeView,
    setActiveView,
    setImportModalOpen,
  } = useWorkspaceStore();

  // Build tree structure from paths
  const treeData = useMemo(() => {
    const root: TreeNode = { name: 'root', path: '', isFolder: true, children: [] };

    // Filter files
    const displayed = filterQuery.trim()
      ? files.filter(
          (f) =>
            f.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
            f.title?.toLowerCase().includes(filterQuery.toLowerCase())
        )
      : files;

    displayed.forEach((file) => {
      const parts = file.path.split('/');
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join('/');

        if (!current.children) current.children = [];

        let existing = current.children.find((c) => c.name === part);
        if (!existing) {
          existing = {
            name: part,
            path: currentPath,
            isFolder: !isLast,
            children: isLast ? undefined : [],
            file: isLast ? file : undefined,
          };
          current.children.push(existing);
        }
        current = existing;
      }
    });

    // Sort folders first, then files alphabetically
    const sortTree = (node: TreeNode) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortTree);
      }
    };
    sortTree(root);

    return root.children || [];
  }, [files, filterQuery]);

  const toggleFolder = (path: string) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };

  // Drag and drop onto sidebar
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

    const rawFiles = await scanDroppedItems(items);
    if (rawFiles.length > 0) {
      await runIngestionPipeline(rawFiles, 'default-vault', (p) => setImportProgress(p));
      openFileTab(rawFiles[0].relativePath, rawFiles[0].name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleCreateNewNote = async () => {
    if (!newNoteName.trim()) return;

    let path = newNoteName.trim();
    if (!path.endsWith('.md')) path += '.md';

    const title = path.replace(/\.[^/.]+$/, '').split('/').pop() || path;

    const newNote: VaultFile = {
      id: path,
      path,
      name: path.split('/').pop() || path,
      title,
      extension: 'md',
      content: `# ${title}\n\nStart writing here...`,
      frontmatter: { title },
      tags: [],
      isBinary: false,
      size: 50,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      vaultId: 'default-vault',
    };

    await db.files.put(newNote);
    await NativeFileSystemAdapter.createNewFileOnDisk(path, newNote.content);
    openFileTab(path, title);
    setNewNoteName('');
    setNewNoteModal(false);
  };

  const handleDeleteFile = async (e: React.MouseEvent, path: string) => {
    e.stopPropagation();
    if (confirm(`Delete ${path}?`)) {
      await db.files.delete(path);
      await db.backlinks.where('sourcePath').equals(path).delete();
    }
  };

  const renderTreeItem = (node: TreeNode, depth = 0) => {
    const isFolderOpen = openFolders.has(node.path);
    const isActive = activeFilePath === node.path;

    if (node.isFolder) {
      return (
        <div key={node.path} className="select-none">
          <div
            onClick={() => toggleFolder(node.path)}
            style={{ paddingLeft: `${depth * 12 + 10}px` }}
            className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 cursor-pointer text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors group"
          >
            {isFolderOpen ? (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            )}
            {isFolderOpen ? (
              <FolderOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            ) : (
              <Folder className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 shrink-0" />
            )}
            <span className="truncate">{node.name}</span>
          </div>

          {isFolderOpen && node.children && (
            <div>{node.children.map((child) => renderTreeItem(child, depth + 1))}</div>
          )}
        </div>
      );
    }

    const isImage = node.file?.mimeType?.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(node.file?.extension || '');

    return (
      <div
        key={node.path}
        onClick={() => openFileTab(node.path, node.file?.title)}
        style={{ paddingLeft: `${depth * 12 + 18}px` }}
        className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer text-xs transition-colors group ${
          isActive
            ? 'bg-neutral-200 dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-neutral-100'
            : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {isImage ? (
            <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          ) : node.file?.isBinary ? (
            <Paperclip className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          ) : (
            <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          )}
          <span className="truncate">{node.file?.title || node.name}</span>
        </div>

        <button
          onClick={(e) => handleDeleteFile(e, node.path)}
          className="opacity-0 group-hover:opacity-100 p-1 text-neutral-400 hover:text-rose-500 transition-opacity"
          title="Delete file"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    );
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
      <div className="p-3 border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-xs tracking-tight truncate">{vaultName}</span>
          </div>
          <button
            onClick={() => setNewNoteModal(true)}
            className="p-1 rounded-md text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
            title="Create new note"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        {/* Workspace Views Switcher */}
        <div className="grid grid-cols-3 gap-1 p-0.5 bg-neutral-200/60 dark:bg-neutral-800 rounded-md text-xs">
          <button
            onClick={() => setActiveView('editor')}
            className={`py-1 rounded text-[11px] font-medium transition-colors ${
              activeView === 'editor'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Editor
          </button>
          <button
            onClick={() => setActiveView('graph')}
            className={`py-1 rounded text-[11px] font-medium transition-colors ${
              activeView === 'graph'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Graph
          </button>
          <button
            onClick={() => setActiveView('database')}
            className={`py-1 rounded text-[11px] font-medium transition-colors ${
              activeView === 'database'
                ? 'bg-white dark:bg-neutral-900 text-neutral-900 dark:text-neutral-100 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200'
            }`}
          >
            Database
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
            <button onClick={() => setFilterQuery('')} className="text-neutral-400 hover:text-neutral-600">
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
          treeData.map((node) => renderTreeItem(node, 0))
        )}
      </div>

      {/* Bottom Quick-Import Action Bar */}
      <div className="p-2 border-t border-neutral-200/80 dark:border-neutral-800 bg-white/50 dark:bg-neutral-900/30">
        <button
          onClick={() => setImportModalOpen(true)}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md bg-neutral-100 hover:bg-neutral-200/80 dark:bg-neutral-800 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-300 font-medium text-xs transition-colors"
        >
          <FolderUp className="w-3.5 h-3.5 text-indigo-500" />
          <span>Import / Mount Vault</span>
        </button>
      </div>

      {/* New Note Modal */}
      {newNoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl">
            <h4 className="text-xs font-semibold mb-2">Create New Note</h4>
            <input
              type="text"
              placeholder="e.g. Daily Standup or Projects/Alpha.md"
              value={newNoteName}
              onChange={(e) => setNewNoteName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateNewNote()}
              autoFocus
              className="w-full px-2.5 py-1.5 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 outline-none focus:border-indigo-500 mb-3"
            />
            <div className="flex justify-end gap-2 text-xs">
              <button
                onClick={() => setNewNoteModal(false)}
                className="px-3 py-1 text-neutral-500 hover:text-neutral-700"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNewNote}
                className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
