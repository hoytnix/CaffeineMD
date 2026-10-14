import { create } from 'zustand';
import { ImportProgress } from '../lib/storage/importPipeline';
import {
  ThemeDefinition,
  THEME_PRESETS,
  DEFAULT_CUSTOM_THEME,
  applyThemeToDocument,
} from '../lib/themes/themeDefinitions';
import {
  VaultFile,
  deleteVaultFile,
  moveToTrash as dbMoveToTrash,
  restoreFromTrash as dbRestoreFromTrash,
  emptyTrash as dbEmptyTrash,
  purgeExpiredTrash as dbPurgeExpiredTrash,
  softDeleteFolder,
} from '../lib/storage/db';
import { NativeFileSystemAdapter } from '../lib/storage/fileSystem';

export interface TabItem {
  path: string;
  title: string;
}

export type ActiveWorkspaceView = 'editor' | 'graph' | 'table' | 'board' | 'list' | 'tags' | 'settings';
export type WorkspaceTabId = ActiveWorkspaceView | 'kanban';
export type ToolboxPosition = 'left' | 'right' | 'bottom' | 'top';
export type EditorModeType = 'richtext' | 'plaintext' | 'diff';
export type EditorFontFamily = 'sans' | 'mono' | 'serif';

export const AUTOSAVE_INTERVAL_PRESETS = [
  { value: 0, label: 'Manual only (Off)' },
  { value: 30000, label: 'Every 30 seconds' },
  { value: 60000, label: 'Every 1 minute' },
  { value: 120000, label: 'Every 2 minutes' },
  { value: 300000, label: 'Every 5 minutes (Default)' },
  { value: 600000, label: 'Every 10 minutes' },
] as const;

export const DEFAULT_AUTOSAVE_INTERVAL = 300000;

export interface WorkspaceState {
  vaultName: string;
  activeWorkspaceId: string;
  mountedMode: 'indexeddb' | 'filesystem';
  mountedFolderName: string | null;
  activeFilePath: string | null;
  activeNotePath: string | null;
  activeView: ActiveWorkspaceView;
  activeTab: WorkspaceTabId;
  editorMode: EditorModeType;
  setEditorMode: (mode: EditorModeType) => void;
  openTabs: TabItem[];
  isImportModalOpen: boolean;
  importProgress: ImportProgress | null;
  isSearchOpen: boolean;
  searchQuery: string;
  selectedTagFilter: string | null;
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  databaseViewMode: 'table' | 'board' | 'list';

  // Global Toast
  toastMessage: string | null;
  showToast: (msg: string) => void;

  // Emoji Drawer
  isEmojiDrawerOpen: boolean;
  setEmojiDrawerOpen: (open: boolean) => void;
  toggleEmojiDrawer: () => void;

  // Document Quick Switcher (Cmd+P)
  isQuickSwitcherOpen: boolean;
  setQuickSwitcherOpen: (open: boolean) => void;

  // Multi-Pane Split View
  splitPaneMode: 'none' | 'vertical' | 'horizontal';
  splitFilePath: string | null;
  setSplitPaneMode: (mode: 'none' | 'vertical' | 'horizontal') => void;
  toggleSplitPane: () => void;
  setSplitFilePath: (path: string | null) => void;

  // Focus Mode & Typewriter Scrolling
  isFocusMode: boolean;
  focusMode: boolean;
  setFocusMode: (open: boolean) => void;
  toggleFocusMode: () => void;
  isTypewriterScrolling: boolean;
  typewriterMode: boolean;
  setTypewriterScrolling: (val: boolean) => void;
  toggleTypewriterScrolling: () => void;
  toggleTypewriterMode: () => void;

  // Editor Outline HUD
  isOutlineOpen: boolean;
  outlineHudOpen: boolean;
  setIsOutlineOpen: (open: boolean) => void;
  setOutlineHudOpen: (open: boolean) => void;
  toggleOutline: () => void;
  toggleOutlineHud: () => void;

  // Editor Minimap
  showMinimap: boolean;
  setShowMinimap: (val: boolean) => void;
  toggleMinimap: () => void;

