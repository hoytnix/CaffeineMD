'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import {
  Type,
  ChevronDown,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
} from 'lucide-react';

import { useToolbarPopover } from './useToolbarPopover';

export interface StyleSelectorPopoverProps {
  editor: Editor;
  checkHasDragged?: () => boolean;
}

interface StyleOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  tag: string;
  isActive: (editor: Editor) => boolean;
  action: (editor: Editor, sel: { from: number; to: number } | null) => void;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'bold',
    label: 'Bold',
    icon: Bold,
    tag: '⌘B',
    isActive: (editor) => editor.isActive('bold'),
    action: (editor, sel) => {
      const chain = editor.chain();
      if (sel) chain.setTextSelection(sel);
      chain.toggleBold().run();
    },
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: Italic,
    tag: '⌘I',
    isActive: (editor) => editor.isActive('italic'),
    action: (editor, sel) => {
      const chain = editor.chain();
      if (sel) chain.setTextSelection(sel);
      chain.toggleItalic().run();
    },
  },
  {
    id: 'underline',
    label: 'Underline',
    icon: UnderlineIcon,
    tag: '⌘U',
    isActive: (editor) => editor.isActive('underline'),
    action: (editor, sel) => {
      if ((editor.commands as any).toggleUnderline) {
        const chain = editor.chain();
        if (sel) chain.setTextSelection(sel);
        (chain as any).toggleUnderline().run();
      }
    },
  },
  {
    id: 'strike',
    label: 'Strikethrough',
    icon: Strikethrough,
    tag: '⌘⇧X',
    isActive: (editor) => editor.isActive('strike'),
    action: (editor, sel) => {
      const chain = editor.chain();
      if (sel) chain.setTextSelection(sel);
      chain.toggleStrike().run();
    },
  },
];

export function StyleSelectorPopover({
  editor,
  checkHasDragged,
}: StyleSelectorPopoverProps) {
  const {
    isOpen,
    setIsOpen,
    popoverStyle,
    buttonRef,
    menuRef,
    toggleOpen,
    animationClass,
    savedSelectionRef,
    snapshotSelection,
  } = useToolbarPopover({
    editor,
    checkHasDragged,
    popoverWidth: 192,
  });

  const isAnyStyleActive =
    editor.isActive('bold') ||
    editor.isActive('italic') ||
    editor.isActive('underline') ||
    editor.isActive('strike');

  return (
    <div className="relative flex items-center shrink-0 rounded-lg">
      <button
        ref={buttonRef}
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          snapshotSelection();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          snapshotSelection();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          toggleOpen(e);
        }}
        onClick={toggleOpen}
        title="Style (Bold, Italic, Underline, Strikethrough)"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`p-1 px-1.5 rounded-lg transition-all flex items-center gap-0.5 justify-center cursor-pointer min-w-[34px] h-[26px] ${
          isAnyStyleActive || isOpen
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <Type className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
        <ChevronDown className="w-2.5 h-2.5 opacity-70 pointer-events-none" />
      </button>

      {isOpen && popoverStyle && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => e.stopPropagation()}
          style={popoverStyle}
          className={`w-48 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-1.5 flex flex-col gap-0.5 z-[9999] text-[var(--foreground)] ${animationClass}`}
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
            Text Style
          </div>

          {STYLE_OPTIONS.map(({ id, label, icon: Icon, tag, action, isActive }) => {
            const active = isActive(editor);
            return (
              <button
                key={id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  action(editor, savedSelectionRef.current);
                  setIsOpen(false);
                }}
                onClick={() => {
                  action(editor, savedSelectionRef.current);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left w-full ${
                  active
                    ? 'bg-[var(--accent)] text-white font-semibold'
                    : 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                </div>
                <span
                  className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                    active
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60'
                  }`}
                >
                  {tag}
                </span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </div>
  );
}
