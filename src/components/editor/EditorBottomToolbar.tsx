'use client';

import React, { useRef } from 'react';
import { Editor } from '@tiptap/react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { HeadingSelectorPopover } from './toolbar/HeadingSelectorPopover';
import { TableControlsGroup } from './toolbar/TableControlsGroup';
import { ListFormattingGroup } from './toolbar/ListFormattingGroup';
import { MarkFormattingGroup } from './toolbar/MarkFormattingGroup';

export interface EditorBottomToolbarProps {
  editor: Editor | null;
}

export function EditorBottomToolbar({ editor }: EditorBottomToolbarProps) {
  const { showToast } = useWorkspaceStore();

  const containerRef = useRef<HTMLDivElement>(null);
  const isMouseDownRef = useRef(false);
  const mouseStartXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const hasDraggedDistRef = useRef(false);

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
      <MarkFormattingGroup
        editor={editor}
        onActionNotice={(msg) => showToast(msg)}
      />

      <div className="w-[1px] h-4 bg-[var(--border)] mx-0.5 shrink-0" />

      <HeadingSelectorPopover
        editor={editor}
        checkHasDragged={() => hasDraggedDistRef.current}
      />

      <div className="w-[1px] h-4 bg-[var(--border)] mx-0.5 shrink-0" />

      <ListFormattingGroup editor={editor} />

      <div className="w-[1px] h-4 bg-[var(--border)] mx-0.5 shrink-0" />

      <TableControlsGroup
        editor={editor}
        onActionNotice={(msg) => showToast(msg)}
      />
    </div>
  );
}