  // Template / Scratchpad Modal (Cmd+Shift+N)
  isTemplateModalOpen: boolean;
  setTemplateModalOpen: (open: boolean) => void;

  // PWA / Standalone HTML Export Modal
  isExportModalOpen: boolean;
  exportModalTarget: { folderPath?: string; targetNotePath?: string } | null;
  openExportModal: (target?: { folderPath?: string; targetNotePath?: string }) => void;
  closeExportModal: () => void;

  // Active Editor instance reference
  activeEditor: any | null;
  setActiveEditor: (editor: any | null) => void;

  // Theme Management
  themeId: string;
  theme: string;
  customTheme: ThemeDefinition;
  customThemeColors: Partial<ThemeDefinition>;
  setTheme: (themeId: string) => void;
  updateCustomTheme: (tokens: Partial<ThemeDefinition>) => void;
  editorFontFamily: EditorFontFamily;
  setEditorFontFamily: (font: EditorFontFamily) => void;

  // Editor Toolbox Placement
  toolboxPosition: ToolboxPosition;
  setToolboxPosition: (position: ToolboxPosition) => void;

  // Autosave Frequency
  autosaveInterval: number;
  setAutosaveInterval: (interval: number) => void;

  // Workspace Creation Modal
  isCreateWorkspaceModalOpen: boolean;
  setCreateWorkspaceModalOpen: (open: boolean) => void;

  // New Note Creator Modal
  isNewNoteModalOpen: boolean;
  setNewNoteModalOpen: (open: boolean) => void;

  // Trash & Deletion Modal
  isDeleteModalOpen: boolean;
  deleteModalTarget: { path: string; title: string } | null;
  trashRetentionDays: number;
  promptDeleteNote: (path: string, title?: string) => void;
  closeDeleteModal: () => void;
  confirmDeleteNote: () => Promise<void>;
  moveToTrash: (path: string) => Promise<boolean>;
  restoreNote: (path: string) => Promise<boolean>;
  emptyTrashAll: () => Promise<void>;
  setTrashRetentionDays: (days: number) => void;
  purgeExpiredTrashNotes: () => Promise<number>;

  // Actions
  setActiveFilePath: (path: string | null) => void;
  setActiveNotePath: (path: string | null) => void;
  setActiveNoteId: (id: string) => void;
  openFileTab: (path: string, title?: string) => void;
  closeFileTab: (path: string) => void;
  closeOtherTabs: (path: string) => void;
  closeTabsToTheRight: (path: string) => void;
  closeAllTabs: () => void;
  pinnedTabs: string[];
  togglePinTab: (path: string) => void;
  duplicateToSplitView: (path: string, direction?: 'vertical' | 'horizontal') => void;
  renameFileTab: (oldPath: string, newPath: string, newTitle?: string) => void;
  deleteNote: (path: string) => Promise<boolean>;
  setActiveView: (view: ActiveWorkspaceView) => void;
  setActiveTab: (tab: WorkspaceTabId) => void;
  setImportModalOpen: (open: boolean) => void;
  setImportProgress: (progress: ImportProgress | null) => void;
  setIsSearchOpen: (open: boolean) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTagFilter: (tag: string | null) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebar: () => void;
  setRightPanelOpen: (open: boolean) => void;
  toggleRightPanel: () => void;
  setMountedMode: (mode: 'indexeddb' | 'filesystem', folderName?: string) => void;
  setActiveWorkspaceId: (id: string, name?: string) => void;
  setDatabaseViewMode: (mode: 'table' | 'board' | 'list') => void;

  // Custom & Expanded Folders
  customFolders: string[];
  expandedFolders: string[];
  addCustomFolder: (folderPath: string) => void;
  removeCustomFolder: (folderPath: string) => void;
  renameCustomFolder: (oldPrefix: string, newPrefix: string) => void;
  closeTab: (path: string) => void;

