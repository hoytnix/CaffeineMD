'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { AlignLeft, ChevronRight, ChevronLeft, Bookmark } from 'lucide-react';

interface HeadingItem {
  id: string;
  level: number;
  text: string;
  index: number;
}

interface DocumentOutlineHudProps {
  editor: Editor | null;
  rawMarkdown?: string;
  editorMode: 'rich' | 'plain' | 'diff';
}

export function DocumentOutlineHud({
  editor,
  rawMarkdown = '',
  editorMode,
}: DocumentOutlineHudProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeHeadingIndex, setActiveHeadingIndex] = useState<number | null>(null);

  // Parse headings from rich text AST or raw markdown text
  const headings: HeadingItem[] = useMemo(() => {
    if (editorMode === 'rich' && editor && !editor.isDestroyed && editor.schema) {
      const items: HeadingItem[] = [];
      let idx = 0;
      editor.state.doc.descendants((node) => {
        if (node.type.name === 'heading') {
          const text = node.textContent.trim();
          if (text) {
            items.push({
              id: `heading-${idx}`,
              level: node.attrs.level || 1,
              text,
              index: idx++,
            });
          }
        }
      });
      return items;
    }

    if (editorMode === 'plain' || editorMode === 'diff') {
      const items: HeadingItem[] = [];
      const lines = rawMarkdown.split('\n');
      let idx = 0;
      for (const line of lines) {
        const match = line.match(/^(#{1,6})\s+(.+)$/);
        if (match) {
          items.push({
            id: `heading-${idx}`,
            level: match[1].length,
            text: match[2].trim(),
            index: idx++,
          });
        }
      }
      return items;
    }

    return [];
  }, [editor, rawMarkdown, editorMode]);

  // Track active heading on scroll
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      const headingDoms = document.querySelectorAll(
        '.caffeine-editor-content h1, .caffeine-editor-content h2, .caffeine-editor-content h3, .caffeine-editor-content h4, .caffeine-editor-content h5, .caffeine-editor-content h6'
      );
      if (headingDoms.length === 0) return;

      let currentIdx = 0;
      const scrollThreshold = 180;

      headingDoms.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        if (rect.top <= scrollThreshold) {
          currentIdx = i;
        }
      });

      setActiveHeadingIndex(currentIdx);
    };

    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, [headings]);

  const scrollToHeading = useCallback((index: number) => {
    const headingDoms = document.querySelectorAll(
      '.caffeine-editor-content h1, .caffeine-editor-content h2, .caffeine-editor-content h3, .caffeine-editor-content h4, .caffeine-editor-content h5, .caffeine-editor-content h6'
    );
    const target = headingDoms[index] as HTMLElement;
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveHeadingIndex(index);
    }
  }, []);

  if (headings.length === 0) return null;

  return (
    <aside
      aria-label="Document Outline"
      className="fixed left-4 top-20 z-20 flex items-start select-none group"
    >
      {/* Collapsed Toggle Pill */}
      {!isOpen ? (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          title="Open Document Outline (HUD)"
          className="p-2 rounded-xl bg-[var(--card)]/90 backdrop-blur-md border border-[var(--border)] shadow-md text-neutral-400 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all cursor-pointer flex items-center gap-1.5"
        >
          <AlignLeft className="w-4 h-4" />
          <span className="text-[11px] font-medium hidden sm:inline text-[var(--foreground)]">
            Outline ({headings.length})
          </span>
        </button>
      ) : (
        /* Expanded Floating Outline Panel */
        <div className="w-64 max-h-[calc(100vh-140px)] rounded-2xl bg-[var(--card)]/95 backdrop-blur-xl border border-[var(--border)] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-left-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b border-[var(--border)] bg-[var(--background)]/40">
            <div className="flex items-center gap-2 text-xs font-semibold text-[var(--foreground)]">
              <Bookmark className="w-3.5 h-3.5 text-[var(--accent)]" />
              <span>Document Outline</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10 transition-colors cursor-pointer"
              title="Close outline"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* Heading Items List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
            {headings.map((h, i) => {
              const isActive = activeHeadingIndex === i;
              const indent = (h.level - 1) * 12;

              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => scrollToHeading(i)}
                  style={{ paddingLeft: `${indent + 8}px` }}
                  className={`w-full text-left py-1.5 pr-2 rounded-lg truncate transition-all cursor-pointer flex items-center gap-2 ${
                    isActive
                      ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-semibold'
                      : 'text-neutral-500 dark:text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/5'
                  }`}
                  title={`H${h.level}: ${h.text}`}
                >
                  <span className={`text-[10px] font-mono shrink-0 opacity-60`}>
                    H{h.level}
                  </span>
                  <span className="truncate">{h.text}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </aside>
  );
}
