'use client';

import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { useWorkspaceRouter } from '@/src/hooks/useWorkspaceRouter';
import { seedInitialVaultIfEmpty } from '@/src/lib/storage/db';
import { FileTree } from '@/src/components/sidebar/FileTree';
import { TiptapEditor } from '@/src/components/editor/TiptapEditor';
import { GraphView } from '@/src/components/graph/GraphView';
import { DatabaseView } from '@/src/components/database/DatabaseView';
import { TagCloudView } from '@/src/components/tags/TagCloudView';
import { SettingsView } from '@/src/components/settings/SettingsView';
import { VaultDropzone } from '@/src/components/upload/VaultDropzone';
import { ImportProgressModal } from '@/src/components/upload/ImportProgressModal';
import { QuickSearchModal } from '@/src/components/search/QuickSearchModal';
import { EmojiDrawer } from '@/src/components/emoji/EmojiDrawer';
import { useEmojiDrawer } from '@/src/hooks/useEmojiDrawer';
import { WorkspacePopover } from '@/src/components/workspace/WorkspacePopover';
import { THEME_PRESETS, applyThemeToDocument } from '@/src/lib/themes/themeDefinitions';
import { DeleteConfirmModal } from '@/src/components/common/DeleteConfirmModal';
import { NewNoteModal } from '@/src/components/sidebar/NewNoteModal';
import {
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
  ChevronDown,
} from 'lucide-react';

