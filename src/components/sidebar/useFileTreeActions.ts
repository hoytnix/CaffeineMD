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
import { executeVaultMutation } from '@/src/lib/storage/vaultMutationService';

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
    expandFolders,
    setNewNoteModalOpen,
  } = useWorkspaceStore();

  const duplicateNode = useCallback(async (node: TreeNode) => {
    if (node.isFolder) return;
    const res = await executeVaultMutation(() => duplicateVaultFile(node.path));
    if (res.success && res.newPath) {
      showToast(`Duplicated note as ${res.newPath}`);
      openFileTab(res.newPath);
    } else {
      showToast(res.error || 'Failed to duplicate note');
    }
  }, [showToast, openFileTab]);

  const renameNode = useCallback(async (node: TreeNode, newName: string) => {
    const oldPath = node.path;
    if (node.isFolder || node.id?.startsWith('folder:')) {
      const parentDir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
      const newPath = parentDir ? `${parentDir}/${newName}` : newName;
      await executeVaultMutation(() => renameFolder(oldPath, newName, activeWorkspaceId));
      renameCustomFolder(oldPath, newPath);

      const prefix = `${oldPath}/`;
      const filesToRename = activeFiles.filter((f) => f.path.startsWith(prefix));
      for (const f of filesToRename) {
        const rest = f.path.substring(prefix.length);
        const renamedSubPath = `${newPath}/${rest}`;
        renameFileTab(f.path, renamedSubPath);
      }
      showToast(`Renamed folder to ${newName}`);
    } else {
      const dir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
      let targetName = newName;
      if (!targetName.endsWith('.md')) targetName += '.md';
      const newPath = dir ? `${dir}/${targetName}` : targetName;
      const res = await executeVaultMutation(() =>
        renameVaultFile(oldPath, newPath, newName.replace(/\.[^/.]+$/, ''))
      );
      if (res.success) {
        renameFileTab(oldPath, newPath, newName.replace(/\.[^/.]+$/, ''));
        showToast(`Renamed note to ${newName}`);
      } else {
        showToast(res.error || 'Failed to rename note');
      }
    }
  }, [activeFiles, activeWorkspaceId, renameCustomFolder, renameFileTab, showToast]);

  const moveNode = useCallback(async (node: TreeNode, targetFolder: string) => {
    const cleanTarget = targetFolder.trim().replace(/^\/+|\/+$/g, '');

    // Auto-expand all ancestor folder segments for destination
    const expandAncestors = (folderPath: string) => {
      if (!folderPath) return;
      const segments = folderPath.split('/');
      const pathsToExpand: string[] = [];
      for (let i = 1; i <= segments.length; i++) {
        pathsToExpand.push(segments.slice(0, i).join('/'));
      }
      expandFolders(pathsToExpand);
    };

    if (node.isFolder || node.id?.startsWith('folder:')) {
      const cleanSource = node.path.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '');
      const folderBaseName = cleanSource.split('/').pop() || cleanSource;
      const newFolderPath = cleanTarget ? `${cleanTarget}/${folderBaseName}` : folderBaseName;

      await executeVaultMutation(() => moveFolder(cleanSource, cleanTarget, activeWorkspaceId));
      renameCustomFolder(cleanSource, newFolderPath);

      const prefix = `${cleanSource}/`;
      const filesToRename = activeFiles.filter((f) => f.path.startsWith(prefix));
      for (const f of filesToRename) {
        const rest = f.path.substring(prefix.length);
        const renamedSubPath = `${newFolderPath}/${rest}`;
        renameFileTab(f.path, renamedSubPath);
      }

      expandAncestors(newFolderPath);
      showToast(`Moved folder to ${cleanTarget || 'root'}`);
    } else {
      const res = await executeVaultMutation(() => moveVaultFile(node.path, cleanTarget));
      if (res.success && res.newPath) {
        renameFileTab(node.path, res.newPath);
        expandAncestors(cleanTarget);
        showToast(`Moved note to ${cleanTarget || 'root'}`);
      } else {
        showToast(res.error || 'Failed to move note');
      }
    }
  }, [activeFiles, activeWorkspaceId, expandFolders, renameCustomFolder, renameFileTab, showToast]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      if (id.startsWith('folder:')) {
        const folderPath = id.slice('folder:'.length);
        const deletedIds = await executeVaultMutation(() =>
          softDeleteFolder(folderPath, activeWorkspaceId)
        );
        removeCustomFolder(folderPath);

        const prefix = `${folderPath}/`;
        deletedIds.forEach((deletedId) => closeFileTab(deletedId));
        if (activeFilePath && (activeFilePath === folderPath || activeFilePath.startsWith(prefix))) {
          setActiveFilePath(null);
        }
        showToast('Folder moved to Trash');
      } else {
        await executeVaultMutation(() => softDeleteNote(id, activeWorkspaceId));
        closeFileTab(id);
        if (activeFilePath === id) {
          setActiveFilePath(null);
        }
        showToast('Note moved to Trash');
      }
    } catch (err) {
      console.error('Failed to move item to trash:', err);
      showToast('Failed to move note to Trash');
    }
  }, [activeWorkspaceId, activeFilePath, closeFileTab, removeCustomFolder, setActiveFilePath, showToast]);

  const handleNewNoteInFolder = useCallback((folderPath: string) => {
    // Normalize folderPath ensuring no trailing slash or duplicate slashes
    const cleanFolder = folderPath.replace(/^folder:/, '').trim().replace(/\/+$/, '');
    const normalizedPath = cleanFolder ? (cleanFolder.startsWith('/') ? cleanFolder : `/${cleanFolder}`) : '/';
    setNewNoteModalOpen(true, normalizedPath);
  }, [setNewNoteModalOpen]);

  return { duplicateNode, renameNode, moveNode, handleDelete, handleNewNoteInFolder };
}
