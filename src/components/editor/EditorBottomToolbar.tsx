'use client';

import React, { useRef, useState } from 'react';
import { Editor } from '@tiptap/react';
import { Copy, Check, Minus, ClipboardPaste } from 'lucide-react';
import { editorHtmlToMarkdown } from '@/src/lib/markdown/serializer';
import { executeSmartPaste } from '@/src/lib/markdown/smartPaste';
import { useWorkspaceStore, ToolboxPosition } from '@/src/stores/workspaceStore';
import { StyleSelectorPopover } from './toolbar/StyleSelectorPopover';
import { HeadingSelectorPopover } from './toolbar/HeadingSelectorPopover';
import { ListFormattingGroup } from './toolbar/ListFormattingGroup';
import { MediaSelectorPopover } from './toolbar/MediaSelectorPopover';
import { TableControlsGroup } from './toolbar/TableControlsGroup';
import { HistorySelectorPopover } from './toolbar/HistorySelectorPopover';

export interface EditorBottomToolbarProps {
  editor: Editor | null;
  position?: ToolboxPosition;
}

export function EditorBottomToolbar({ editor, position }: EditorBottomToolbarProps) {
  const { showToast, toolboxPosition } = useWorkspaceStore();
  const resolvedPosition = position || toolboxPosition;
  const isVertical = resolvedPosition === 'left' || resolvedPosition === 'right';
  const [copiedRecently, setCopiedRecently] = useState(false);
  const [pastedLabel, setPastedLabel] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const mouseStartCoordRef = useRef(0);
  const scrollStartRef = useRef(0);
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

  const handleSmartPaste = async () => {
    if (!editor || hasDraggedDistRef.current) return;
    try {
      const res = await executeSmartPaste(editor);
      if (res.type !== 'empty') {
        setPastedLabel(res.label);
        showToast(`Pasted ${res.label}`);
        setTimeout(() => setPastedLabel(null), 1800);
      } else {
        showToast('Clipboard is empty');
      }
      editor.commands.focus();
    } catch (err) {
      console.warn('Failed to smart paste:', err);
      showToast('Clipboard access denied');
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !containerRef.current) return;
    isMouseDownRef.current = true;
    if (isVertical) {
      mouseStartCoordRef.current = e.pageY - containerRef.current.offsetTop;
      scrollStartRef.current = containerRef.current.scrollTop;
    } else {
      mouseStartCoordRef.current = e.pageX - containerRef.current.offsetLeft;
      scrollStartRef.current = containerRef.current.scrollLeft;
    }
    hasDraggedDistRef.current = false;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isMouseDownRef.current || !containerRef.current) return;
    const current = isVertical
      ? e.pageY - containerRef.current.offsetTop
      : e.pageX - containerRef.current.offsetLeft;
    const walk = (current - mouseStartCoordRef.current) * 1.5;
    if (Math.abs(walk) > 10) {
      hasDraggedDistRef.current = true;
    }
    if (isVertical) {
      containerRef.current.scrollTop = scrollStartRef.current - walk;
    } else {
      containerRef.current.scrollLeft = scrollStartRef.current - walk;
    }
  };

  const handleMouseUp = () => {
    isMouseDownRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    if (isVertical) {
      containerRef.current.scrollTop += e.deltaY;
    } else if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
      containerRef.current.scrollLeft += e.deltaY;
    }
  };

  if (!editor) return null;

  const containerClasses = isVertical
    ? 'w-fit max-h-[calc(100vh-10rem)] overflow-y-auto scrollbar-none no-scrollbar py-2 px-1.5 rounded-2xl bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] shadow-xl flex flex-col items-center gap-1.5 select-none transition-all cursor-grab active:cursor-grabbing shrink-0'
    : resolvedPosition === 'top'
    ? 'mx-auto w-fit max-w-[calc(100%-2rem)] sm:max-w-2xl overflow-x-auto scrollbar-none no-scrollbar py-1 px-3 rounded-2xl bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] shadow-xl flex items-center gap-1.5 select-none transition-all cursor-grab active:cursor-grabbing shrink-0'
    : 'sticky bottom-6 z-30 mx-auto w-fit max-w-[calc(100%-2rem)] sm:max-w-2xl overflow-x-auto scrollbar-none no-scrollbar py-1 px-3 rounded-2xl bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] shadow-xl flex items-center gap-1.5 select-none transition-all cursor-grab active:cursor-grabbing shrink-0';

  const btnClass = (active: boolean) =>
    `p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] shrink-0 ${
      active
        ? 'bg-emerald-500/20 text-emerald-400 font-medium'
        : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
    }`;

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
      className={containerClasses}
    >
      <button
        type="button"
        onClick={handleCopyAll}
        onMouseDown={(e) => e.stopPropagation()}
        title="Copy All as Markdown"
        className={btnClass(copiedRecently)}
      >
        {copiedRecently ? (
          <Check className="w-4 h-4 shrink-0 stroke-[2]" />
        ) : (
          <Copy className="w-4 h-4 shrink-0 stroke-[2]" />
        )}
      </button>

      <button
        type="button"
        onClick={handleSmartPaste}
        onMouseDown={(e) => e.stopPropagation()}
        className={btnClass(!!pastedLabel)}
        title={pastedLabel ? `Pasted ${pastedLabel}!` : 'Smart Paste (Auto-detect CSV, JSON, Markdown, Code, Link, or Image)'}
      >
        {pastedLabel ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ClipboardPaste className="w-3.5 h-3.5" />}
      </button>

      <div className="w-px h-4 bg-slate-800 mx-0.5 shrink-0" />

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
        orientation={isVertical ? 'vertical' : 'horizontal'}
      />

      <HistorySelectorPopover
        editor={editor}
        checkHasDragged={() => hasDraggedDistRef.current}
        onActionNotice={(msg) => showToast(msg)}
      />
    </div>
  );
}
