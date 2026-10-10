'use client';

import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { seedInitialVaultIfEmpty } from '@/src/lib/storage/db';
import { FileTree } from '@/src/components/sidebar/FileTree';
import { TiptapEditor } from '@/src/components/editor/TiptapEditor';
import { GraphView } from '@/src/components/graph/GraphView';
import { DatabaseView } from '@/src/components/database/DatabaseView';
import { VaultDropzone } from '@/src/components/upload/VaultDropzone';
import { ImportProgressModal } from '@/src/components/upload/ImportProgressModal';
import { QuickSearchModal } from '@/src/components/search/QuickSearchModal';
import {
  FolderUp,
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Plus,
  FileText,
  HardDrive,
  Database,
  Share2,
} from 'lucide-react';

export default function WorkspacePage() {
  const {
    activeFilePath,
    activeView,
    setActiveView,
    openTabs,
    openFileTab,
    closeFileTab,
    sidebarCollapsed,
    toggleSidebar,
    isImportModalOpen,
    setImportModalOpen,
    setIsSearchOpen,
    mountedMode,
    vaultName,
  } = useWorkspaceStore();

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    seedInitialVaultIfEmpty().then(() => {
      setHasInitialized(true);
    });
  }, []);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-white dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
      {/* 1. Universal Top Bar Contract (Zone 1: Wordmark, Zone 2: Nav, Zone 3: Primary Action) */}
      <header className="flex items-center justify-between gap-8 px-6 py-2.5 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-950 z-30 select-none">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          <span className="text-base font-bold tracking-tight text-neutral-900 dark:text-neutral-100 whitespace-nowrap">
            Kite Workspace
          </span>

          <span className="text-[11px] font-mono text-neutral-400 border border-neutral-200 dark:border-neutral-800 rounded px-1.5 py-0.5">
            {mountedMode === 'filesystem' ? 'Live Disk' : 'IndexedDB'}
          </span>
        </div>

        {/* Zone 2: Clean single-line text navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-600 dark:text-neutral-400">
          <button
            onClick={() => setActiveView('editor')}
            className={`whitespace-nowrap transition-colors ${
              activeView === 'editor'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            Editor Notes
          </button>
          <button
            onClick={() => setActiveView('graph')}
            className={`whitespace-nowrap transition-colors ${
              activeView === 'graph'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            Knowledge Graph
          </button>
          <button
            onClick={() => setActiveView('database')}
            className={`whitespace-nowrap transition-colors ${
              activeView === 'database'
                ? 'text-indigo-600 dark:text-indigo-400 font-semibold'
                : 'hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            Databases
          </button>
          <button
            onClick={() => setIsSearchOpen(true)}
            className="flex items-center gap-1.5 text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors whitespace-nowrap"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search (⌘K)</span>
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setImportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white bg-neutral-900 dark:bg-neutral-100 dark:text-neutral-900 rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors whitespace-nowrap shrink-0 shadow-xs"
          >
            <FolderUp className="w-3.5 h-3.5" />
            <span>Import Vault</span>
          </button>
        </div>
      </header>

      {/* 2. Workspace Document Tabs Bar */}
      {activeView === 'editor' && (
        <div className="flex items-center bg-neutral-100/70 dark:bg-neutral-900/40 border-b border-neutral-200 dark:border-neutral-800 px-2 py-0 overflow-x-auto select-none">
          {openTabs.map((tab) => {
            const isActive = tab.path === activeFilePath;
            return (
              <div
                key={tab.path}
                onClick={() => openFileTab(tab.path, tab.title)}
                className={`group flex items-center gap-2 py-1.5 px-3 border-r border-neutral-200/80 dark:border-neutral-800 text-xs cursor-pointer transition-colors max-w-[200px] shrink-0 ${
                  isActive
                    ? 'bg-white dark:bg-neutral-950 font-semibold text-neutral-900 dark:text-neutral-100 border-t-2 border-t-indigo-600'
                    : 'text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{tab.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFileTab(tab.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-800 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 transition-opacity ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => setImportModalOpen(true)}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 ml-1 rounded hover:bg-neutral-200/50 transition-colors"
            title="Import folder or notes"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Main Split View (Sidebar + Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!sidebarCollapsed && <FileTree />}

        {/* Dynamic Center Canvas View */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeView === 'editor' && (
            <>
              {activeFilePath ? (
                <TiptapEditor key={activeFilePath} filePath={activeFilePath} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-neutral-500">
                  <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3" />
                  <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                    No note open
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                    Select a note from the file tree, press ⌘K to search, or import an Obsidian vault folder.
                  </p>
                  <button
                    onClick={() => setImportModalOpen(true)}
                    className="mt-4 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                  >
                    Open or Import Vault
                  </button>
                </div>
              )}
            </>
          )}

          {activeView === 'graph' && <GraphView />}

          {activeView === 'database' && <DatabaseView />}
        </main>
      </div>

      {/* Modals & Overlays */}
      <VaultDropzone isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} />
      <ImportProgressModal />
      <QuickSearchModal />
    </div>
  );
}
