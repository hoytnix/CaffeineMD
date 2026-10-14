'use client';

import React from 'react';
import { TreeNode } from '@/src/hooks/useTreeStructure';
import { FileActionMenu } from '../FileActionMenu';
import { RenameModal } from '../RenameModal';
import { MoveModal } from '../MoveModal';

export interface FileTreeModalsProps {
  activeMenuNode: TreeNode | null;
  menuAnchorRect: DOMRect | null;
  onCloseActionMenu: () => void;
  renameTarget: TreeNode | null;
  setRenameTarget: (node: TreeNode | null) => void;
  moveTarget: TreeNode | null;
  setMoveTarget: (node: TreeNode | null) => void;
  newNoteModal?: boolean;
  setNewNoteModal?: (open: boolean) => void;
  folderSuggestions: string[];
  duplicateNode: (node: TreeNode) => Promise<void>;
  renameNode: (node: TreeNode, newName: string) => Promise<void>;
  moveNode: (node: TreeNode, destFolder: string) => Promise<void>;
  promptDeleteNote: (path: string, title?: string) => void;
}

/**
 * FileTreeModals
 * Orchestrates and encapsulates all sidebar dialog modals and action popovers:
 * - Contextual file / folder action popover
 * - Rename dialog modal
 * - Destination move dialog modal
 */
export function FileTreeModals({
  activeMenuNode,
  menuAnchorRect,
  onCloseActionMenu,
  renameTarget,
  setRenameTarget,
  moveTarget,
  setMoveTarget,
  folderSuggestions,
  duplicateNode,
  renameNode,
  moveNode,
  promptDeleteNote,
}: FileTreeModalsProps) {
  return (
    <>
      {/* Floating Action Menu Anchored to Ellipsis Button or Context Menu */}
      <FileActionMenu
        isOpen={Boolean(activeMenuNode && menuAnchorRect)}
        onClose={onCloseActionMenu}
        anchorRect={menuAnchorRect}
        filePath={activeMenuNode?.path || ''}
        fileName={activeMenuNode?.file?.title || activeMenuNode?.name || ''}
        isFolder={Boolean(activeMenuNode?.isFolder)}
        onRename={() => setRenameTarget(activeMenuNode)}
        onDuplicate={() => activeMenuNode && duplicateNode(activeMenuNode)}
        onMove={() => setMoveTarget(activeMenuNode)}
        onTrash={() => {
          if (activeMenuNode) {
            promptDeleteNote(
              activeMenuNode.path,
              activeMenuNode.file?.title || activeMenuNode.name
            );
          }
        }}
      />

      {/* Rename Dialog Modal */}
      <RenameModal
        isOpen={Boolean(renameTarget)}
        onClose={() => setRenameTarget(null)}
        currentTitle={
          renameTarget?.file?.title ||
          renameTarget?.name?.replace(/\.[^/.]+$/, '') ||
          ''
        }
        isFolder={Boolean(renameTarget?.isFolder)}
        onConfirm={(newName) =>
          renameTarget ? renameNode(renameTarget, newName) : Promise.resolve()
        }
      />

      {/* Move Destination Dialog Modal */}
      <MoveModal
        isOpen={Boolean(moveTarget)}
        onClose={() => setMoveTarget(null)}
        fileName={moveTarget?.file?.title || moveTarget?.name || ''}
        currentFolder={
          moveTarget?.path.includes('/')
            ? moveTarget.path.substring(0, moveTarget.path.lastIndexOf('/'))
            : ''
        }
        folderSuggestions={folderSuggestions}
        onConfirm={(targetFolder) =>
          moveTarget ? moveNode(moveTarget, targetFolder) : Promise.resolve()
        }
      />
    </>
  );
}
