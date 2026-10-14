import { create } from 'zustand';
import { ImportProgress } from '../lib/storage/importPipeline';
import { VaultFile } from '../lib/storage/db';
import {
  ThemeSlice,
  createThemeStorageSlice,
  ToolboxPosition,
  EditorFontFamily,
  DEFAULT_AUTOSAVE_INTERVAL,
} from './slices/themeStorageSlice';
import { TrashSlice, createTrashSlice } from './slices/trashSlice';
import { TabItem, TabsSlice, createTabsSlice } from './slices/tabsSlice';
import { UiOverlaySlice, createUiOverlaySlice } from './slices/uiOverlaySlice';

export type { TabItem, ToolboxPosition, EditorFontFamily };
export { DEFAULT_AUTOSAVE_INTERVAL };

export type ActiveWorkspaceView = 'editor' | 'graph' | 'table' | 'board' | 'list' | 'tags' | 'settings';
export type WorkspaceTabId = ActiveWorkspaceView | 'kanban';
export type EditorModeType = 'richtext' | 'plaintext' | 'diff';

export const AUTOSAVE_INTERVAL_PRESETS = [
  { value: 0, label: 'Manual only (Off)' },
  { value: 30000, label: 'Every 30 seconds' },
  { value: 60000, label: 'Every 1 minute' },
  { value: 120000, label: 'Every 2 minutes' },
  { value: 300000, label: 'Every 5 minutes (Default)' },
  { value: 600000, label: 'Every 10 minutes' },
] as const;

export interface WorkspaceState extends ThemeSlice, TrashSlice, TabsSlice, UiOverlaySlice {
  vaultName: string;
  activeWorkspaceId: string;
  mountedMode: 'indexeddb' | 'filesystem';
  mountedFolderName: string | null;
  activeView: ActiveWorkspaceView;
  activeTab: WorkspaceTabId;
  editorMode: EditorModeType;
  setEditorMode: (mode: EditorModeType) => void;
  isImportModalOpen: boolean;
  importProgress: ImportProgress | null;
  isSearchOpen: boolean;
  searchQuery: string;
  selectedTagFilter: string | null;
  sidebarCollapsed: boolean;
  rightPanelOpen: boolean;
  databaseViewMode: 'table' | 'board' | 'list';

  // View & Workspace Navigation
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
  expandFolders: (folderPaths: string[]) => void;
  toggleExpandedFolder: (folderPath: string) => void;
  setExpandedFolders: (folders: string[]) => void;

  // Workspace Notes List
  notes: VaultFile[];
  setNotes: (notes: VaultFile[]) => void;
}

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ...createThemeStorageSlice(set, get),
  ...createTrashSlice(set, get),
  ...createTabsSlice(set, get),
  ...createUiOverlaySlice(set, get),

  notes: [],
  setNotes: (notes) => set({ notes }),
  vaultName: 'CaffeineMD Vault',
  activeWorkspaceId: 'default-vault',
  mountedMode: 'indexeddb',
  mountedFolderName: null,
  activeView: 'editor',
  activeTab: 'editor',
  editorMode: 'richtext',
  setEditorMode: (mode) => set({ editorMode: mode }),
  isImportModalOpen: false,
  importProgress: null,
  isSearchOpen: false,
  searchQuery: '',
  selectedTagFilter: null,
  sidebarCollapsed: false,
  rightPanelOpen: true,
  databaseViewMode: 'table',

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

  customFolders: [],
  expandedFolders: ['Projects', 'Engineering'],
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
  expandFolders: (folderPaths) => {
    set((state) => {
      const setFolders = new Set(state.expandedFolders);
      let changed = false;
      folderPaths.forEach((f) => {
        const clean = f.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
        if (clean && !setFolders.has(clean)) {
          setFolders.add(clean);
          changed = true;
        }
      });
      return changed ? { expandedFolders: Array.from(setFolders) } : state;
    });
  },
  toggleExpandedFolder: (folderPath) => {
    const clean = folderPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
    set((state) => {
      const exists = state.expandedFolders.includes(clean);
      return {
        expandedFolders: exists
          ? state.expandedFolders.filter((f) => f !== clean)
          : [...state.expandedFolders, clean],
      };
    });
  },
  setExpandedFolders: (folders) => set({ expandedFolders: folders }),
}));
