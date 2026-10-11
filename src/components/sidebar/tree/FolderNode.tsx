'use client';

import React from 'react';
import { TreeNode } from '@/src/hooks/useTreeStructure';
import {
  Folder,
  FolderOpen,
  ChevronRight,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';
import { FileNodeRow } from './FileNodeRow';

export interface FolderNodeProps {
  node: TreeNode;
  depth?: number;
  openFolders: Set<string>;
  activeFilePath: string | null;
  onToggleFolder: (path: string) => void;
  onOpenFile: (path: string, title?: string) => void;
  onOpenActionMenu: (e: React.MouseEvent, node: TreeNode) => void;
}

/**
 * FolderNode
 * Renders expandable/collapsible folder directory nodes in the sidebar file tree.
 * Handles recursive nesting of subfolders and leaf files.
 */
export const FolderNode = React.memo(function FolderNode({
  node,
  depth = 0,
  openFolders,
  activeFilePath,
  onToggleFolder,
  onOpenFile,
  onOpenActionMenu,
}: FolderNodeProps) {
  const isFolderOpen = openFolders.has(node.path);

  return (
    <div className="select-none">
      {/* Folder Row Header */}
      <div
        onClick={() => onToggleFolder(node.path)}
        style={{ paddingLeft: `${depth * 12 + 10}px` }}
        className="flex items-center justify-between py-1 px-2 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 cursor-pointer text-xs font-medium text-neutral-700 dark:text-neutral-300 transition-colors group"
      >
        <div className="flex items-center gap-1.5 truncate">
          {isFolderOpen ? (
            <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
          )}
          {isFolderOpen ? (
            <FolderOpen className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
          ) : (
            <Folder className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>

        <button
          type="button"
          onClick={(e) => onOpenActionMenu(e, node)}
          className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 min-h-[28px] min-w-[28px] flex items-center justify-center p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-all cursor-pointer"
          title={`More actions for folder ${node.name}`}
          aria-label={`Actions for folder ${node.name}`}
        >
          <MoreVertical className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Collapsible Recursive Sub-Tree */}
      {isFolderOpen && node.children && (
        <div className="flex flex-col space-y-0.5">
          {node.children.map((child) =>
            child.isFolder ? (
              <FolderNode
                key={child.path}
                node={child}
                depth={depth + 1}
                openFolders={openFolders}
                activeFilePath={activeFilePath}
                onToggleFolder={onToggleFolder}
                onOpenFile={onOpenFile}
                onOpenActionMenu={onOpenActionMenu}
              />
            ) : (
              <FileNodeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                activeFilePath={activeFilePath}
                onOpenFile={onOpenFile}
                onOpenActionMenu={onOpenActionMenu}
              />
            )
          )}
        </div>
      )}
    </div>
  );
});
