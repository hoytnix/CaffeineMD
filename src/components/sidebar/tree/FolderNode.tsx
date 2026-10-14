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
  // Drag and drop handlers & state
  dropTargetFolderPath?: string | null;
  draggedNodePath?: string | null;
  onFolderDragOver?: (e: React.DragEvent, folderPath: string) => void;
  onFolderDragEnter?: (e: React.DragEvent, folderPath: string) => void;
  onFolderDragLeave?: (e: React.DragEvent, folderPath: string) => void;
  onFolderDrop?: (e: React.DragEvent, folderPath: string) => void;
  onNodeDragStart?: (e: React.DragEvent, nodePath: string) => void;
  onNodeDragEnd?: () => void;
}

/**
 * FolderNode
 * Renders expandable/collapsible folder directory nodes in the sidebar file tree.
 * Handles recursive nesting of subfolders and leaf files with isolated drag-and-drop targeting.
 */
export const FolderNode = React.memo(function FolderNode({
  node,
  depth = 0,
  openFolders,
  activeFilePath,
  onToggleFolder,
  onOpenFile,
  onOpenActionMenu,
  dropTargetFolderPath,
  draggedNodePath,
  onFolderDragOver,
  onFolderDragEnter,
  onFolderDragLeave,
  onFolderDrop,
  onNodeDragStart,
  onNodeDragEnd,
}: FolderNodeProps) {
  const isFolderOpen = openFolders.has(node.path);
  const isDropTarget = dropTargetFolderPath === node.path;
  const isDragging = draggedNodePath === node.path;

  return (
    <div className="select-none">
      {/* Folder Row Header: drop handlers strictly attached here to prevent bubbling */}
      <div
        draggable={true}
        onDragStart={(e) => onNodeDragStart?.(e, node.path)}
        onDragEnd={onNodeDragEnd}
        onDragOver={(e) => onFolderDragOver?.(e, node.path)}
        onDragEnter={(e) => onFolderDragEnter?.(e, node.path)}
        onDragLeave={(e) => onFolderDragLeave?.(e, node.path)}
        onDrop={(e) => onFolderDrop?.(e, node.path)}
        onClick={() => onToggleFolder(node.path)}
        onContextMenu={(e) => {
          e.preventDefault();
          onOpenActionMenu(e, node);
        }}
        style={{ paddingLeft: `${depth * 12 + 10}px` }}
        className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer text-xs font-medium transition-colors group ${
          isDragging ? 'opacity-50' : ''
        } ${
          isDropTarget
            ? 'bg-indigo-500/20 text-indigo-400 ring-1 ring-indigo-500/50'
            : 'hover:bg-neutral-200/50 dark:hover:bg-neutral-800/60 text-neutral-700 dark:text-neutral-300'
        }`}
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
            <Folder className="w-3.5 h-3.5 text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 shrink-0" />
          )}
          <span className="truncate">{node.name}</span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenActionMenu(e, node);
          }}
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
                dropTargetFolderPath={dropTargetFolderPath}
                draggedNodePath={draggedNodePath}
                onFolderDragOver={onFolderDragOver}
                onFolderDragEnter={onFolderDragEnter}
                onFolderDragLeave={onFolderDragLeave}
                onFolderDrop={onFolderDrop}
                onNodeDragStart={onNodeDragStart}
                onNodeDragEnd={onNodeDragEnd}
              />
            ) : (
              <FileNodeRow
                key={child.path}
                node={child}
                depth={depth + 1}
                activeFilePath={activeFilePath}
                onOpenFile={onOpenFile}
                onOpenActionMenu={onOpenActionMenu}
                draggedNodePath={draggedNodePath}
                onNodeDragStart={onNodeDragStart}
                onNodeDragEnd={onNodeDragEnd}
              />
            )
          )}
        </div>
      )}
    </div>
  );
});
