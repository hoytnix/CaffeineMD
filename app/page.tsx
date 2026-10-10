'use client';

import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { seedInitialVaultIfEmpty } from '@/src/lib/storage/db';
import { FileTree } from '@/src/components/sidebar/FileTree';
import { TiptapEditor } from '@/src/components/editor/TiptapEditor';
import { GraphView } from '@/src/components/graph/GraphView';
import { DatabaseView } from '@/src/components/database/DatabaseView';
import { TagCloudView } from '@/src/components/tags/TagCloudView';
import { VaultDropzone } from '@/src/components/upload/VaultDropzone';
import { ImportProgressModal } from '@/src/components/upload/ImportProgressModal';
import { QuickSearchModal } from '@/src/components/search/QuickSearchModal';
import { EmojiDrawer } from '@/src/components/emoji/EmojiDrawer';
import { useEmojiDrawer } from '@/src/hooks/useEmojiDrawer';
import { WorkspacePopover } from '@/src/components/workspace/WorkspacePopover';
import { THEME_PRESETS, applyThemeToDocument } from '@/src/lib/themes/themeDefinitions';
import { DeleteConfirmModal } from '@/src/components/common/DeleteConfirmModal';
import {
  Search,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Plus,
  FileText,
  Network,
  Table,
  Kanban,
  List,
  Tag,
  Smile,
  Check,
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
    setTheme,
    toggleEmojiDrawer,
    toastMessage,
  } = useWorkspaceStore();

  // Activate universal emoji drawer global listener (Shift + Space)
  useEmojiDrawer();

  const [hasInitialized, setHasInitialized] = useState(false);

  // Initial vault seed and theme rehydration
  useEffect(() => {
    seedInitialVaultIfEmpty().then(() => {
      setHasInitialized(true);
    });

    if (typeof window !== 'undefined') {
      try {
        const savedThemeId = localStorage.getItem('kite-theme-id');
        const savedCustom = localStorage.getItem('kite-custom-theme');
        if (savedThemeId) {
          setTheme(savedThemeId);
        } else {
          applyThemeToDocument(THEME_PRESETS[0]);
        }
      } catch (err) {
        console.warn('Theme hydration error:', err);
      }
    }
  }, [setTheme]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)]">
      {/* 1. Universal Top Bar Contract: Cleaned, Zero Import Button, Zero IndexedDB Badge */}
      <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] z-30 select-none">
        {/* Zone 1: Sidebar Toggle & 1:1 SVG Kite Logo with Workspace Popover */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* 1:1 Kite SVG Logo Mark with Workspace Popover */}
          <WorkspacePopover />
        </div>

        {/* Zone 2: 5 Icon-Only Peer View Tabs (STRICT REQUIREMENT: ZERO TEXT LABELS) */}
        <nav className="flex items-center gap-1 bg-neutral-100/80 dark:bg-neutral-900/80 p-1 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60">
          {/* 1. Editor */}
          <button
            onClick={() => setActiveView('editor')}
            title="Editor Notes"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'editor'
                ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs scale-105'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* 2. Knowledge Graph */}
          <button
            onClick={() => setActiveView('graph')}
            title="Knowledge Graph"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'graph'
                ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs scale-105'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <Network className="w-4 h-4" />
          </button>

          {/* 3. Table Database View */}
          <button
            onClick={() => setActiveView('table')}
            title="Table View"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'table'
                ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs scale-105'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <Table className="w-4 h-4" />
          </button>

          {/* 4. Board / Kanban View */}
          <button
            onClick={() => setActiveView('board')}
            title="Kanban Board View"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'board'
                ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs scale-105'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <Kanban className="w-4 h-4" />
          </button>

          {/* 5. List View */}
          <button
            onClick={() => setActiveView('list')}
            title="List View"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'list'
                ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs scale-105'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <List className="w-4 h-4" />
          </button>

          {/* 6. Tags View */}
          <button
            onClick={() => setActiveView('tags')}
            title="Tag Cloud & Registry"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'tags'
                ? 'bg-white dark:bg-neutral-800 text-indigo-600 dark:text-indigo-400 shadow-xs scale-105'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
            }`}
          >
            <Tag className="w-4 h-4" />
          </button>
        </nav>

        {/* Zone 3: Search & Emoji Triggers (No Import Vault button, No IndexedDB badge) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => toggleEmojiDrawer()}
            title="Emoji Drawer (Shift + Space)"
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <Smile className="w-4 h-4 text-amber-500" />
          </button>

          <button
            onClick={() => setIsSearchOpen(true)}
            title="Quick Search (⌘K)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer text-xs"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono text-[10px] text-neutral-400 border border-neutral-200 dark:border-neutral-800 px-1 py-0.5 rounded">
              ⌘K
            </span>
          </button>
        </div>
      </header>

      {/* 2. Workspace Document Tabs Bar (Shown in Editor View) */}
      {activeView === 'editor' && (
        <div className="flex items-center bg-[var(--card)]/50 border-b border-[var(--border)] px-2 py-0 overflow-x-auto select-none">
          {openTabs.map((tab) => {
            const isActive = tab.path === activeFilePath;
            return (
              <div
                key={tab.path}
                onClick={() => openFileTab(tab.path, tab.title)}
                className={`group flex items-center gap-2 py-1.5 px-3 border-r border-[var(--border)] text-xs cursor-pointer transition-colors max-w-[200px] shrink-0 ${
                  isActive
                    ? 'bg-[var(--background)] font-semibold text-[var(--foreground)] border-t-2 border-t-[var(--accent)]'
                    : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--card)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                <span className="truncate">{tab.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFileTab(tab.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-[var(--foreground)] transition-opacity ml-1"
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
                    Select a note from the file tree, press ⌘K to search, or mount a local disk folder.
                  </p>
                  <button
                    onClick={() => setImportModalOpen(true)}
                    className="mt-4 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Open or Import Vault
                  </button>
                </div>
              )}
            </>
          )}

          {activeView === 'graph' && <GraphView />}

          {activeView === 'table' && <DatabaseView mode="table" />}

          {activeView === 'board' && <DatabaseView mode="board" />}

          {activeView === 'list' && <DatabaseView mode="list" />}

          {activeView === 'tags' && <TagCloudView />}
        </main>
      </div>

      {/* Modals & Overlays */}
      <VaultDropzone isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} />
      <ImportProgressModal />
      <QuickSearchModal />
      <EmojiDrawer />
      <DeleteConfirmModal />

      {/* Floating Global Affirmative Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900/95 dark:bg-white/95 text-white dark:text-neutral-900 shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
