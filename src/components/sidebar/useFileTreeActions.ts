import { useCallback } from 'react';
import { VaultFile, renameVaultFile, duplicateVaultFile, moveVaultFile } from '@/src/lib/storage/db';
import { TreeNode } from '@/src/hooks/useTreeStructure';

interface FileTreeActionsProps {
  activeFiles: VaultFile[];
  showToast: (msg: string) => void;
  openFileTab: (path: string, title?: string) => void;
  renameFileTab: (oldPath: string, newPath: string, newTitle?: string) => void;
}

export function useFileTreeActions({
  activeFiles,
  showToast,
  openFileTab,
  renameFileTab,
}: FileTreeActionsProps) {
  const duplicateNode = useCallback(async (node: TreeNode) => {
    if (node.isFolder) return;
    const res = await duplicateVaultFile(node.path);
    if (res.success && res.newPath) {
      showToast(`Duplicated note as ${res.newPath}`);
      openFileTab(res.newPath);
    } else {
      showToast(res.error || 'Failed to duplicate note');
    }
  }, [showToast, openFileTab]);

  const renameNode = useCallback(async (node: TreeNode, newName: string) => {
    const oldPath = node.path;
    if (node.isFolder) {
      const parentDir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
      const newPath = parentDir ? `${parentDir}/${newName}` : newName;
      const prefix = `${oldPath}/`;
      const filesToRename = activeFiles.filter((f) => f.path.startsWith(prefix));
      for (const f of filesToRename) {
        const rest = f.path.substring(prefix.length);
        const renamedSubPath = `${newPath}/${rest}`;
        await renameVaultFile(f.path, renamedSubPath);
        renameFileTab(f.path, renamedSubPath);
      }
      showToast(`Renamed folder to ${newName}`);
    } else {
      const dir = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
      let targetName = newName;
      if (!targetName.endsWith('.md')) targetName += '.md';
      const newPath = dir ? `${dir}/${targetName}` : targetName;
      const res = await renameVaultFile(oldPath, newPath, newName.replace(/\.[^/.]+$/, ''));
      if (res.success) {
        renameFileTab(oldPath, newPath, newName.replace(/\.[^/.]+$/, ''));
        showToast(`Renamed note to ${newName}`);
      } else {
        showToast(res.error || 'Failed to rename note');
      }
    }
  }, [activeFiles, renameFileTab, showToast]);

  const moveNode = useCallback(async (node: TreeNode, targetFolder: string) => {
    const res = await moveVaultFile(node.path, targetFolder);
    if (res.success && res.newPath) {
      renameFileTab(node.path, res.newPath);
      showToast(`Moved note to ${targetFolder || 'root'}`);
    } else {
      showToast(res.error || 'Failed to move note');
    }
  }, [renameFileTab, showToast]);

  return { duplicateNode, renameNode, moveNode };
}