export default function WorkspacePage() {
  // Bi-directional Gmail-style URL and hash routing synchronization
  useWorkspaceRouter();

  const {
    activeFilePath,
    activeView,
    activeTab,
    setActiveTab,
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

  const [isNewNoteModalOpen, setIsNewNoteModalOpen] = useState(false);
  const [, setHasInitialized] = useState(false);

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
      {/* 1. Universal Top Bar Contract: Fully Theme-Adaptive */}
      <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] z-30 select-none text-[var(--foreground)]">
        {/* Zone 1: Sidebar Toggle & Kite MD Logo with Workspace Popover */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-md text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10 transition-colors cursor-pointer"
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Kite MD Logo Mark with Workspace Popover */}
          <WorkspacePopover />
        </div>

        {/* Zone 2: View Switcher (Horizontal tabs on md+, Dropdown select on mobile) */}
        <div className="flex items-center">
          {/* Desktop / Tablet: 6 Icon-Only Peer View Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-[var(--background)]/80 p-1 rounded-xl border border-[var(--border)] shadow-xs">
            {/* 1. Editor */}
            <button
              onClick={() => setActiveTab('editor')}
              title="Editor Notes"
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                activeView === 'editor' && activeTab !== 'settings'
                  ? 'bg-[var(--card)] text-[var(--accent)] shadow-xs scale-105 border border-[var(--border)] font-semibold'
                  : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
              }`}
            >
              <FileText className="w-4 h-4" />
            </button>

            {/* 2. Knowledge Graph */}
            <button
              onClick={() => setActiveTab('graph')}
              title="Knowledge Graph"
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                activeView === 'graph' && activeTab !== 'settings'
                  ? 'bg-[var(--card)] text-[var(--accent)] shadow-xs scale-105 border border-[var(--border)] font-semibold'
                  : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
              }`}
            >
              <Network className="w-4 h-4" />
            </button>

            {/* 3. Table Database View */}
            <button
              onClick={() => setActiveTab('table')}
              title="Table View"
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                activeView === 'table' && activeTab !== 'settings'
                  ? 'bg-[var(--card)] text-[var(--accent)] shadow-xs scale-105 border border-[var(--border)] font-semibold'
                  : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
              }`}
            >
              <Table className="w-4 h-4" />
            </button>

            {/* 4. Board / Kanban View */}
            <button
              onClick={() => setActiveTab('kanban')}
              title="Kanban Board View"
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                (activeView === 'board' || activeTab === 'kanban') && activeTab !== 'settings'
                  ? 'bg-[var(--card)] text-[var(--accent)] shadow-xs scale-105 border border-[var(--border)] font-semibold'
                  : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
              }`}
            >
              <Kanban className="w-4 h-4" />
            </button>

            {/* 5. List View */}
            <button
              onClick={() => setActiveTab('list')}
              title="List View"
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                activeView === 'list' && activeTab !== 'settings'
                  ? 'bg-[var(--card)] text-[var(--accent)] shadow-xs scale-105 border border-[var(--border)] font-semibold'
                  : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
              }`}
            >
              <List className="w-4 h-4" />
            </button>

            {/* 6. Tags View */}
            <button
              onClick={() => setActiveTab('tags')}
              title="Tag Cloud & Registry"
              className={`p-2 rounded-lg transition-all cursor-pointer ${
                activeView === 'tags' && activeTab !== 'settings'
                  ? 'bg-[var(--card)] text-[var(--accent)] shadow-xs scale-105 border border-[var(--border)] font-semibold'
                  : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
              }`}
            >
              <Tag className="w-4 h-4" />
            </button>
          </nav>

          {/* Mobile: Compact Dropdown Select Menu */}
          <div className="flex md:hidden items-center relative">
            <div className="relative flex items-center bg-[var(--background)]/90 border border-[var(--border)] rounded-xl px-2.5 py-1.5 shadow-xs">
              <span className="mr-1.5 text-[var(--accent)] pointer-events-none">
                {activeView === 'editor' && <FileText className="w-4 h-4" />}
                {activeView === 'graph' && <Network className="w-4 h-4" />}
                {activeView === 'table' && <Table className="w-4 h-4" />}
                {(activeView === 'board' || activeTab === 'kanban') && <Kanban className="w-4 h-4" />}
                {activeView === 'list' && <List className="w-4 h-4" />}
                {activeView === 'tags' && <Tag className="w-4 h-4" />}
              </span>
              <select
                value={activeView === 'board' ? 'kanban' : activeView}
                onChange={(e) => setActiveTab(e.target.value as any)}
                aria-label="Select workspace view"
                className="bg-transparent text-xs font-semibold text-[var(--foreground)] outline-none cursor-pointer pr-4 appearance-none"
              >
                <option value="editor" className="bg-[var(--card)] text-[var(--foreground)]">Editor</option>
                <option value="graph" className="bg-[var(--card)] text-[var(--foreground)]">Graph</option>
                <option value="table" className="bg-[var(--card)] text-[var(--foreground)]">Table</option>
                <option value="kanban" className="bg-[var(--card)] text-[var(--foreground)]">Kanban</option>
                <option value="list" className="bg-[var(--card)] text-[var(--foreground)]">List</option>
                <option value="tags" className="bg-[var(--card)] text-[var(--foreground)]">Tags</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-[var(--foreground)]/50 absolute right-2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Zone 3: Global Actions (Emoji Drawer, Settings accessible via File Tree) */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => toggleEmojiDrawer()}
            title="Emoji Drawer (⌘⇧Space / Ctrl+Shift+Space)"
            className="p-1.5 rounded-lg text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10 transition-colors cursor-pointer"
          >
            <Smile className="w-4 h-4 text-amber-500" />
          </button>
        </div>
      </header>

      {/* 2. Workspace Document Tabs Bar (Shown in Editor View) */}
      {activeView === 'editor' && activeTab !== 'settings' && (
        <div className="flex items-center bg-[var(--card)]/60 border-b border-[var(--border)] px-2 py-0 overflow-x-auto select-none">
          {openTabs.map((tab) => {
            const isActive = tab.path === activeFilePath;
            return (
              <div
                key={tab.path}
                onClick={() => openFileTab(tab.path, tab.title)}
                className={`group flex items-center gap-2 py-1.5 px-3 border-r border-[var(--border)] text-xs cursor-pointer transition-colors max-w-[200px] shrink-0 ${
                  isActive
                    ? 'bg-[var(--background)] font-semibold text-[var(--foreground)] border-t-2 border-t-[var(--accent)]'
                    : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-[var(--foreground)]/40 shrink-0" />
                <span className="truncate">{tab.title}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFileTab(tab.path);
                  }}
                  className={`p-0.5 rounded hover:bg-[var(--foreground)]/10 text-[var(--foreground)]/40 hover:text-[var(--foreground)] transition-opacity ml-1 ${
                    isActive
                      ? 'opacity-100'
                      : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'
                  }`}
                  title="Close tab"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => setIsNewNoteModalOpen(true)}
            className="p-1.5 text-[var(--foreground)]/50 hover:text-[var(--foreground)] ml-1 rounded hover:bg-[var(--foreground)]/10 transition-colors cursor-pointer"
            title="New Note"
            aria-label="New Note"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* 3. Main Split View (Sidebar + Canvas) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {!sidebarCollapsed && activeView !== 'settings' && activeTab !== 'settings' && <FileTree />}

        {/* Dynamic Center Canvas View */}
        <main className="flex-1 flex flex-col overflow-hidden relative">
          {activeView === 'editor' && activeTab !== 'settings' && (
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

          {activeView === 'graph' && activeTab !== 'settings' && <GraphView />}

          {activeView === 'table' && activeTab !== 'settings' && <DatabaseView mode="table" />}

          {(activeView === 'board' || activeTab === 'kanban') && activeTab !== 'settings' && (
            <DatabaseView mode="board" />
          )}

          {activeView === 'list' && activeTab !== 'settings' && <DatabaseView mode="list" />}

          {activeView === 'tags' && activeTab !== 'settings' && <TagCloudView />}

          {(activeView === 'settings' || activeTab === 'settings') && (
            <div className="flex-1 overflow-y-auto">
              <SettingsView onBack={() => setActiveTab('editor')} />
            </div>
          )}
        </main>
      </div>

      {/* Modals & Overlays */}
      <VaultDropzone isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} />
      <NewNoteModal isOpen={isNewNoteModalOpen} onClose={() => setIsNewNoteModalOpen(false)} />
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
