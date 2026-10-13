import { useMemo } from 'react';
import { VaultFile } from '@/src/lib/storage/db';

export interface TreeNode {
  id: string;
  name: string;
  path: string;
  isFolder: boolean;
  children?: TreeNode[];
  file?: VaultFile;
}

export function useTreeStructure(files: VaultFile[], filterQuery: string, customFolders: string[] = []) {
  return useMemo(() => {
    const root: TreeNode = { id: 'root', name: 'root', path: '', isFolder: true, children: [] };

    // Insert custom/empty folders into tree
    customFolders.forEach((folderPath) => {
      const parts = folderPath.replace(/^folder:/, '').trim().replace(/^\/+|\/+$/g, '').split('/');
      if (parts.length === 0 || !parts[0]) return;
      let current = root;
      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const currentPath = parts.slice(0, i + 1).join('/');
        if (!current.children) current.children = [];
        let existing = current.children.find((c) => c.name === part);
        if (!existing) {
          existing = {
            id: `folder:${currentPath}`,
            name: part,
            path: currentPath,
            isFolder: true,
            children: [],
          };
          current.children.push(existing);
        }
        current = existing;
      }
    });

    const displayed = filterQuery.trim()
      ? files.filter(
          (f) =>
            f.name.toLowerCase().includes(filterQuery.toLowerCase()) ||
            f.title?.toLowerCase().includes(filterQuery.toLowerCase())
        )
      : files;

    displayed.forEach((file) => {
      const parts = file.path.split('/');
      let current = root;

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const isLast = i === parts.length - 1;
        const currentPath = parts.slice(0, i + 1).join('/');

        if (!current.children) current.children = [];

        let existing = current.children.find((c) => c.name === part);
        if (!existing) {
          existing = {
            id: isLast ? (file.id || currentPath) : `folder:${currentPath}`,
            name: part,
            path: currentPath,
            isFolder: !isLast,
            children: isLast ? undefined : [],
            file: isLast ? file : undefined,
          };
          current.children.push(existing);
        }
        current = existing;
      }
    });

    const sortTree = (node: TreeNode) => {
      if (node.children) {
        node.children.sort((a, b) => {
          if (a.isFolder && !b.isFolder) return -1;
          if (!a.isFolder && b.isFolder) return 1;
          return a.name.localeCompare(b.name);
        });
        node.children.forEach(sortTree);
      }
    };
    sortTree(root);

    return root.children || [];
  }, [files, filterQuery, customFolders]);
}
