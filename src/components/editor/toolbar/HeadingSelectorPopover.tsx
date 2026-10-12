'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import { Heading, ChevronDown } from 'lucide-react';

export interface HeadingSelectorPopoverProps {
  editor: Editor;
  checkHasDragged?: () => boolean;
}

const HEADING_LEVELS = [
  { level: 1 as const, label: 'Heading 1', tag: 'H1' },
  { level: 2 as const, label: 'Heading 2', tag: 'H2' },
  { level: 3 as const, label: 'Heading 3', tag: 'H3' },
  { level: 4 as const, label: 'Heading 4', tag: 'H4' },
  { level: 5 as const, label: 'Heading 5', tag: 'H5' },
  { level: 6 as const, label: 'Heading 6', tag: 'H6' },
];

import { useToolbarPopover } from './useToolbarPopover';

export function HeadingSelectorPopover({
  editor,
  checkHasDragged,
}: HeadingSelectorPopoverProps) {
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

  const isHeadingActive = editor.isActive('heading');

  const handleSelectHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    if (!editor || editor.isDestroyed) return;
    const chain = editor.chain();
    if (savedSelectionRef.current) {
      chain.setTextSelection(savedSelectionRef.current);
    }
    chain.toggleHeading({ level }).run();
    setIsOpen(false);
  };

  const handleSelectParagraph = () => {
    if (!editor || editor.isDestroyed) return;
    const chain = editor.chain();
    if (savedSelectionRef.current) {
      chain.setTextSelection(savedSelectionRef.current);
    }
    chain.setParagraph().run();
    setIsOpen(false);
  };

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
        title="Headings (H1–H6)"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`p-1 px-1.5 rounded-lg transition-all flex items-center gap-0.5 justify-center cursor-pointer min-w-[34px] h-[26px] ${
          isHeadingActive || isOpen
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <Heading className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
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
            Heading Levels
          </div>

          {HEADING_LEVELS.map(({ level, label, tag }) => {
            const isLevelActive = editor.isActive('heading', { level });
            return (
              <button
                key={level}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  handleSelectHeading(level);
                }}
                onClick={() => handleSelectHeading(level)}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left w-full ${
                  isLevelActive
                    ? 'bg-[var(--accent)] text-white font-semibold'
                    : 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)]'
                }`}
              >
                <span>{label}</span>
                <span
                  className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                    isLevelActive
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

          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onTouchStart={(e) => e.preventDefault()}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleSelectParagraph();
            }}
            onClick={handleSelectParagraph}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left w-full ${
              editor.isActive('paragraph')
                ? 'bg-[var(--accent)] text-white font-semibold'
                : 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)]'
            }`}
          >
            <span>Normal Text</span>
            <span
              className={`text-[10px] font-mono px-1 py-0.5 rounded ${
                editor.isActive('paragraph')
                  ? 'bg-white/20 text-white'
                  : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60'
              }`}
            >
              P
            </span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
