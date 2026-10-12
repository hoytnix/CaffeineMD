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

const LIST_TYPES = [
  {
    id: 'bullet',
    label: 'Bullet List',
    icon: List,
    tag: '• UL',
    isActive: (e: Editor) => e.isActive('bulletList'),
    action: (c: any) => c.toggleBulletList().run(),
  },
  {
    id: 'ordered',
    label: 'Numbered List',
    icon: ListOrdered,
    tag: '1. OL',
    isActive: (e: Editor) => e.isActive('orderedList'),
    action: (c: any) => c.toggleOrderedList().run(),
  },
  {
    id: 'task',
    label: 'Task Checklist',
    icon: CheckSquare,
    tag: '[ ]',
    isActive: (e: Editor) => e.isActive('taskList'),
    action: (c: any) => c.toggleTaskList().run(),
  },
];

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
    savedSelectionRef,
    snapshotSelection,
  } = useToolbarPopover({
    editor,
    checkHasDragged,
    popoverWidth: 208,
  });

  const isAnyListActive =
    editor.isActive('bulletList') ||
    editor.isActive('orderedList') ||
    editor.isActive('taskList');

  const canOutdent =
    editor.can().liftListItem('listItem') || editor.can().liftListItem('taskItem');
  const canIndent =
    editor.can().sinkListItem('listItem') || editor.can().sinkListItem('taskItem');

  const applyListAction = (action: (chain: any) => void) => {
    if (!editor || editor.isDestroyed) return;
    const chain = editor.chain();
    if (savedSelectionRef.current) {
      chain.setTextSelection(savedSelectionRef.current);
    }
    action(chain);
    setIsOpen(false);
  };

  const handleSink = () => applyListAction((c) => {
    if (!c.sinkListItem('listItem').run()) c.sinkListItem('taskItem').run();
  });

  const handleLift = () => applyListAction((c) => {
    if (!c.liftListItem('listItem').run()) c.liftListItem('taskItem').run();
  });

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
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => e.stopPropagation()}
          style={popoverStyle}
          className={`w-52 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-1.5 flex flex-col gap-0.5 z-[9999] text-[var(--foreground)] ${animationClass}`}
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
            List Types
          </div>

          {LIST_TYPES.map(({ id, label, icon: Icon, tag, isActive, action }) => {
            const active = isActive(editor);
            return (
              <button
                key={id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  applyListAction(action);
                }}
                onClick={() => applyListAction(action)}
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

          <div className="my-1 border-t border-[var(--border)]" />

          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
            Indentation
          </div>

          {/* 4. Increase Indent */}
          <button
            type="button"
            disabled={!canIndent}
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (canIndent) handleSink();
            }}
            onClick={() => {
              if (canIndent) handleSink();
            }}
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
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onTouchEnd={(e) => {
              e.preventDefault();
              if (canOutdent) handleLift();
            }}
            onClick={() => {
              if (canOutdent) handleLift();
            }}
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
