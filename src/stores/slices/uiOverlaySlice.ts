export interface UiOverlaySlice {
  toastMessage: string | null;
  showToast: (msg: string) => void;

  isEmojiDrawerOpen: boolean;
  setEmojiDrawerOpen: (open: boolean) => void;
  toggleEmojiDrawer: () => void;

  isQuickSwitcherOpen: boolean;
  setQuickSwitcherOpen: (open: boolean) => void;

  isFocusMode: boolean;
  focusMode: boolean;
  setFocusMode: (open: boolean) => void;
  toggleFocusMode: () => void;

  isTypewriterScrolling: boolean;
  typewriterMode: boolean;
  setTypewriterScrolling: (val: boolean) => void;
  toggleTypewriterScrolling: () => void;
  toggleTypewriterMode: () => void;

  isOutlineOpen: boolean;
  outlineHudOpen: boolean;
  setIsOutlineOpen: (open: boolean) => void;
  setOutlineHudOpen: (open: boolean) => void;
  toggleOutline: () => void;
  toggleOutlineHud: () => void;

  showMinimap: boolean;
  setShowMinimap: (val: boolean) => void;
  toggleMinimap: () => void;

  isTemplateModalOpen: boolean;
  setTemplateModalOpen: (open: boolean) => void;

  isExportModalOpen: boolean;
  exportModalTarget: { folderPath?: string; targetNotePath?: string } | null;
  openExportModal: (target?: { folderPath?: string; targetNotePath?: string }) => void;
  closeExportModal: () => void;

  activeEditor: any | null;
  setActiveEditor: (editor: any | null) => void;

  isCreateWorkspaceModalOpen: boolean;
  setCreateWorkspaceModalOpen: (open: boolean) => void;

  isNewNoteModalOpen: boolean;
  newNoteParentPath: string | null;
  setNewNoteModalOpen: (open: boolean, parentPath?: string | null) => void;
}

export const createUiOverlaySlice = (set: any, get: any): UiOverlaySlice => ({
  toastMessage: null,
  showToast: (msg: string) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 2400);
  },

  isEmojiDrawerOpen: false,
  setEmojiDrawerOpen: (open) => set({ isEmojiDrawerOpen: open }),
  toggleEmojiDrawer: () => set((state: UiOverlaySlice) => ({ isEmojiDrawerOpen: !state.isEmojiDrawerOpen })),

  isQuickSwitcherOpen: false,
  setQuickSwitcherOpen: (open) => set({ isQuickSwitcherOpen: open }),

  isFocusMode: false,
  focusMode: false,
  setFocusMode: (open) => set({ isFocusMode: open, focusMode: open }),
  toggleFocusMode: () => set((state: UiOverlaySlice) => ({ isFocusMode: !state.isFocusMode, focusMode: !state.isFocusMode })),

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
  toggleTypewriterScrolling: () => get().setTypewriterScrolling(!get().isTypewriterScrolling),
  toggleTypewriterMode: () => get().setTypewriterScrolling(!get().isTypewriterScrolling),

  isOutlineOpen: false,
  outlineHudOpen: false,
  setIsOutlineOpen: (open) => set({ isOutlineOpen: open, outlineHudOpen: open }),
  setOutlineHudOpen: (open) => set({ isOutlineOpen: open, outlineHudOpen: open }),
  toggleOutline: () => set((state: UiOverlaySlice) => ({ isOutlineOpen: !state.isOutlineOpen, outlineHudOpen: !state.isOutlineOpen })),
  toggleOutlineHud: () => set((state: UiOverlaySlice) => ({ isOutlineOpen: !state.isOutlineOpen, outlineHudOpen: !state.isOutlineOpen })),

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
  toggleMinimap: () => get().setShowMinimap(!get().showMinimap),

  isTemplateModalOpen: false,
  setTemplateModalOpen: (open) => set({ isTemplateModalOpen: open }),

  isExportModalOpen: false,
  exportModalTarget: null,
  openExportModal: (target) => set({ isExportModalOpen: true, exportModalTarget: target || null }),
  closeExportModal: () => set({ isExportModalOpen: false, exportModalTarget: null }),

  activeEditor: null,
  setActiveEditor: (editor) => set({ activeEditor: editor }),

  isCreateWorkspaceModalOpen: false,
  setCreateWorkspaceModalOpen: (open) => set({ isCreateWorkspaceModalOpen: open }),

  isNewNoteModalOpen: false,
  newNoteParentPath: null,
  setNewNoteModalOpen: (open, parentPath = null) =>
    set({
      isNewNoteModalOpen: open,
      newNoteParentPath: open ? (parentPath ?? null) : null,
    }),
});
