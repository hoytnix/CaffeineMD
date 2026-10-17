'use client';

import { useEffect, RefObject } from 'react';
import { Editor } from '@tiptap/react';

export interface UseTypewriterScrollProps {
  editor: Editor | null;
  isTypewriterScrolling: boolean;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
}

/**
 * Keeps the active ProseMirror cursor vertically centered inside the scroll container
 * when Typewriter Scrolling mode is enabled.
 */
export function useTypewriterScroll({
  editor,
  isTypewriterScrolling,
  scrollContainerRef,
}: UseTypewriterScrollProps) {
  useEffect(() => {
    if (!isTypewriterScrolling || !editor || editor.isDestroyed) return;

    const handleSelectionUpdate = () => {
      const container = scrollContainerRef.current;
      if (!container) return;

      try {
        const { from } = editor.state.selection;
        const coords = editor.view.coordsAtPos(from);
        const containerRect = container.getBoundingClientRect();
        const relativeTop = coords.top - containerRect.top;
        const targetScroll = container.scrollTop + relativeTop - containerRect.height / 2;

        container.scrollTo({
          top: targetScroll,
          behavior: 'smooth',
        });
      } catch {
        // Selection coords might not be computed yet during unmount
      }
    };

    editor.on('selectionUpdate', handleSelectionUpdate);
    return () => {
      editor.off('selectionUpdate', handleSelectionUpdate);
    };
  }, [editor, isTypewriterScrolling, scrollContainerRef]);
}
