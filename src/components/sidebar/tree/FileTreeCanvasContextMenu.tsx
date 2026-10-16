'use client';

import React from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { ContextMenu, ContextMenuElement } from '@/src/components/common/ContextMenu';
import { FilePlus, FolderPlus, Folder, FolderUp } from 'lucide-react';

interface FileTreeCanvasContextMenuProps {
  isOpen: boolean;
  position: { x: number; y: number };
  onClose: () => void;
  onCollapseAll: () => void;
}

export function FileTreeCanvasContextMenu({
  isOpen,
  position,
  onClose,
  onCollapseAll,
}: FileTreeCanvasContextMenuProps) {
  const { setNewNoteModalOpen, setImportModalOpen } = useWorkspaceStore();

  const items: ContextMenuElement[] = [
    {
      label: 'New Note at Root',
      icon: <FilePlus className="w-3.5 h-3.5" />,
      shortcut: '⌘N',
      onClick: () => setNewNoteModalOpen(true, null),
    },
    {
      label: 'New Folder at Root',
      icon: <FolderPlus className="w-3.5 h-3.5" />,
      onClick: () => setNewNoteModalOpen(true, null),
    },
    { isDivider: true },
    {
      label: 'Collapse All Folders',
      icon: <Folder className="w-3.5 h-3.5" />,
      onClick: onCollapseAll,
    },
    { isDivider: true },
    {
      label: 'Import / Mount Vault...',
      icon: <FolderUp className="w-3.5 h-3.5 text-indigo-400" />,
      onClick: () => setImportModalOpen(true),
    },
  ];

  return (
    <ContextMenu
      isOpen={isOpen}
      position={position}
      onClose={onClose}
      items={items}
    />
  );
}
