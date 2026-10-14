import { useCallback } from 'react';
import {
  VaultFile,
  renameVaultFile,
  duplicateVaultFile,
  moveVaultFile,
  softDeleteNote,
  softDeleteFolder,
  renameFolder,
  moveFolder,
} from '@/src/lib/storage/db';
import { TreeNode } from '@/src/hooks/useTreeStructure';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { triggerBackgroundAutoSync } from '@/src/lib/sync/syncAutoTrigger';

interface FileTreeActionsProps {
  activeFiles: VaultFile[];
  showToast: (msg: string) => void;
  openFileTab: (path: string, title?: string) => void;
  renameFileTab: (oldPath: string, newPath: string, newTitle?: string) => void;
  setNotes?: (notes: VaultFile[]) => void;
}

export function useFileTreeActions({
  activeFiles,
  showToast,
  openFileTab,
  renameFileTab,
}: FileTreeActionsProps) {
  const {
    activeWorkspaceId,
    activeFilePath,
    setActiveFilePath,
    closeFileTab,
    removeCustomFolder,
    renameCustomFolder,
  } = useWorkspaceStore();

  const duplicateNode = useCallback(async (node: TreeNode) => {
    if (node.isFolder) return;
    const res = await duplicateVaultFile(node.path);
    if (res.success && res.newPath) {
      showToast(`Duplicated note as ${res.newPath}`);
      openFileTab(res.newPath);
      triggerBackgroundAutoSync();
    } else {
      showToast(res.error || 'Failed to duplicate note');
    }
  }, [showToast, openFileTab]);

  const renameNode = useCallback(async (node: TreeNode, newName: string) => {
    const oldPath = node.path;
    if (node.isFolder || node.id?.startsWith('folder:')) {
      const parentDir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
      const newPath = parentDir ? `${parentDir}/${newName}` : newName;
      await renameFolder(oldPath, newName, activeWorkspaceId);
      renameCustomFolder(oldPath, newPath);

      const prefix = `${oldPath}/`;
      const filesToRename = activeFiles.filter((f) => f.path.startsWith(prefix));
      for (const f of filesToRename) {
        const rest = f.path.substring(prefix.length);
        const renamedSubPath = `${newPath}/${rest}`;
        renameFileTab(f.path, renamedSubPath);
      }
      showToast(`Renamed folder to ${newName}`);
      triggerBackgroundAutoSync();
    } else {
      const dir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
      let targetName = newName;
      if (!targetName.endsWith('.md')) targetName += '.md';
      const newPath = dir ? `${dir}/${targetName}` : targetName;
      const res = await renameVaultFile(oldPath, newPath, newName.replace(/\.[^/.]+$/, ''));
      if (res.success) {
        renameFileTab(oldPath, newPath, newName.replace(/\.[^/.]+$/, ''));
        showToast(`Renamed note to ${newName}`);
        triggerBackgroundAutoSync();
      } else {
        showToast(res.error || 'Failed to rename note');
      }
    }
  }, [activeFiles, activeWorkspaceId, renameCustomFolder, renameFileTab, showToast]);

  const moveNode = useCallback(async (node: TreeNode, targetFolder: string) => {
    if (node.isFolder || node.id?.startsWith('folder:')) {
      await moveFolder(node.path, targetFolder, activeWorkspaceId);
      showToast(`Moved folder to ${targetFolder || 'root'}`);
      triggerBackgroundAutoSync();
    } else {
      const res = await moveVaultFile(node.path, targetFolder);
      if (res.success && res.newPath) {
        renameFileTab(node.path, res.newPath);
        showToast(`Moved note to ${targetFolder || 'root'}`);
        triggerBackgroundAutoSync();
      } else {
        showToast(res.error || 'Failed to move note');
      }
    }
  }, [activeWorkspaceId, renameFileTab, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      if (id.startsWith('folder:')) {
        const folderPath = id.slice('folder:'.length);
        const deletedIds = await softDeleteFolder(folderPath, activeWorkspaceId);
        removeCustomFolder(folderPath);

        const prefix = `${folderPath}/`;
        deletedIds.forEach((deletedId) => closeFileTab(deletedId));
        if (activeFilePath && (activeFilePath === folderPath || activeFilePath.startsWith(prefix))) {
          setActiveFilePath(null);
        }
        showToast('Folder moved to Trash');
        triggerBackgroundAutoSync();
      } else {
        await softDeleteNote(id, activeWorkspaceId);
        closeFileTab(id);
        if (activeFilePath === id) {
          setActiveFilePath(null);
        }
        showToast('Note moved to Trash');
        triggerBackgroundAutoSync();
      }
    } catch (err) {
      console.error('Failed to move item to trash:', err);
      showToast('Failed to move note to Trash');
    }
  }, [activeWorkspaceId, activeFilePath, closeFileTab, removeCustomFolder, setActiveFilePath, showToast]);

  return { duplicateNode, renameNode, moveNode, handleDelete };
}
