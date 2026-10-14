'use client';

import { useEffect } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { matchesShortcut } from '@/src/lib/shortcuts/shortcutManager';

export function useEmojiDrawer() {
  const {
    isEmojiDrawerOpen,
    setEmojiDrawerOpen,
    toggleEmojiDrawer,
    keyboardShortcuts,
  } = useWorkspaceStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (matchesShortcut(e, keyboardShortcuts.emojiDrawer)) {
        e.preventDefault();
        e.stopPropagation();
        toggleEmojiDrawer();
      } else if (e.key === 'Escape' && isEmojiDrawerOpen) {
        setEmojiDrawerOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [isEmojiDrawerOpen, setEmojiDrawerOpen, toggleEmojiDrawer, keyboardShortcuts.emojiDrawer]);

  return {
    isOpen: isEmojiDrawerOpen,
    open: () => setEmojiDrawerOpen(true),
    close: () => setEmojiDrawerOpen(false),
    toggle: toggleEmojiDrawer,
  };
}
