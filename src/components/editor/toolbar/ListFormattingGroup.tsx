'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import {
  List,
  ChevronDown,
  ListOrdered,
  CheckSquare,
  Outdent,
  Indent,
} from 'lucide-react';

export interface ListFormattingGroupProps {
  editor: Editor;
  checkHasDragged?: () => boolean;
}

import { useToolbarPopover } from './useToolbarPopover';

export function ListFormattingGroup({
  editor,
  checkHasDragged,
}: ListFormattingGroupProps) {
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
    popoverWidth: 208,
  });

  const isBulletActive = editor.isActive('bulletList');
  const isOrderedActive = editor.isActive('orderedList');
  const isTaskActive = editor.isActive('taskList');
  const isAnyListActive = isBulletActive || isOrderedActive || isTaskActive;

  const canOutdent =
    editor.can().liftListItem('listItem') || editor.can().liftListItem('taskItem');
  const canIndent =
    editor.can().sinkListItem('listItem') || editor.can().sinkListItem('taskItem');

  const handleToggleBulletList = () => {
    editor.chain().focus().toggleBulletList().run();
    setIsOpen(false);
  };

  const handleToggleOrderedList = () => {
    editor.chain().focus().toggleOrderedList().run();
    setIsOpen(false);
  };

  const handleToggleTaskList = () => {
    editor.chain().focus().toggleTaskList().run();
    setIsOpen(false);
  };

  const handleOutdent = () => {
    const liftedList = editor.chain().focus().liftListItem('listItem').run();
    if (!liftedList) {
      editor.chain().focus().liftListItem('taskItem').run();
    }
    setIsOpen(false);
  };

  const handleIndent = () => {
    const sinkList = editor.chain().focus().sinkListItem('listItem').run();
    if (!sinkList) {
      editor.chain().focus().sinkListItem('taskItem').run();
    }
    setIsOpen(false);
  };

  return (
    <div className="relative flex items-center shrink-0 rounded-lg">
      <button
        ref={buttonRef}
        type="button"
        onMouseDown={(e) => e.stopPropagation()}
        onClick={toggleOpen}
        title="List Options (Bullets, Numbers, Tasks, Indent)"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`p-1 px-1.5 rounded-lg transition-all flex items-center gap-0.5 justify-center cursor-pointer min-w-[34px] h-[26px] ${
          isAnyListActive || isOpen
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <List className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
        <ChevronDown className="w-2.5 h-2.5 opacity-70 pointer-events-none" />
      </button>

      {isOpen && popoverStyle && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          onMouseDown={(e) => e.stopPropagation()}
          style={popoverStyle}
          className={`w-52 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-1.5 flex flex-col gap-0.5 z-[9999] text-[var(--foreground)] ${animationClass}`}
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
            List Types
          </div>

          {/* 1. Bullet List */}
          <button
            type="button"
            onClick={handleToggleBulletList}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left w-full ${
              isBulletActive
                ? 'bg-[var(--accent)] text-white font-semibold'
                : 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <List className="w-3.5 h-3.5 shrink-0" />
              <span>Bullet List</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                isBulletActive
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60'
              }`}
            >
              • UL
            </span>
          </button>

          {/* 2. Numbered List */}
          <button
            type="button"
            onClick={handleToggleOrderedList}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left w-full ${
              isOrderedActive
                ? 'bg-[var(--accent)] text-white font-semibold'
                : 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <ListOrdered className="w-3.5 h-3.5 shrink-0" />
              <span>Numbered List</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                isOrderedActive
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60'
              }`}
            >
              1. OL
            </span>
          </button>

          {/* 3. Task Checklist */}
          <button
            type="button"
            onClick={handleToggleTaskList}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left w-full ${
              isTaskActive
                ? 'bg-[var(--accent)] text-white font-semibold'
                : 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <CheckSquare className="w-3.5 h-3.5 shrink-0" />
              <span>Task Checklist</span>
            </div>
            <span
              className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                isTaskActive
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60'
              }`}
            >
              [ ]
            </span>
          </button>

          <div className="my-1 border-t border-[var(--border)]" />

          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
            Indentation
          </div>

          {/* 4. Increase Indent */}
          <button
            type="button"
            disabled={!canIndent}
            onClick={handleIndent}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left w-full ${
              canIndent
                ? 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)] cursor-pointer'
                : 'opacity-40 cursor-not-allowed text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Indent className="w-3.5 h-3.5 shrink-0" />
              <span>Indent List</span>
            </div>
            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60">
              Tab
            </span>
          </button>

          {/* 5. Decrease Indent */}
          <button
            type="button"
            disabled={!canOutdent}
            onClick={handleOutdent}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors text-left w-full ${
              canOutdent
                ? 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)] cursor-pointer'
                : 'opacity-40 cursor-not-allowed text-neutral-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Outdent className="w-3.5 h-3.5 shrink-0" />
              <span>Unindent List</span>
            </div>
            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60">
              ⇧Tab
            </span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
