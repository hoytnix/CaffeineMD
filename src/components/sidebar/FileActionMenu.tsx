'use client';

import React from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { ContextMenu, ContextMenuElement } from '@/src/components/common/ContextMenu';
import {
  FileText,
  Columns,
  Edit3,
  Copy,
  FolderInput,
  FolderPlus,
  FilePlus,
  Trash2,
  Download,
  Cloud,
  Link,
  Code,
} from 'lucide-react';

export interface FileActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRect: DOMRect | null;
  filePath: string;
  fileName: string;
  isFolder: boolean;
  onRename: () => void;
  onDuplicate: () => void;
  onMove: () => void;
  onTrash: () => void;
  onNewNoteInFolder?: () => void;
  onNewSubfolder?: () => void;
}

export function FileActionMenu({
  isOpen,
  onClose,
  anchorRect,
  filePath,
  fileName,
  isFolder,
  onRename,
  onDuplicate,
  onMove,
  onTrash,
}: FileActionMenuProps) {
  const {
    openFileTab,
    duplicateToSplitView,
    openExportModal,
    showToast,
    setNewNoteModalOpen,
  } = useWorkspaceStore();

  if (!isOpen || !anchorRect) return null;

  const position = {
    x: anchorRect.left,
    y: anchorRect.bottom,
  };

  let menuItems: ContextMenuElement[] = [];

  if (isFolder) {
    menuItems = [
      {
        label: 'New Note in Folder',
        icon: <FilePlus className="w-3.5 h-3.5" />,
        onClick: () => setNewNoteModalOpen(true),
      },
      {
        label: 'New Subfolder',
        icon: <FolderPlus className="w-3.5 h-3.5" />,
        onClick: () => setNewNoteModalOpen(true),
      },
      { isDivider: true },
      {
        label: 'Rename Folder...',
        icon: <Edit3 className="w-3.5 h-3.5" />,
        onClick: onRename,
      },
      {
        label: 'Move Folder...',
        icon: <FolderInput className="w-3.5 h-3.5" />,
        onClick: onMove,
      },
      { isDivider: true },
      {
        label: 'Export Folder as PWA Bundle',
        icon: <Download className="w-3.5 h-3.5" />,
        onClick: () => openExportModal({ folderPath: filePath }),
      },
      {
        label: 'Deploy Folder to Netlify',
        icon: <Cloud className="w-3.5 h-3.5 text-teal-400" />,
        onClick: () => openExportModal({ folderPath: filePath }),
      },
      { isDivider: true },
      {
        label: 'Delete Folder',
        icon: <Trash2 className="w-3.5 h-3.5" />,
        destructive: true,
        onClick: onTrash,
      },
    ];
  } else {
    menuItems = [
      {
        label: 'Open',
        icon: <FileText className="w-3.5 h-3.5" />,
        shortcut: '↵',
        onClick: () => openFileTab(filePath, fileName),
      },
      {
        label: 'Open in Split View',
        icon: <Columns className="w-3.5 h-3.5" />,
        shortcut: '⌘Click',
        onClick: () => duplicateToSplitView(filePath, 'vertical'),
      },
      { isDivider: true },
      {
        label: 'Rename...',
        icon: <Edit3 className="w-3.5 h-3.5" />,
        shortcut: 'F2',
        onClick: onRename,
      },
      {
        label: 'Duplicate Note',
        icon: <Copy className="w-3.5 h-3.5" />,
        shortcut: '⌘D',
        onClick: onDuplicate,
      },
      {
        label: 'Move to Folder...',
        icon: <FolderInput className="w-3.5 h-3.5" />,
        onClick: onMove,
      },
      { isDivider: true },
      {
        label: 'Export Document',
        icon: <Download className="w-3.5 h-3.5" />,
        submenu: [
          {
            label: 'Standalone HTML',
            icon: <Code className="w-3.5 h-3.5" />,
            onClick: () => openExportModal({ targetNotePath: filePath }),
          },
          {
            label: 'PWA Zip Bundle',
            icon: <Download className="w-3.5 h-3.5" />,
            onClick: () => openExportModal({ targetNotePath: filePath }),
          },
          {
            label: 'Deploy to Netlify',
            icon: <Cloud className="w-3.5 h-3.5 text-teal-400" />,
            onClick: () => openExportModal({ targetNotePath: filePath }),
          },
        ],
      },
      {
        label: 'Copy Relative Path',
        icon: <Copy className="w-3.5 h-3.5" />,
        onClick: () => {
          navigator.clipboard.writeText(filePath);
          showToast('Relative path copied');
        },
      },
      {
        label: 'Copy [[WikiLink]]',
        icon: <Link className="w-3.5 h-3.5 text-indigo-400" />,
        onClick: () => {
          navigator.clipboard.writeText(`[[${fileName}]]`);
          showToast(`[[${fileName}]] copied`);
        },
      },
      { isDivider: true },
      {
        label: 'Move to Trash',
        icon: <Trash2 className="w-3.5 h-3.5" />,
        shortcut: 'Del',
        destructive: true,
        onClick: onTrash,
      },
    ];
  }

  return (
    <ContextMenu
      isOpen={isOpen}
      onClose={onClose}
      position={position}
      items={menuItems}
    />
  );
}
