'use client';

import React from 'react';
import { TreeNode } from '@/src/hooks/useTreeStructure';
import { EISENHOWER_CONFIG, EisenhowerQuadrant } from '@/src/lib/storage/db';
import {
  Folder,
  FolderOpen,
  FileText,
  Image as ImageIcon,
  Paperclip,
  ChevronRight,
  ChevronDown,
  MoreVertical,
} from 'lucide-react';

interface FileTreeItemProps {
  node: TreeNode;
  depth?: number;
  openFolders: Set<string>;
  activeFilePath: string | null;
  onToggleFolder: (path: string) => void;
  onOpenFile: (path: string, title?: string) => void;
  onOpenActionMenu: (e: React.MouseEvent, node: TreeNode) => void;
}

export const FileTreeItem = React.memo(function FileTreeItem({
  node,
  depth = 0,
  openFolders,
  activeFilePath,
  onToggleFolder,
  onOpenFile,
  onOpenActionMenu,
}: FileTreeItemProps) {
  const isFolderOpen = openFolders.has(node.path);
  const isActive = activeFilePath === node.path;

  if (node.isFolder) {
    return (
      <div className="select-none">
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
            title={`More actions for ${node.name}`}
            aria-label={`Actions for folder ${node.name}`}
          >
            <MoreVertical className="w-3.5 h-3.5" />
          </button>
        </div>

        {isFolderOpen && node.children && (
          <div>
            {node.children.map((child) => (
              <FileTreeItem
                key={child.path}
                node={child}
                depth={depth + 1}
                openFolders={openFolders}
                activeFilePath={activeFilePath}
                onToggleFolder={onToggleFolder}
                onOpenFile={onOpenFile}
                onOpenActionMenu={onOpenActionMenu}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  const isImage =
    node.file?.mimeType?.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(node.file?.extension || '');

  const rawQuadrant = (node.file?.eisenhower || node.file?.frontmatter?.eisenhower) as EisenhowerQuadrant | undefined;
  const eisenhowerOpt = rawQuadrant && EISENHOWER_CONFIG[rawQuadrant] ? EISENHOWER_CONFIG[rawQuadrant] : null;

  return (
    <div
      onClick={() => onOpenFile(node.path, node.file?.title)}
      style={{ paddingLeft: `${depth * 12 + 18}px` }}
      className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer text-xs transition-colors group ${
        isActive
          ? 'bg-neutral-200 dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-neutral-100'
          : 'hover:bg-neutral-100 dark:hover:bg-neutral-800/40 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200'
      }`}
    >
      <div className="flex items-center gap-2 truncate">
        {eisenhowerOpt && (
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${eisenhowerOpt.dotBg}`}
            title={`Eisenhower: ${eisenhowerOpt.label}`}
          />
        )}
        {isImage ? (
          <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        ) : node.file?.isBinary ? (
          <Paperclip className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        )}
        <span className="truncate">{node.file?.title || node.name}</span>
      </div>

      <button
        type="button"
        onClick={(e) => onOpenActionMenu(e, node)}
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 min-h-[28px] min-w-[28px] flex items-center justify-center p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-all cursor-pointer"
        title={`More actions for ${node.file?.title || node.name}`}
        aria-label={`Actions for file ${node.file?.title || node.name}`}
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});