  // Workspace Notes List
  notes: VaultFile[];
  setNotes: (notes: VaultFile[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  notes: [],
  setNotes: (notes) => set({ notes }),
  vaultName: 'CaffeineMD Vault',
  activeWorkspaceId: 'default-vault',
  mountedMode: 'indexeddb',
  mountedFolderName: null,
  activeFilePath: 'Welcome to CaffeineMD.md',
  activeNotePath: 'Welcome to CaffeineMD.md',
  activeView: 'editor',
  activeTab: 'editor',
  editorMode: 'richtext',
  setEditorMode: (mode) => set({ editorMode: mode }),
  openTabs: [
    { path: 'Welcome to CaffeineMD.md', title: 'Welcome to CaffeineMD' },
    { path: 'Projects/Product Roadmap 2026.md', title: 'Product Roadmap 2026' },
  ],
  isImportModalOpen: false,
  importProgress: null,
  isSearchOpen: false,
  searchQuery: '',
  selectedTagFilter: null,
  sidebarCollapsed: false,
  rightPanelOpen: true,
  databaseViewMode: 'table',

  // Workspace Creation Modal
  isCreateWorkspaceModalOpen: false,
  setCreateWorkspaceModalOpen: (open: boolean) => set({ isCreateWorkspaceModalOpen: open }),

  // New Note Creator Modal
  isNewNoteModalOpen: false,
  setNewNoteModalOpen: (open: boolean) => set({ isNewNoteModalOpen: open }),

  // Trash State & Deletion Modal
  isDeleteModalOpen: false,
  deleteModalTarget: null,
  trashRetentionDays: typeof window !== 'undefined' ? parseInt(localStorage.getItem('kite-trash-retention-days') || '30', 10) : 30,

  // Global Toast
  toastMessage: null,
  showToast: (msg: string) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 2400);
  },

  // Emoji
  isEmojiDrawerOpen: false,
  setEmojiDrawerOpen: (open) => set({ isEmojiDrawerOpen: open }),
  toggleEmojiDrawer: () => set((state) => ({ isEmojiDrawerOpen: !state.isEmojiDrawerOpen })),

  // Document Quick Switcher (Cmd+P)
  isQuickSwitcherOpen: false,
  setQuickSwitcherOpen: (open) => set({ isQuickSwitcherOpen: open }),

  // Multi-Pane Split View
  splitPaneMode: 'none',
  splitFilePath: null,
  setSplitPaneMode: (mode) => set({ splitPaneMode: mode }),
  toggleSplitPane: () => {
    const current = get().splitPaneMode;
    const nextMode = current === 'none' ? 'vertical' : 'none';
    const active = get().activeFilePath;
    const tabs = get().openTabs;
    const alternate = tabs.find((t) => t.path !== active)?.path || active;
    set({
      splitPaneMode: nextMode,
      splitFilePath: nextMode !== 'none' ? (get().splitFilePath || alternate) : null,
    });
  },
  setSplitFilePath: (path) => set({ splitFilePath: path }),

