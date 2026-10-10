'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { GripVertical, Trash2, Copy, Heading1, Heading2, List, CheckSquare } from 'lucide-react';

interface BlockHandleProps {
  editor: Editor | null;
}

export function BlockHandle({ editor }: BlockHandleProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [handlePosition, setHandlePosition] = useState<{ top: number; left: number } | null>(null);
  const [targetPos, setTargetPos] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editor || editor.isDestroyed || !editor.view || !editor.schema) return;

    const dom = editor.view.dom;

    const handleMouseMove = (event: MouseEvent) => {
      // Find the block under mouse
      const target = document.elementFromPoint(event.clientX, event.clientY);
      if (!target || !dom.contains(target)) {
        if (!menuOpen) {
          // If mouse is not near handle, hide
          const handleEl = containerRef.current;
          if (handleEl && !handleEl.contains(target)) {
            // Keep handle visible if close enough
            const rect = handleEl.getBoundingClientRect();
            const dist = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
            if (dist > 50) {
              setHandlePosition(null);
            }
          }
        }
        return;
      }

      // Find top-level block inside editor view
      let blockEl: HTMLElement | null = target as HTMLElement;
      while (blockEl && blockEl.parentElement !== dom) {
        blockEl = blockEl.parentElement;
      }

      if (blockEl && blockEl !== dom) {
        const editorRect = dom.getBoundingClientRect();
        const blockRect = blockEl.getBoundingClientRect();

        // Calculate position inside editor container
        const top = blockRect.top;
        const left = editorRect.left - 28;

        setHandlePosition({ top, left });

        try {
          const pos = editor.view.posAtDOM(blockEl, 0);
          setTargetPos(pos);
        } catch {
          // ignore boundary error
        }
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [editor, menuOpen]);

  if (!editor || editor.isDestroyed || !editor.view || !editor.schema || !handlePosition) return null;

  const handleDuplicate = () => {
    if (!editor || editor.isDestroyed || !editor.view || !editor.schema || targetPos === null) return;
    try {
      const { state } = editor.view;
      const resolvedPos = state.doc.resolve(targetPos);
      const node = resolvedPos.nodeAfter || resolvedPos.parent;
      if (node) {
        editor.commands.insertContentAt(resolvedPos.pos + (node.nodeSize || 0), node.toJSON());
      }
    } catch (err) {
      console.warn('Duplicate block failed:', err);
    }
    setMenuOpen(false);
  };

  const handleDelete = () => {
    if (!editor || editor.isDestroyed || !editor.view || !editor.schema || targetPos === null) return;
    try {
      const { state } = editor.view;
      const resolvedPos = state.doc.resolve(targetPos);
      const node = resolvedPos.nodeAfter || resolvedPos.parent;
      if (node) {
        editor.commands.deleteRange({
          from: resolvedPos.pos,
          to: resolvedPos.pos + (node.nodeSize || 1),
        });
      }
    } catch (err) {
      console.warn('Delete block failed:', err);
    }
    setMenuOpen(false);
    setHandlePosition(null);
  };

  const transformBlock = (type: string, attrs = {}) => {
    if (!editor || editor.isDestroyed || !editor.view || !editor.schema || targetPos === null) return;
    try {
      editor.commands.setTextSelection(targetPos);
      if (type === 'heading') {
        editor.commands.setHeading(attrs as any);
      } else if (type === 'bulletList') {
        editor.commands.toggleBulletList();
      } else if (type === 'taskList') {
        editor.commands.toggleTaskList();
      }
    } catch (err) {
      console.warn('Transform block failed:', err);
    }
    setMenuOpen(false);
  };

  return (
    <div
      ref={containerRef}
      style={{
        top: `${handlePosition.top}px`,
        left: `${handlePosition.left}px`,
        position: 'fixed',
      }}
      className="z-30 flex items-center select-none"
    >
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-1 rounded text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-grab active:cursor-grabbing"
          title="Drag to reorder or click for block options"
        >
          <GripVertical className="w-4 h-4" />
        </button>

        {menuOpen && (
          <div className="absolute left-6 top-0 w-44 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl py-1 text-xs text-neutral-800 dark:text-neutral-200 z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-2.5 py-1 text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
              Turn into
            </div>
            <button
              onClick={() => transformBlock('heading', { level: 1 })}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <Heading1 className="w-3.5 h-3.5 text-neutral-500" />
              <span>Heading 1</span>
            </button>
            <button
              onClick={() => transformBlock('heading', { level: 2 })}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <Heading2 className="w-3.5 h-3.5 text-neutral-500" />
              <span>Heading 2</span>
            </button>
            <button
              onClick={() => transformBlock('bulletList')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <List className="w-3.5 h-3.5 text-neutral-500" />
              <span>Bullet List</span>
            </button>
            <button
              onClick={() => transformBlock('taskList')}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <CheckSquare className="w-3.5 h-3.5 text-neutral-500" />
              <span>Task List</span>
            </button>

            <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

            <button
              onClick={handleDuplicate}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-left"
            >
              <Copy className="w-3.5 h-3.5 text-neutral-500" />
              <span>Duplicate</span>
            </button>
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors text-left"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete block</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
