export interface TabItem {
  path: string;
  title: string;
}

export interface TabsSlice {
  openTabs: TabItem[];
  activeFilePath: string | null;
  activeNotePath: string | null;
  pinnedTabs: string[];
  splitPaneMode: 'none' | 'vertical' | 'horizontal';
  splitFilePath: string | null;

  setSplitPaneMode: (mode: 'none' | 'vertical' | 'horizontal') => void;
  toggleSplitPane: () => void;
  setSplitFilePath: (path: string | null) => void;
  duplicateToSplitView: (path: string, direction?: 'vertical' | 'horizontal') => void;

  setActiveFilePath: (path: string | null) => void;
  setActiveNotePath: (path: string | null) => void;
  setActiveNoteId: (id: string) => void;
  openFileTab: (path: string, title?: string) => void;
  closeFileTab: (path: string) => void;
  closeTab: (path: string) => void;
  togglePinTab: (path: string) => void;
  closeOtherTabs: (path: string) => void;
  closeTabsToTheRight: (path: string) => void;
  closeAllTabs: () => void;
  renameFileTab: (oldPath: string, newPath: string, newTitle?: string) => void;
}

export const createTabsSlice = (set: any, get: any): TabsSlice => ({
  openTabs: [
    { path: '/Welcome to CaffeineMD ☕.md', title: 'Welcome to CaffeineMD ☕' },
    { path: 'Project Alpha.md', title: 'Project Alpha' },
  ],
  activeFilePath: '/Welcome to CaffeineMD ☕.md',
  activeNotePath: '/Welcome to CaffeineMD ☕.md',
  pinnedTabs: [],
  splitPaneMode: 'none',
  splitFilePath: null,

  setSplitPaneMode: (mode) => set({ splitPaneMode: mode }),
  toggleSplitPane: () => {
    const current = get().splitPaneMode;
    const nextMode = current === 'none' ? 'vertical' : 'none';
    const active = get().activeFilePath;
    const tabs = get().openTabs;
    const alternate = tabs.find((t: TabItem) => t.path !== active)?.path || active;
    set({
      splitPaneMode: nextMode,
      splitFilePath: nextMode !== 'none' ? (get().splitFilePath || alternate) : null,
    });
  },
  setSplitFilePath: (path) => set({ splitFilePath: path }),
  duplicateToSplitView: (path, direction = 'vertical') => {
    set({ splitPaneMode: direction, splitFilePath: path });
  },

  setActiveFilePath: (path) => {
    set({ activeFilePath: path, activeNotePath: path });
    if (path) {
      const state = get();
      if (!state.openTabs.some((t: TabItem) => t.path === path)) {
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
    const exists = state.openTabs.some((t: TabItem) => t.path === path);
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
    const newTabs = state.openTabs.filter((t: TabItem) => t.path !== path);
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

  closeTab: (path) => {
    get().closeFileTab(path);
  },

  togglePinTab: (path) => {
    const { pinnedTabs } = get();
    const isPinned = pinnedTabs.includes(path);
    set({
      pinnedTabs: isPinned ? pinnedTabs.filter((p: string) => p !== path) : [...pinnedTabs, path],
    });
  },

  closeOtherTabs: (path) => {
    const { openTabs, pinnedTabs } = get();
    const targetTab = openTabs.find((t: TabItem) => t.path === path);
    if (!targetTab) return;
    const remaining = openTabs.filter((t: TabItem) => t.path === path || pinnedTabs.includes(t.path));
    set({
      openTabs: remaining,
      activeFilePath: path,
      activeNotePath: path,
    });
  },

  closeTabsToTheRight: (path) => {
    const { openTabs, pinnedTabs } = get();
    const idx = openTabs.findIndex((t: TabItem) => t.path === path);
    if (idx === -1) return;
    const remaining = openTabs.filter((t: TabItem, i: number) => i <= idx || pinnedTabs.includes(t.path));
    set({
      openTabs: remaining,
      activeFilePath: path,
      activeNotePath: path,
    });
  },

  closeAllTabs: () => {
    const { openTabs, pinnedTabs } = get();
    const remaining = openTabs.filter((t: TabItem) => pinnedTabs.includes(t.path));
    set({
      openTabs: remaining,
      activeFilePath: remaining.length > 0 ? remaining[0].path : null,
      activeNotePath: remaining.length > 0 ? remaining[0].path : null,
    });
  },

  renameFileTab: (oldPath, newPath, newTitle) => {
    const state = get();
    const resolvedTitle = newTitle || newPath.split('/').pop()?.replace(/\.[^/.]+$/, '') || newPath;
    const newTabs = state.openTabs.map((t: TabItem) =>
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
});