  // Focus Mode & Typewriter Scrolling
  isFocusMode: false,
  focusMode: false,
  setFocusMode: (open) => set({ isFocusMode: open, focusMode: open }),
  toggleFocusMode: () => set((state) => ({ isFocusMode: !state.isFocusMode, focusMode: !state.isFocusMode })),
  isTypewriterScrolling:
    typeof window !== 'undefined'
      ? localStorage.getItem('caffeinemd-typewriter-mode') === 'true'
      : false,
  typewriterMode:
    typeof window !== 'undefined'
      ? localStorage.getItem('caffeinemd-typewriter-mode') === 'true'
      : false,
  setTypewriterScrolling: (val) => {
    set({ isTypewriterScrolling: val, typewriterMode: val });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('caffeinemd-typewriter-mode', String(val));
      } catch {}
    }
  },
  toggleTypewriterScrolling: () => {
    const nextVal = !get().isTypewriterScrolling;
    get().setTypewriterScrolling(nextVal);
  },
  toggleTypewriterMode: () => {
    const nextVal = !get().isTypewriterScrolling;
    get().setTypewriterScrolling(nextVal);
  },

  // Editor Outline HUD
  isOutlineOpen: false,
  outlineHudOpen: false,
  setIsOutlineOpen: (open) => set({ isOutlineOpen: open, outlineHudOpen: open }),
  setOutlineHudOpen: (open) => set({ isOutlineOpen: open, outlineHudOpen: open }),
  toggleOutline: () => set((state) => ({ isOutlineOpen: !state.isOutlineOpen, outlineHudOpen: !state.isOutlineOpen })),
  toggleOutlineHud: () => set((state) => ({ isOutlineOpen: !state.isOutlineOpen, outlineHudOpen: !state.isOutlineOpen })),

  // Editor Minimap
  showMinimap:
    typeof window !== 'undefined'
      ? localStorage.getItem('caffeinemd-show-minimap') !== 'false'
      : true,
  setShowMinimap: (val) => {
    set({ showMinimap: val });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('caffeinemd-show-minimap', String(val));
      } catch {}
    }
  },
  toggleMinimap: () => {
    const nextVal = !get().showMinimap;
    get().setShowMinimap(nextVal);
  },

  // Template / Scratchpad Modal (Cmd+Shift+N)
  isTemplateModalOpen: false,
  setTemplateModalOpen: (open) => set({ isTemplateModalOpen: open }),

  // PWA / Standalone HTML Export Modal
  isExportModalOpen: false,
  exportModalTarget: null,
  openExportModal: (target) => set({ isExportModalOpen: true, exportModalTarget: target || null }),
  closeExportModal: () => set({ isExportModalOpen: false, exportModalTarget: null }),

  // Active Editor
  activeEditor: null,
  setActiveEditor: (editor) => set({ activeEditor: editor }),

  // Theme
  themeId: 'dark',
  theme: 'dark',
  customTheme: DEFAULT_CUSTOM_THEME,
  customThemeColors: DEFAULT_CUSTOM_THEME,
  setTheme: (themeId) => {
    set({ themeId, theme: themeId });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kite-theme-id', themeId);
      } catch {}
    }
    const currentCustom = get().customTheme;
    const target =
      themeId === 'custom'
        ? currentCustom
        : THEME_PRESETS.find((t) => t.id === themeId) || THEME_PRESETS[0];
    applyThemeToDocument(target);
  },
  updateCustomTheme: (tokens) => {
    const updated: ThemeDefinition = {
      ...get().customTheme,
      ...tokens,
      id: 'custom',
    };
    set({ customTheme: updated, customThemeColors: updated, themeId: 'custom', theme: 'custom' });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kite-custom-theme', JSON.stringify(updated));
        localStorage.setItem('kite-theme-id', 'custom');
      } catch {}
    }
    applyThemeToDocument(updated);
  },

  // Editor Font Family Selection
  editorFontFamily:
    typeof window !== 'undefined' &&
    ['sans', 'mono', 'serif'].includes(localStorage.getItem('caffeinemd-editor-font-family') || '')
      ? (localStorage.getItem('caffeinemd-editor-font-family') as EditorFontFamily)
      : 'sans',
  setEditorFontFamily: (font: EditorFontFamily) => {
    set({ editorFontFamily: font });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('caffeinemd-editor-font-family', font);
      } catch {}
    }
  },

  // Editor Toolbox Placement
  toolboxPosition:
    typeof window !== 'undefined' &&
    ['left', 'right', 'bottom', 'top'].includes(localStorage.getItem('kite-toolbox-position') || '')
      ? (localStorage.getItem('kite-toolbox-position') as ToolboxPosition)
      : 'bottom',
  setToolboxPosition: (position: ToolboxPosition) => {
    set({ toolboxPosition: position });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kite-toolbox-position', position);
      } catch {}
    }
  },

  // Autosave Frequency (ms)
  autosaveInterval:
    typeof window !== 'undefined'
      ? (() => {
          const stored = localStorage.getItem('caffeinemd-autosave-interval') || localStorage.getItem('kite-autosave-interval');
          const parsed = stored ? parseInt(stored, 10) : NaN;
          return !isNaN(parsed) ? parsed : DEFAULT_AUTOSAVE_INTERVAL;
        })()
      : DEFAULT_AUTOSAVE_INTERVAL,
  setAutosaveInterval: (interval: number) => {
    set({ autosaveInterval: interval });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('caffeinemd-autosave-interval', String(interval));
      } catch {}
    }
  },

  setActiveFilePath: (path) => {
    set({ activeFilePath: path, activeNotePath: path });
    if (path) {
      const state = get();
      if (!state.openTabs.some((t) => t.path === path)) {
        const title = path.split('/').pop()?.replace(/\.[^/.]+$/, '') || path;
        set({ openTabs: [...state.openTabs, { path, title }] });
      }
    }
  },

  setActiveNotePath: (path) => {
    get().setActiveFilePath(path);
  },

  setActiveNoteId: (id) => {
    get().openFileTab(id);
  },

  openFileTab: (path, title) => {
    const state = get();
    const resolvedTitle = title || path.split('/').pop()?.replace(/\.[^/.]+$/, '') || path;
    const exists = state.openTabs.some((t) => t.path === path);
    const newTabs = exists ? state.openTabs : [...state.openTabs, { path, title: resolvedTitle }];

    set({
      openTabs: newTabs,
      activeFilePath: path,
      activeNotePath: path,
      activeView: 'editor',
      activeTab: 'editor',
    });
  },

  closeFileTab: (path) => {
    const state = get();
    const newTabs = state.openTabs.filter((t) => t.path !== path);
    let nextActive = state.activeFilePath;

    if (state.activeFilePath === path) {
      nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null;
    }

    set({
      openTabs: newTabs,
      activeFilePath: nextActive,
      activeNotePath: nextActive,
    });
  },

  pinnedTabs: [],
  togglePinTab: (path) => {
    const { pinnedTabs } = get();
    const isPinned = pinnedTabs.includes(path);
    set({
      pinnedTabs: isPinned ? pinnedTabs.filter((p) => p !== path) : [...pinnedTabs, path],
    });
  },

  closeOtherTabs: (path) => {
    const { openTabs, pinnedTabs } = get();
    const targetTab = openTabs.find((t) => t.path === path);
    if (!targetTab) return;
    const remaining = openTabs.filter((t) => t.path === path || pinnedTabs.includes(t.path));
    set({
      openTabs: remaining,
      activeFilePath: path,
      activeNotePath: path,
    });
  },

  closeTabsToTheRight: (path) => {
    const { openTabs, pinnedTabs } = get();
    const idx = openTabs.findIndex((t) => t.path === path);
    if (idx === -1) return;
    const remaining = openTabs.filter((t, i) => i <= idx || pinnedTabs.includes(t.path));
    set({
      openTabs: remaining,
      activeFilePath: path,
      activeNotePath: path,
    });
  },

  closeAllTabs: () => {
    const { openTabs, pinnedTabs } = get();
    const remaining = openTabs.filter((t) => pinnedTabs.includes(t.path));
    set({
      openTabs: remaining,
      activeFilePath: remaining.length > 0 ? remaining[0].path : null,
      activeNotePath: remaining.length > 0 ? remaining[0].path : null,
    });
  },

  duplicateToSplitView: (path, direction = 'vertical') => {
    set({
      splitPaneMode: direction,
      splitFilePath: path,
    });
  },

  renameFileTab: (oldPath, newPath, newTitle) => {
    const state = get();
    const resolvedTitle = newTitle || newPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || newPath;
    const newTabs = state.openTabs.map((t) =>
      t.path === oldPath ? { ...t, path: newPath, title: resolvedTitle } : t
    );
    const updateActive = state.activeFilePath === oldPath;

    set({
      openTabs: newTabs,
      ...(updateActive
        ? {
            activeFilePath: newPath,
            activeNotePath: newPath,
          }
        : {}),
    });
  },

  promptDeleteNote: (path: string, title?: string) => {
    set({
      isDeleteModalOpen: true,
      deleteModalTarget: { path, title: title || path.replace(/\.[^/.]+$/, '').split('/').pop() || path },
    });
  },

  closeDeleteModal: () => {
    set({ isDeleteModalOpen: false, deleteModalTarget: null });
  },

  confirmDeleteNote: async () => {
    const target = get().deleteModalTarget;
    if (!target) return;
    set({ isDeleteModalOpen: false, deleteModalTarget: null });
    await get().moveToTrash(target.path);
  },

  moveToTrash: async (path: string) => {
    try {
      const isFolder = path.startsWith('folder:');
      const cleanPath = isFolder ? path.slice('folder:'.length) : path;

      if (isFolder) {
        await softDeleteFolder(cleanPath, get().activeWorkspaceId);
        get().removeCustomFolder(cleanPath);

        const state = get();
        const prefix = `${cleanPath}/`;
        const newTabs = state.openTabs.filter((t) => t.path !== cleanPath && !t.path.startsWith(prefix));
        let nextActive = state.activeFilePath;
        if (state.activeFilePath && (state.activeFilePath === cleanPath || state.activeFilePath.startsWith(prefix))) {
          nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null;
        }

        set({
          openTabs: newTabs,
          activeFilePath: nextActive,
        });

        state.showToast('Folder moved to Trash');
        return true;
      }

      const ok = await dbMoveToTrash(path);
      if (!ok) {
        // Fallback: check if path corresponds to a folder directory
        const folderDeleted = await softDeleteFolder(path, get().activeWorkspaceId);
        if (folderDeleted.length > 0) {
          get().removeCustomFolder(path);
          const state = get();
          const prefix = `${path}/`;
          const newTabs = state.openTabs.filter((t) => t.path !== path && !t.path.startsWith(prefix));
          let nextActive = state.activeFilePath;
          if (state.activeFilePath && (state.activeFilePath === path || state.activeFilePath.startsWith(prefix))) {
            nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null;
          }
          set({
            openTabs: newTabs,
            activeFilePath: nextActive,
          });
          state.showToast('Folder moved to Trash');
          return true;
        }

        get().showToast('Failed to move note to Trash');
        return false;
      }

      // Close tab if opened
      const state = get();
      const newTabs = state.openTabs.filter((t) => t.path !== path);
      let nextActive = state.activeFilePath;
      if (state.activeFilePath === path) {
        nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null;
      }

      set({
        openTabs: newTabs,
        activeFilePath: nextActive,
      });

      state.showToast('Note moved to Trash');
      return true;
    } catch (err) {
      console.error('Failed to move note to trash:', err);
      get().showToast('Error moving note to Trash');
      return false;
    }
  },

  restoreNote: async (path: string) => {
    try {
      const ok = await dbRestoreFromTrash(path);
      if (ok) {
        get().showToast('Note restored from Trash');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Failed to restore note:', err);
      get().showToast('Failed to restore note');
      return false;
    }
  },

  emptyTrashAll: async () => {
    try {
      const count = await dbEmptyTrash();
      get().showToast(`Emptied ${count} note${count === 1 ? '' : 's'} from Trash`);
    } catch (err) {
      console.error('Failed to empty trash:', err);
      get().showToast('Failed to empty Trash');
    }
  },

  setTrashRetentionDays: (days: number) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('kite-trash-retention-days', days.toString());
    }
    set({ trashRetentionDays: days });
  },

  purgeExpiredTrashNotes: async () => {
    const days = get().trashRetentionDays;
    const purged = await dbPurgeExpiredTrash(days);
    if (purged > 0) {
      get().showToast(`Purged ${purged} expired note${purged === 1 ? '' : 's'} from Trash`);
    }
    return purged;
  },

  deleteNote: async (path: string) => {
    try {
      // 1. Remove from Dexie IndexedDB and prune backlinks and tags
      await deleteVaultFile(path);

      // 2. Remove from live filesystem handle if mounted
      await NativeFileSystemAdapter.removeFileFromDisk(path);

      // 3. Close tab and evict from tree
      const state = get();
      const newTabs = state.openTabs.filter((t) => t.path !== path);
      let nextActive = state.activeFilePath;
      if (state.activeFilePath === path) {
        nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null;
      }

      set({
        openTabs: newTabs,
        activeFilePath: nextActive,
      });

      // 4. Affirmative toast confirmation
      state.showToast('Note permanently deleted');
      return true;
    } catch (err) {
      console.error('Failed to delete note:', err);
      get().showToast('Failed to delete note');
      return false;
    }
  },

  setActiveView: (view) => {
    const tab: WorkspaceTabId = view === 'board' ? 'kanban' : view;
    set({ activeView: view, activeTab: tab });
    if (view === 'table' || view === 'board' || view === 'list') {
      set({ databaseViewMode: view });
    }
  },

  setActiveTab: (tab) => {
    if (tab === 'kanban' || tab === 'board') {
      set({ activeView: 'board', activeTab: 'kanban', databaseViewMode: 'board' });
    } else if (tab === 'table' || tab === 'list') {
      set({ activeView: tab, activeTab: tab, databaseViewMode: tab });
    } else {
      set({ activeView: tab as ActiveWorkspaceView, activeTab: tab });
    }
  },

  setImportModalOpen: (open) => set({ isImportModalOpen: open }),
  setImportProgress: (progress) => set({ importProgress: progress }),
  setIsSearchOpen: (open) => set({ isSearchOpen: open }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setSelectedTagFilter: (tag) => set({ selectedTagFilter: tag }),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setRightPanelOpen: (open) => set({ rightPanelOpen: open }),
  toggleRightPanel: () => set((state) => ({ rightPanelOpen: !state.rightPanelOpen })),
  setMountedMode: (mode, folderName) =>
    set({
      mountedMode: mode,
      mountedFolderName: folderName || null,
      vaultName: folderName ? folderName : 'CaffeineMD Vault',
    }),
  setActiveWorkspaceId: (id, name) => {
    const currentId = get().activeWorkspaceId;
    if (currentId === id) {
      if (name) set({ vaultName: name });
      return;
    }
    set({
      activeWorkspaceId: id,
      vaultName: name || (id === 'default-vault' || id === 'local-vault' ? 'CaffeineMD Vault' : id),
      activeFilePath: null,
      activeNotePath: null,
      openTabs: [],
    });
    if (!name) {
      import('../lib/storage/db').then(({ db }) => {
        db.workspaces.get(id).then((ws) => {
          if (ws) {
            set({
              vaultName: ws.name,
              mountedMode: ws.mode,
              mountedFolderName: ws.mode === 'filesystem' ? ws.name : null,
            });
          }
        }).catch(() => {});
      }).catch(() => {});
    }
  },
  setDatabaseViewMode: (mode) => set({ databaseViewMode: mode }),

  // Custom & Expanded Folders
  customFolders: [],
  expandedFolders: [],
  addCustomFolder: (folderPath) => {
    const clean = folderPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
    if (!clean) return;
    set((state) => {
      if (state.customFolders.includes(clean)) return state;
      return { customFolders: [...state.customFolders, clean] };
    });
  },
  removeCustomFolder: (folderPath) => {
    const clean = folderPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
    set((state) => ({
      customFolders: state.customFolders.filter((f) => f !== clean && !f.startsWith(clean + '/')),
      expandedFolders: state.expandedFolders.filter((f) => f !== clean && !f.startsWith(clean + '/')),
    }));
  },
  renameCustomFolder: (oldPrefix, newPrefix) => {
    const cleanOld = oldPrefix.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
    const cleanNew = newPrefix.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
    set((state) => ({
      customFolders: state.customFolders.map((f) => {
        if (f === cleanOld) return cleanNew;
        if (f.startsWith(cleanOld + '/')) return `${cleanNew}${f.slice(cleanOld.length)}`;
        return f;
      }),
      expandedFolders: state.expandedFolders.map((f) => {
        if (f === cleanOld) return cleanNew;
        if (f.startsWith(cleanOld + '/')) return `${cleanNew}${f.slice(cleanOld.length)}`;
        return f;
      }),
    }));
  },
  closeTab: (path) => {
    get().closeFileTab(path);
  },
}));
