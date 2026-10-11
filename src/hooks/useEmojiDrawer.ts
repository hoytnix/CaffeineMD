'use client';

import { useEffect } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';

export function useEmojiDrawer() {
  const { isEmojiDrawerOpen, setEmojiDrawerOpen, toggleEmojiDrawer } = useWorkspaceStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + Shift (+ Space or E) trigger
      const isCmdOrCtrl = e.metaKey || e.ctrlKey;
      const isCmdShift = isCmdOrCtrl && e.shiftKey && (e.code === 'Space' || e.key === ' ' || e.key.toLowerCase() === 'e');

      if (isCmdShift) {
        // Prevent default browser behavior
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
  }, [isEmojiDrawerOpen, setEmojiDrawerOpen, toggleEmojiDrawer]);

  return {
    isOpen: isEmojiDrawerOpen,
    open: () => setEmojiDrawerOpen(true),
    close: () => setEmojiDrawerOpen(false),
    toggle: toggleEmojiDrawer,
  };
}
