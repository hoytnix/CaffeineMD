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
    setActiveNoteId,
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
      <div
        className="flex items-center gap-1 px-3 py-1 border-b overflow-x-auto no-scrollbar text-xs select-none min-h-[36px]"
        style={{
          backgroundColor: 'var(--theme-bg-sidebar)',
          borderColor: 'var(--theme-border)',
        }}
      >
        {openTabs.map((tab) => {
          const isActive = tab.path === currentPath;
          const isPinned = pinnedTabs.includes(tab.path);

          return (
            <div
              key={tab.path}
              onClick={() => {
                React.startTransition(() => {
                  if (setActiveNoteId) {
                    setActiveNoteId(tab.path);
                  }
                  openFileTab(tab.path, tab.title);
                });
              }}
              onContextMenu={(e) => openMenu(e, tab)}
              {...bindLongPress(tab)}
              className={`group flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all cursor-pointer shrink-0 max-w-[200px] border ${
                isActive ? 'font-medium shadow-xs' : 'hover:opacity-85'
              }`}
              style={{
                backgroundColor: isActive ? 'var(--theme-bg-card)' : 'transparent',
                borderColor: isActive ? 'var(--theme-border)' : 'transparent',
                color: isActive ? 'var(--theme-text-primary)' : 'var(--theme-text-muted)',
              }}
              title={tab.path}
            >
              <FileText
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: isActive ? 'var(--theme-accent)' : 'var(--theme-text-muted)' }}
              />
              <span
                className="truncate"
                style={{ color: isActive ? 'var(--theme-text-primary)' : 'var(--theme-text-secondary)' }}
              >
                {tab.title || tab.path.split('/').pop()?.replace(/\.[^/.]+$/, '')}
              </span>

              {isPinned ? (
                <Pin
                  className="w-3 h-3 shrink-0 ml-0.5"
                  style={{ color: 'var(--theme-accent)' }}
                />
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    closeFileTab(tab.path);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-0.5 rounded transition-opacity cursor-pointer shrink-0 ml-0.5 hover:bg-black/10 dark:hover:bg-white/10"
                  style={{ color: 'var(--theme-text-muted)' }}
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
