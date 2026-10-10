import { create } from 'zustand';
import { ImportProgress } from '../lib/storage/importPipeline';
import {
  ThemeDefinition,
  THEME_PRESETS,
  DEFAULT_CUSTOM_THEME,
  applyThemeToDocument,
} from '../lib/themes/themeDefinitions';

export interface TabItem {
  path: string;
  title: string;
}

export type ActiveWorkspaceView = 'editor' | 'graph' | 'table' | 'board' | 'list';

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

  // Actions
  setActiveFilePath: (path: string | null) => void;
  openFileTab: (path: string, title?: string) => void;
  closeFileTab: (path: string) => void;
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
