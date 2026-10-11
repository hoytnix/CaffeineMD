'use client';

import React, { useState, useEffect, useRef } from 'react';
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

export function HeadingSelectorPopover({
  editor,
  checkHasDragged,
}: HeadingSelectorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const isHeadingActive = editor.isActive('heading');

  const handleSelectHeading = (level: 1 | 2 | 3 | 4 | 5 | 6) => {
    editor.chain().focus().toggleHeading({ level }).run();
    setIsOpen(false);
  };

  const handleSelectParagraph = () => {
    editor.chain().focus().setParagraph().run();
    setIsOpen(false);
  };

  return (
    <div ref={menuRef} className="relative flex items-center shrink-0 rounded-lg">
      <button
        type="button"
        onClick={(e) => {
          if (checkHasDragged?.()) {
            e.stopPropagation();
            return;
          }
          setIsOpen((prev) => !prev);
        }}
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

      {isOpen && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-44 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-1.5 flex flex-col gap-0.5 z-50 text-[var(--foreground)] animate-in fade-in slide-in-from-bottom-2"
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
        </div>
      )}
    </div>
  );
}
