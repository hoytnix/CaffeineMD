'use client';

import React, { useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Copy, Check, Minus } from 'lucide-react';
import { editorHtmlToMarkdown } from '@/src/lib/markdown/serializer';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { StyleSelectorPopover } from './toolbar/StyleSelectorPopover';
import { HeadingSelectorPopover } from './toolbar/HeadingSelectorPopover';
import { ListFormattingGroup } from './toolbar/ListFormattingGroup';
import { MediaSelectorPopover } from './toolbar/MediaSelectorPopover';
import { TableControlsGroup } from './toolbar/TableControlsGroup';
import { HistorySelectorPopover } from './toolbar/HistorySelectorPopover';

export interface EditorBottomToolbarProps {
  editor: Editor | null;
}

export function EditorBottomToolbar({ editor }: EditorBottomToolbarProps) {
  const { showToast } = useWorkspaceStore();
  const [copiedRecently, setCopiedRecently] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const mouseStartXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedDistRef = useRef(false);

  const handleCopyAll = () => {
    if (!editor || hasDraggedDistRef.current) return;
    try {
      const html = editor.getHTML();
      const markdown = editorHtmlToMarkdown(html);
      navigator.clipboard.writeText(markdown || editor.getText());
      setCopiedRecently(true);
      setTimeout(() => setCopiedRecently(false), 2000);
      showToast('Copied note to clipboard');
    } catch (err) {
      console.warn('Failed to copy note:', err);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !containerRef.current) return;
    isMouseDownRef.current = true;
    mouseStartXRef.current = e.pageX - containerRef.current.offsetLeft;
    scrollLeftRef.current = containerRef.current.scrollLeft;
    hasDraggedDistRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !containerRef.current) return;
    const x = e.pageX - containerRef.current.offsetLeft;
    const walk = (x - mouseStartXRef.current) * 1.5;
    if (Math.abs(walk) > 10) {
      hasDraggedDistRef.current = true;
    }
    containerRef.current.scrollLeft = scrollLeftRef.current - walk;
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      containerRef.current.scrollLeft += e.deltaY;
    }
  };

  if (!editor) return null;

  return (
    <div
      ref={containerRef}
      role="toolbar"
      aria-label="Editor Formatting Toolbar"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="sticky bottom-6 z-30 mx-auto w-fit max-w-[calc(100%-2rem)] sm:max-w-2xl overflow-x-auto scrollbar-none no-scrollbar py-1 px-3 rounded-2xl bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] shadow-xl flex items-center gap-1.5 select-none transition-all cursor-grab active:cursor-grabbing shrink-0"
    >
      <button
        type="button"
        onClick={handleCopyAll}
        onMouseDown={(e) => e.stopPropagation()}
        title="Copy All as Markdown"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] shrink-0 ${
          copiedRecently
            ? 'bg-emerald-500/20 text-emerald-400 font-medium'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        {copiedRecently ? (
          <Check className="w-4 h-4 shrink-0 stroke-[2]" />
        ) : (
          <Copy className="w-4 h-4 shrink-0 stroke-[2]" />
        )}
      </button>

      <StyleSelectorPopover
        editor={editor}
        checkHasDragged={() => hasDraggedDistRef.current}
      />

      <HeadingSelectorPopover
        editor={editor}
        checkHasDragged={() => hasDraggedDistRef.current}
      />

      <ListFormattingGroup
        editor={editor}
        checkHasDragged={() => hasDraggedDistRef.current}
      />

      <MediaSelectorPopover
        editor={editor}
        checkHasDragged={() => hasDraggedDistRef.current}
        onActionNotice={(msg) => showToast(msg)}
      />

      <button
        type="button"
        onClick={() => {
          editor.chain().focus().setHorizontalRule().run();
          showToast('Divider added');
        }}
        onMouseDown={(e) => e.stopPropagation()}
        title="Divider"
        className="p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] shrink-0 text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60"
      >
        <Minus className="w-4 h-4 shrink-0 stroke-[2]" />
      </button>

      <TableControlsGroup
        editor={editor}
        onActionNotice={(msg) => showToast(msg)}
      />

      <HistorySelectorPopover
        editor={editor}
        checkHasDragged={() => hasDraggedDistRef.current}
        onActionNotice={(msg) => showToast(msg)}
      />
    </div>
  );
}
