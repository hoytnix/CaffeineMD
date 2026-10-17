'use client';

import { useEffect } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { useFindReplaceStore } from '@/src/stores/findReplaceStore';
import { matchesShortcut } from '@/src/lib/shortcuts/shortcutManager';

/**
 * Global keyboard shortcut listener for workspace-level navigation and modal toggles.
 */
export function useWorkspaceKeyboardShortcuts() {
  const {
    isFocusMode,
    setFocusMode,
    toggleFocusMode,
    keyboardShortcuts,
    isQuickSwitcherOpen,
    setQuickSwitcherOpen,
    isSearchOpen,
    setIsSearchOpen,
    toggleSplitPane,
    setNewNoteModalOpen,
    toggleSidebar,
    setActiveTab,
  } = useWorkspaceStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Focus Mode escape / toggle
      if (e.key === 'F11' || ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'f')) {
        e.preventDefault();
        toggleFocusMode();
        return;
      }
      if (e.key === 'Escape' && isFocusMode) {
        e.preventDefault();
        setFocusMode(false);
        return;
      }

      // Check configured shortcuts
      if (matchesShortcut(e, keyboardShortcuts.quickSwitcher)) {
        e.preventDefault();
        setQuickSwitcherOpen(!isQuickSwitcherOpen);
      } else if (
        matchesShortcut(e, keyboardShortcuts.quickSearch) ||
        (keyboardShortcuts.quickSearch === 'Mod+K' && (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'o')
      ) {
        e.preventDefault();
        setIsSearchOpen(!isSearchOpen);
      } else if (matchesShortcut(e, keyboardShortcuts.findReplace)) {
        e.preventDefault();
        useFindReplaceStore.getState().setOpen(!useFindReplaceStore.getState().isOpen);
      } else if (matchesShortcut(e, keyboardShortcuts.splitPane)) {
        e.preventDefault();
        toggleSplitPane();
      } else if (matchesShortcut(e, keyboardShortcuts.newNote)) {
        e.preventDefault();
        setNewNoteModalOpen(true, null);
      } else if (matchesShortcut(e, keyboardShortcuts.toggleSidebar)) {
        e.preventDefault();
        toggleSidebar();
      } else if (matchesShortcut(e, keyboardShortcuts.openSettings)) {
        e.preventDefault();
        setActiveTab('settings');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isFocusMode,
    toggleFocusMode,
    setFocusMode,
    keyboardShortcuts,
    isQuickSwitcherOpen,
    setQuickSwitcherOpen,
    isSearchOpen,
    setIsSearchOpen,
    toggleSplitPane,
    setNewNoteModalOpen,
    toggleSidebar,
    setActiveTab,
  ]);
}
