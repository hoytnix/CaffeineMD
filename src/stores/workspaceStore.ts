import { create } from 'zustand';
import { ImportProgress } from '../lib/storage/importPipeline';
import {
  ThemeDefinition,
  THEME_PRESETS,
  DEFAULT_CUSTOM_THEME,
  applyThemeToDocument,
} from '../lib/themes/themeDefinitions';
import {
  deleteVaultFile,
  moveToTrash as dbMoveToTrash,
  restoreFromTrash as dbRestoreFromTrash,
  emptyTrash as dbEmptyTrash,
  purgeExpiredTrash as dbPurgeExpiredTrash,
} from '../lib/storage/db';
import { NativeFileSystemAdapter } from '../lib/storage/fileSystem';

export interface TabItem {
  path: string;
  title: string;
}

export type ActiveWorkspaceView = 'editor' | 'graph' | 'table' | 'board' | 'list' | 'tags';

export interface WorkspaceState {
  vaultName: string;
  activeWorkspaceId: string;
  mountedMode: 'indexeddb' | 'filesystem';
  mountedFolderName: string | null;
  activeFilePath: string | null;
  activeView: ActiveWorkspaceView;
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

  // Active Editor instance reference
  activeEditor: any | null;
  setActiveEditor: (editor: any | null) => void;

  // Theme Management
  themeId: string;
  customTheme: ThemeDefinition;
  setTheme: (themeId: string) => void;
  updateCustomTheme: (tokens: Partial<ThemeDefinition>) => void;

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
  openFileTab: (path: string, title?: string) => void;
  closeFileTab: (path: string) => void;
  deleteNote: (path: string) => Promise<boolean>;
  setActiveView: (view: ActiveWorkspaceView) => void;
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
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  vaultName: 'Local Vault',
  activeWorkspaceId: 'default-vault',
  mountedMode: 'indexeddb',
  mountedFolderName: null,
  activeFilePath: 'Welcome to Kite.md',
  activeView: 'editor',
  openTabs: [
    { path: 'Welcome to Kite.md', title: 'Welcome to Kite' },
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

  // Active Editor
  activeEditor: null,
  setActiveEditor: (editor) => set({ activeEditor: editor }),

  // Theme
  themeId: 'dark',
  customTheme: DEFAULT_CUSTOM_THEME,
  setTheme: (themeId) => {
    set({ themeId });
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
    set({ customTheme: updated, themeId: 'custom' });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('kite-custom-theme', JSON.stringify(updated));
        localStorage.setItem('kite-theme-id', 'custom');
      } catch {}
    }
    applyThemeToDocument(updated);
  },

  setActiveFilePath: (path) => {
    set({ activeFilePath: path });
    if (path) {
      const state = get();
      if (!state.openTabs.some((t) => t.path === path)) {
        const title = path.split('/').pop()?.replace(/\.[^/.]+$/, '') || path;
        set({ openTabs: [...state.openTabs, { path, title }] });
      }
    }
  },

  openFileTab: (path, title) => {
    const state = get();
    const resolvedTitle = title || path.split('/').pop()?.replace(/\.[^/.]+$/, '') || path;
    const exists = state.openTabs.some((t) => t.path === path);
    const newTabs = exists ? state.openTabs : [...state.openTabs, { path, title: resolvedTitle }];

    set({
      openTabs: newTabs,
      activeFilePath: path,
      activeView: 'editor',
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
      const ok = await dbMoveToTrash(path);
      if (!ok) {
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
    set({ activeView: view });
    if (view === 'table' || view === 'board' || view === 'list') {
      set({ databaseViewMode: view });
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
      vaultName: folderName ? folderName : 'Local Vault',
    }),
  setActiveWorkspaceId: (id, name) =>
    set({
      activeWorkspaceId: id,
      vaultName: name || 'Workspace',
      activeFilePath: null,
      openTabs: [],
    }),
  setDatabaseViewMode: (mode) => set({ databaseViewMode: mode }),
}));
