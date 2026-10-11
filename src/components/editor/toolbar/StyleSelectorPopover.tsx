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
  action: (editor: Editor) => void;
}

const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'bold',
    label: 'Bold',
    icon: Bold,
    tag: '⌘B',
    isActive: (editor) => editor.isActive('bold'),
    action: (editor) => editor.chain().focus().toggleBold().run(),
  },
  {
    id: 'italic',
    label: 'Italic',
    icon: Italic,
    tag: '⌘I',
    isActive: (editor) => editor.isActive('italic'),
    action: (editor) => editor.chain().focus().toggleItalic().run(),
  },
  {
    id: 'underline',
    label: 'Underline',
    icon: UnderlineIcon,
    tag: '⌘U',
    isActive: (editor) => editor.isActive('underline'),
    action: (editor) => {
      if ((editor.commands as any).toggleUnderline) {
        (editor.chain().focus() as any).toggleUnderline().run();
      }
    },
  },
  {
    id: 'strike',
    label: 'Strikethrough',
    icon: Strikethrough,
    tag: '⌘⇧X',
    isActive: (editor) => editor.isActive('strike'),
    action: (editor) => editor.chain().focus().toggleStrike().run(),
  },
];

export function StyleSelectorPopover({
  editor,
  checkHasDragged,
}: StyleSelectorPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ bottom: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setCoords({
        bottom: window.innerHeight - rect.top + 8,
        left: rect.left + rect.width / 2,
      });
    }
  };

  const toggleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (checkHasDragged?.()) return;

    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current && !menuRef.current.contains(target) &&
        buttonRef.current && !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

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
        onMouseDown={(e) => e.stopPropagation()}
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

      {isOpen && coords && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          onMouseDown={(e) => e.stopPropagation()}
          style={{
            position: 'fixed',
            bottom: `${coords.bottom}px`,
            left: `${coords.left}px`,
            transform: 'translateX(-50%)',
          }}
          className="w-48 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-1.5 flex flex-col gap-0.5 z-[9999] text-[var(--foreground)] animate-in fade-in slide-in-from-bottom-2"
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
                onClick={() => {
                  action(editor);
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
