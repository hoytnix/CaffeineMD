'use client';

import React, { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { useWorkspaceRouter } from '@/src/hooks/useWorkspaceRouter';
import { seedInitialVaultIfEmpty } from '@/src/lib/storage/db';
import { FileTree } from '@/src/components/sidebar/FileTree';
import { SplitPaneContainer } from '@/src/components/editor/SplitPaneContainer';
import { GraphView } from '@/src/components/graph/GraphView';
import { DatabaseView } from '@/src/components/database/DatabaseView';
import { TagCloudView } from '@/src/components/tags/TagCloudView';
import { SettingsView } from '@/src/components/settings/SettingsView';
import { VaultDropzone } from '@/src/components/upload/VaultDropzone';
import { ImportProgressModal } from '@/src/components/upload/ImportProgressModal';
import { QuickSearchModal } from '@/src/components/search/QuickSearchModal';
import { DocumentQuickSwitcherModal } from '@/src/components/search/DocumentQuickSwitcherModal';
import { TemplateSelectorModal } from '@/src/components/sidebar/TemplateSelectorModal';
import { EmojiDrawer } from '@/src/components/emoji/EmojiDrawer';
import { useEmojiDrawer } from '@/src/hooks/useEmojiDrawer';
import { WorkspaceHeader } from '@/src/components/workspace/WorkspaceHeader';
import { THEME_PRESETS, applyThemeToDocument } from '@/src/lib/themes/themeDefinitions';
import { DeleteConfirmModal } from '@/src/components/common/DeleteConfirmModal';
import { NewNoteModal } from '@/src/components/sidebar/NewNoteModal';
import { ExportPwaModal } from '@/src/components/export/ExportPwaModal';
import { VaultFindReplaceModal } from '@/src/components/search/VaultFindReplaceModal';
import { FileText, Check } from 'lucide-react';

export default function WorkspacePage() {
  // Bi-directional Gmail-style URL and hash routing synchronization
  useWorkspaceRouter();

  const {
    activeFilePath,
    activeView,
    activeTab,
    setActiveTab,
    sidebarCollapsed,
    isImportModalOpen,
    setImportModalOpen,
    isNewNoteModalOpen,
    setNewNoteModalOpen,
    setTheme,
    toastMessage,
    isFocusMode,
    setFocusMode,
    toggleFocusMode,
  } = useWorkspaceStore();

  // Activate universal emoji drawer global listener (Shift + Space)
  useEmojiDrawer();

  const [, setHasInitialized] = useState(false);

  // Focus Mode Global Shortcut (F11, Cmd+Shift+F, Esc to exit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F11' || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        toggleFocusMode();
      } else if (e.key === 'Escape' && isFocusMode) {
        e.preventDefault();
        setFocusMode(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocusMode, toggleFocusMode, setFocusMode]);

  // Initial vault seed and theme rehydration
  useEffect(() => {
    seedInitialVaultIfEmpty().then(() => {
      setHasInitialized(true);
    });

    if (typeof window !== 'undefined') {
      try {
        const savedThemeId = localStorage.getItem('kite-theme-id');
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
    <div
      style={{ backgroundColor: 'var(--theme-bg-primary-glass, var(--theme-bg-primary))' }}
      className="flex flex-col h-[100dvh] w-screen overflow-hidden bg-[var(--background)] text-[var(--foreground)] relative"
    >
      {/* 1. Top Navigation Bar (Hidden in Focus Mode) */}
      {!isFocusMode && <WorkspaceHeader />}

      {/* 2. Main Split View (Sidebar + Canvas) */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Sidebar (Hidden in Focus Mode) */}
        {!sidebarCollapsed && !isFocusMode && activeView !== 'settings' && activeTab !== 'settings' && (
          <FileTree />
        )}

        {/* Dynamic Center Canvas View */}
        <main className="flex-1 flex flex-col overflow-hidden relative min-h-0 min-w-0">
          {activeView === 'editor' && activeTab !== 'settings' && (
            <>
              {activeFilePath ? (
                <SplitPaneContainer primaryFilePath={activeFilePath} />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-neutral-500">
                  <FileText className="w-12 h-12 text-neutral-300 dark:text-neutral-700 mb-3" />
                  <h3 className="text-base font-semibold text-neutral-800 dark:text-neutral-200">
                    No note open
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1 max-w-sm">
                    Select a note from the file tree, press ⌘P to quick-switch, or ⌘K to search.
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

      {/* Floating Exit Focus Mode Badge */}
      {isFocusMode && (
        <button
          type="button"
          onClick={() => setFocusMode(false)}
          className="fixed top-4 right-4 z-50 flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[var(--card)]/90 hover:bg-[var(--card)] border border-[var(--border)] shadow-xl backdrop-blur-md text-xs text-neutral-400 hover:text-[var(--foreground)] transition-all cursor-pointer group"
          title="Exit Focus Mode (Esc or F11)"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-medium text-[var(--foreground)]">Focus Mode</span>
          <kbd className="font-mono text-[10px] bg-[var(--background)] px-1.5 py-0.5 rounded border border-[var(--border)] text-neutral-400 group-hover:text-[var(--foreground)]">
            Esc
          </kbd>
        </button>
      )}

      {/* Modals & Overlays */}
      <VaultDropzone isOpen={isImportModalOpen} onClose={() => setImportModalOpen(false)} />
      <NewNoteModal isOpen={isNewNoteModalOpen} onClose={() => setNewNoteModalOpen(false)} />
      <ImportProgressModal />
      <QuickSearchModal />
      <DocumentQuickSwitcherModal />
      <TemplateSelectorModal />
      <EmojiDrawer />
      <DeleteConfirmModal />
      <ExportPwaModal />
      <VaultFindReplaceModal />

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
