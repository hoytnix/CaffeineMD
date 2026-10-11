'use client';

import React from 'react';
import { TreeNode } from '@/src/hooks/useTreeStructure';
import { FolderNode } from './tree/FolderNode';
import { FileNodeRow } from './tree/FileNodeRow';

export interface FileTreeItemProps {
  node: TreeNode;
  depth?: number;
  openFolders: Set<string>;
  activeFilePath: string | null;
  onToggleFolder: (path: string) => void;
  onOpenFile: (path: string, title?: string) => void;
  onOpenActionMenu: (e: React.MouseEvent, node: TreeNode) => void;
}

/**
 * FileTreeItem
 * Adaptive delegator that renders FolderNode for directory nodes and FileNodeRow for leaf items.
 */
export const FileTreeItem = React.memo(function FileTreeItem(props: FileTreeItemProps) {
  if (props.node.isFolder) {
    return <FolderNode {...props} />;
  }
  return <FileNodeRow {...props} />;
});

export { FolderNode } from './tree/FolderNode';
export { FileNodeRow } from './tree/FileNodeRow';
