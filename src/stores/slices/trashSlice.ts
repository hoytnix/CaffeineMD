import {
  deleteVaultFile,
  moveToTrash as dbMoveToTrash,
  restoreFromTrash as dbRestoreFromTrash,
  emptyTrash as dbEmptyTrash,
  purgeExpiredTrash as dbPurgeExpiredTrash,
  softDeleteFolder,
} from '../../lib/storage/db';
import { NativeFileSystemAdapter } from '../../lib/storage/fileSystem';
import { triggerBackgroundAutoSync } from '../../lib/sync/syncAutoTrigger';

export interface TrashSlice {
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
  deleteNote: (path: string) => Promise<boolean>;
}

export const createTrashSlice = (set: any, get: any): TrashSlice => ({
  isDeleteModalOpen: false,
  deleteModalTarget: null,
  trashRetentionDays: typeof window !== 'undefined' ? parseInt(localStorage.getItem('kite-trash-retention-days') || '30', 10) : 30,

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
        const newTabs = state.openTabs.filter((t: any) => t.path !== cleanPath && !t.path.startsWith(prefix));
        let nextActive = state.activeFilePath;
        if (state.activeFilePath && (state.activeFilePath === cleanPath || state.activeFilePath.startsWith(prefix))) {
          nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null;
        }

        set({
          openTabs: newTabs,
          activeFilePath: nextActive,
        });

        state.showToast('Folder moved to Trash');
        triggerBackgroundAutoSync();
        return true;
      }

      const ok = await dbMoveToTrash(path);
      if (!ok) {
        const folderDeleted = await softDeleteFolder(path, get().activeWorkspaceId);
        if (folderDeleted.length > 0) {
          get().removeCustomFolder(path);
          const state = get();
          const prefix = `${path}/`;
          const newTabs = state.openTabs.filter((t: any) => t.path !== path && !t.path.startsWith(prefix));
          let nextActive = state.activeFilePath;
          if (state.activeFilePath && (state.activeFilePath === path || state.activeFilePath.startsWith(prefix))) {
            nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null;
          }
          set({
            openTabs: newTabs,
            activeFilePath: nextActive,
          });
          state.showToast('Folder moved to Trash');
          triggerBackgroundAutoSync();
          return true;
        }

        get().showToast('Failed to move note to Trash');
        return false;
      }

      const state = get();
      const newTabs = state.openTabs.filter((t: any) => t.path !== path);
      let nextActive = state.activeFilePath;
      if (state.activeFilePath === path) {
        nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null;
      }

      set({
        openTabs: newTabs,
        activeFilePath: nextActive,
      });

      state.showToast('Note moved to Trash');
      triggerBackgroundAutoSync();
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
      await deleteVaultFile(path);
      await NativeFileSystemAdapter.removeFileFromDisk(path);

      const state = get();
      const newTabs = state.openTabs.filter((t: any) => t.path !== path);
      let nextActive = state.activeFilePath;
      if (state.activeFilePath === path) {
        nextActive = newTabs.length > 0 ? newTabs[newTabs.length - 1].path : null;
      }

      set({
        openTabs: newTabs,
        activeFilePath: nextActive,
      });

      state.showToast('Note permanently deleted');
      triggerBackgroundAutoSync();
      return true;
    } catch (err) {
      console.error('Failed to delete note:', err);
      get().showToast('Failed to delete note');
      return false;
    }
  },
});
