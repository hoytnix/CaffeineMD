'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import {
  History,
  ChevronDown,
  Undo,
  Redo,
} from 'lucide-react';

export interface HistorySelectorPopoverProps {
  editor: Editor;
  checkHasDragged?: () => boolean;
  onActionNotice?: (msg: string) => void;
}

import { useToolbarPopover } from './useToolbarPopover';

export function HistorySelectorPopover({
  editor,
  checkHasDragged,
  onActionNotice,
}: HistorySelectorPopoverProps) {
  const {
    isOpen,
    setIsOpen,
    popoverStyle,
    buttonRef,
    menuRef,
    toggleOpen,
    animationClass,
  } = useToolbarPopover({
    checkHasDragged,
    popoverWidth: 192,
  });

  const canUndo = editor.can().undo();
  const canRedo = editor.can().redo();

  const handleUndo = () => {
    if (canUndo) {
      editor.chain().focus().undo().run();
      setIsOpen(false);
      onActionNotice?.('Undid change');
    }
  };

  const handleRedo = () => {
    if (canRedo) {
      editor.chain().focus().redo().run();
      setIsOpen(false);
      onActionNotice?.('Redid change');
    }
  };

  return (
    <div className="relative flex items-center shrink-0 rounded-lg">
      <button
        ref={buttonRef}
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={toggleOpen}
        title="History (Undo, Redo)"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`p-1 px-1.5 rounded-lg transition-all flex items-center gap-0.5 justify-center cursor-pointer min-w-[34px] h-[26px] ${
          isOpen
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <History className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
        <ChevronDown className="w-2.5 h-2.5 opacity-70 pointer-events-none" />
      </button>

      {isOpen && popoverStyle && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          onMouseDown={(e) => e.stopPropagation()}
          style={popoverStyle}
          className={`w-48 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-1.5 flex flex-col gap-0.5 z-[9999] text-[var(--foreground)] ${animationClass}`}
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
            Document History
          </div>

          {/* Undo */}
          <button
            type="button"
            disabled={!canUndo}
            onClick={handleUndo}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left w-full ${
              canUndo
                ? 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)] cursor-pointer'
                : 'opacity-40 cursor-not-allowed text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Undo className="w-3.5 h-3.5 shrink-0" />
              <span>Undo</span>
            </div>
            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60">
              ⌘Z
            </span>
          </button>

          {/* Redo */}
          <button
            type="button"
            disabled={!canRedo}
            onClick={handleRedo}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left w-full ${
              canRedo
                ? 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)] cursor-pointer'
                : 'opacity-40 cursor-not-allowed text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Redo className="w-3.5 h-3.5 shrink-0" />
              <span>Redo</span>
            </div>
            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60">
              ⌘⇧Z
            </span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
