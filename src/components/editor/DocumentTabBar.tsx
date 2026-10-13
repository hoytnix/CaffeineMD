'use client';

import React from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { useContextMenu } from '@/src/hooks/useContextMenu';
import { ContextMenu, ContextMenuElement } from '@/src/components/common/ContextMenu';
import {
  FileText,
  X,
  Pin,
  PinOff,
  Copy,
  Columns,
  Rows,
  Download,
  XCircle,
} from 'lucide-react';

interface DocumentTabBarProps {
  currentPath: string;
}

export function DocumentTabBar({ currentPath }: DocumentTabBarProps) {
  const {
    openTabs,
    pinnedTabs,
    openFileTab,
    closeFileTab,
    closeOtherTabs,
    closeTabsToTheRight,
    closeAllTabs,
    togglePinTab,
    duplicateToSplitView,
    openExportModal,
    showToast,
  } = useWorkspaceStore();

  const { isOpen, position, targetData, openMenu, closeMenu, bindLongPress } =
    useContextMenu<{ path: string; title: string }>();

  if (openTabs.length === 0) return null;

  const targetTab = targetData || { path: currentPath, title: '' };
  const isTargetPinned = pinnedTabs.includes(targetTab.path);

  const contextMenuItems: ContextMenuElement[] = [
    {
      label: 'Close Tab',
      icon: <X className="w-3.5 h-3.5" />,
      shortcut: '⌘W',
      disabled: isTargetPinned,
      onClick: () => closeFileTab(targetTab.path),
    },
    {
      label: 'Close Other Tabs',
      icon: <XCircle className="w-3.5 h-3.5" />,
      onClick: () => closeOtherTabs(targetTab.path),
    },
    {
      label: 'Close Tabs to the Right',
      onClick: () => closeTabsToTheRight(targetTab.path),
    },
    {
      label: 'Close All Tabs',
      destructive: true,
      onClick: () => closeAllTabs(),
    },
    { isDivider: true },
    {
      label: 'Duplicate to Split View (Right)',
      icon: <Columns className="w-3.5 h-3.5" />,
      onClick: () => duplicateToSplitView(targetTab.path, 'vertical'),
    },
    {
      label: 'Duplicate to Split View (Down)',
      icon: <Rows className="w-3.5 h-3.5" />,
      onClick: () => duplicateToSplitView(targetTab.path, 'horizontal'),
    },
    {
      label: isTargetPinned ? 'Unpin Tab' : 'Pin Tab',
      icon: isTargetPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />,
      onClick: () => togglePinTab(targetTab.path),
    },
    { isDivider: true },
    {
      label: 'Copy Document Path',
      icon: <Copy className="w-3.5 h-3.5" />,
      onClick: () => {
        navigator.clipboard.writeText(targetTab.path);
        showToast('Document path copied to clipboard');
      },
    },
    {
      label: 'Quick Export to PWA / Netlify',
      icon: <Download className="w-3.5 h-3.5" />,
      onClick: () => openExportModal({ targetNotePath: targetTab.path }),
    },
  ];

  return (
    <>
      <div className="flex items-center gap-1 px-3 py-1 bg-[var(--card)]/40 border-b border-[var(--border)] overflow-x-auto no-scrollbar text-xs select-none min-h-[36px]">
        {openTabs.map((tab) => {
          const isActive = tab.path === currentPath;
          const isPinned = pinnedTabs.includes(tab.path);

          return (
            <div
              key={tab.path}
              onClick={() => openFileTab(tab.path, tab.title)}
              onContextMenu={(e) => openMenu(e, tab)}
              {...bindLongPress(tab)}
              className={`group flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer shrink-0 max-w-[200px] border ${
                isActive
                  ? 'bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] font-medium shadow-xs'
                  : 'bg-transparent border-transparent text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5'
              }`}
              title={tab.path}
            >
              <FileText className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[var(--accent)]' : 'text-neutral-400'}`} />
              <span className="truncate">{tab.title || tab.path.split('/').pop()?.replace(/\.[^/.]+$/, '')}</span>

              {isPinned ? (
                <Pin className="w-3 h-3 text-indigo-400 shrink-0 ml-0.5" />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFileTab(tab.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-700/60 transition-opacity cursor-pointer text-neutral-400 hover:text-[var(--foreground)] shrink-0 ml-0.5"
                  title="Close tab (⌘W)"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <ContextMenu
        isOpen={isOpen}
        onClose={closeMenu}
        position={position}
        items={contextMenuItems}
      />
    </>
  );
}
