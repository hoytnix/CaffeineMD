'use client';

import React from 'react';
import { TreeNode } from '@/src/hooks/useTreeStructure';
import { EISENHOWER_CONFIG, EisenhowerQuadrant } from '@/src/lib/storage/db';
import {
  FileText,
  Image as ImageIcon,
  Paperclip,
  MoreVertical,
} from 'lucide-react';

export interface FileNodeRowProps {
  node: TreeNode;
  depth?: number;
  activeFilePath: string | null;
  onOpenFile: (path: string, title?: string) => void;
  onOpenActionMenu: (e: React.MouseEvent, node: TreeNode) => void;
}

/**
 * FileNodeRow
 * Renders individual leaf note and file items within the sidebar file tree.
 * Displays Eisenhower quadrant priority indicators, file type icons, active selection state,
 * and vertical ellipsis action menu trigger with mobile-friendly tap targets.
 */
export const FileNodeRow = React.memo(function FileNodeRow({
  node,
  depth = 0,
  activeFilePath,
  onOpenFile,
  onOpenActionMenu,
}: FileNodeRowProps) {
  const isActive = activeFilePath === node.path;

  const isImage =
    node.file?.mimeType?.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(node.file?.extension || '');

  const rawQuadrant = (node.file?.eisenhower || node.file?.frontmatter?.eisenhower) as EisenhowerQuadrant | undefined;
  const eisenhowerOpt = rawQuadrant && EISENHOWER_CONFIG[rawQuadrant] ? EISENHOWER_CONFIG[rawQuadrant] : null;

  const renderFileIcon = () => {
    if (isImage) {
      return (
        <ImageIcon
          className="w-3.5 h-3.5 text-emerald-500 shrink-0"
          aria-hidden="true"
        />
      );
    }
    if (node.file?.isBinary) {
      return (
        <Paperclip
          className="w-3.5 h-3.5 text-neutral-400 shrink-0"
          aria-hidden="true"
        />
      );
    }
    return (
      <FileText
        className="w-3.5 h-3.5 text-neutral-400 shrink-0"
        aria-hidden="true"
      />
    );
  };

  const displayName = node.file?.title || node.name;

  return (
    <div
      role="treeitem"
      aria-selected={isActive}
      tabIndex={0}
      onClick={() => onOpenFile(node.path, node.file?.title)}
      onContextMenu={(e) => {
        e.preventDefault();
        onOpenActionMenu(e, node);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          onOpenFile(node.path, node.file?.title);
        }
      }}
      style={{ paddingLeft: `${depth * 12 + 18}px` }}
      className={`flex items-center justify-between py-1 px-2 rounded-md cursor-pointer text-xs transition-colors group select-none focus:outline-none focus:ring-1 focus:ring-indigo-500 ${
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
        {renderFileIcon()}
        <span className="truncate" title={displayName}>
          {displayName}
        </span>
      </div>

      <button
        type="button"
        onClick={(e) => onOpenActionMenu(e, node)}
        className="opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 min-h-[28px] min-w-[28px] flex items-center justify-center p-1 rounded text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-200/60 dark:hover:bg-neutral-700/60 transition-all cursor-pointer"
        title={`More actions for ${displayName}`}
        aria-label={`Actions for file ${displayName}`}
      >
        <MoreVertical className="w-3.5 h-3.5" />
      </button>
    </div>
  );
});
