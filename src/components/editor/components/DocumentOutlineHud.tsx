'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { ListTree, X } from 'lucide-react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';

export interface HeadingItem {
  id: string;
  level: number;
  text: string;
  index: number;
  pos?: number;
  line?: number;
  offset?: number;
}

export interface DocumentOutlineHudProps {
  editor: Editor | null;
  rawMarkdown?: string;
  editorMode?: 'richtext' | 'plaintext' | 'split' | 'diff' | 'rich' | 'plain';
}

export function DocumentOutlineHud({
  editor,
  rawMarkdown = '',
  editorMode = 'richtext',
}: DocumentOutlineHudProps) {
  const {
    outlineHudOpen,
    isOutlineOpen,
    setOutlineHudOpen,
    setIsOutlineOpen,
    focusMode,
    isFocusMode,
  } = useWorkspaceStore();

  const isOpen = (outlineHudOpen ?? isOutlineOpen) || false;
  const isFocused = (focusMode ?? isFocusMode) || false;

  const [activeHeadingIndex, setActiveHeadingIndex] = useState<number | null>(null);
  const [editorVersion, setEditorVersion] = useState(0);

  // Synchronize on editor updates and selection changes
  useEffect(() => {
    if (!editor || editor.isDestroyed) return;

    const handleDocUpdate = () => {
      setEditorVersion((v) => v + 1);
    };

    editor.on('update', handleDocUpdate);
    editor.on('selectionUpdate', handleDocUpdate);

    return () => {
      editor.off('update', handleDocUpdate);
      editor.off('selectionUpdate', handleDocUpdate);
    };
  }, [editor]);

  const isPlainMode =
    editorMode === 'plaintext' ||
    editorMode === 'plain' ||
    editorMode === 'diff' ||
    (!editor && !!rawMarkdown);

  // Dual-mode heading extraction: AST traversal in Rich Text, RegEx in Plaintext
  const headings: HeadingItem[] = useMemo(() => {
    // Reference editorVersion so heading hierarchy re-synchronizes on document changes
    if (editorVersion < 0) return [];

    // 1. Plaintext / Diff mode or raw markdown fallback
    if (isPlainMode) {
      if (!rawMarkdown) return [];

      const items: HeadingItem[] = [];
      const lines = rawMarkdown.split('\n');
      let inCodeBlock = false;
      let charOffset = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Toggle code block fence detection
        if (trimmed.startsWith('```') || trimmed.startsWith('~~~')) {
          inCodeBlock = !inCodeBlock;
          charOffset += line.length + 1;
          continue;
        }

        if (!inCodeBlock) {
          const match = line.match(/^(#{1,6})\s+(.+)$/);
          if (match) {
            items.push({
              id: `heading-plain-${items.length}`,
              level: match[1].length,
              text: match[2].trim(),
              index: items.length,
              line: i + 1,
              offset: charOffset,
            });
          }
        }

        charOffset += line.length + 1;
      }

      return items;
    }

    // 2. Rich Text / Split mode: Traverse Tiptap ProseMirror document AST
    if (editor && !editor.isDestroyed && editor.schema) {
      const items: HeadingItem[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading') {
          const text = node.textContent.trim();
          if (text) {
            items.push({
              id: `heading-rich-${items.length}`,
              level: node.attrs.level || 1,
              text,
              index: items.length,
              pos,
            });
          }
        }
      });
      return items;
    }

    return [];
  }, [editor, rawMarkdown, isPlainMode, editorVersion]);

  // Track active heading on scroll or selection
  useEffect(() => {
    if (headings.length === 0) return;

    const handleScroll = () => {
      if (isPlainMode) {
        const textarea = document.querySelector<HTMLTextAreaElement>('textarea');
        if (!textarea) return;
        const totalLines = Math.max(textarea.value.split('\n').length, 1);
        const currentLine = Math.floor((textarea.scrollTop / Math.max(textarea.scrollHeight, 1)) * totalLines) + 1;
        let activeIdx = 0;
        headings.forEach((h, i) => {
          if (h.line && h.line <= currentLine + 2) {
            activeIdx = i;
          }
        });
        setActiveHeadingIndex(activeIdx);
        return;
      }

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
  }, [headings, isPlainMode]);

  // Jump to heading in either Rich Text or Plaintext mode
  const handleHeadingClick = useCallback(
    (h: HeadingItem) => {
      setActiveHeadingIndex(h.index);

      // Plaintext Navigation: Dispatch custom event & set textarea cursor/scroll
      if (isPlainMode) {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('caffeinemd:scroll-to-line', {
              detail: { line: h.line, offset: h.offset, text: h.text },
            })
          );
        }

        const textarea = document.querySelector<HTMLTextAreaElement>('textarea');
        if (textarea) {
          textarea.focus();
          if (typeof h.offset === 'number') {
            textarea.selectionStart = h.offset;
            textarea.selectionEnd = h.offset + (h.text?.length || 0);
          }
          if (typeof h.line === 'number') {
            const totalLines = Math.max(textarea.value.split('\n').length, 1);
            const lineFraction = (h.line - 1) / totalLines;
            textarea.scrollTo({
              top: lineFraction * textarea.scrollHeight,
              behavior: 'smooth',
            });
          }
        }
        return;
      }

      // Rich Text Navigation: Focus editor position and smoothly scroll DOM node
      if (editor && !editor.isDestroyed && typeof h.pos === 'number') {
        try {
          editor.commands.focus(h.pos + 1);
        } catch {
          // Fallback if position boundary is tight
        }
      }

      const headingDoms = document.querySelectorAll(
        '.caffeine-editor-content h1, .caffeine-editor-content h2, .caffeine-editor-content h3, .caffeine-editor-content h4, .caffeine-editor-content h5, .caffeine-editor-content h6'
      );
      const target = headingDoms[h.index] as HTMLElement | undefined;
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    },
    [isPlainMode, editor]
  );

  const handleClose = useCallback(() => {
    if (setOutlineHudOpen) setOutlineHudOpen(false);
    if (setIsOutlineOpen) setIsOutlineOpen(false);
  }, [setOutlineHudOpen, setIsOutlineOpen]);

  // Only hide when outline is toggled off or focus mode is active
  if (!isOpen || isFocused) return null;

  return (
    <aside
      aria-label="Document Outline"
      className="flex flex-col w-60 border-l border-slate-800/60 bg-slate-950/60 backdrop-blur-md shrink-0 select-none overflow-hidden z-20 animate-in fade-in slide-in-from-right-2 duration-150"
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-slate-800/60 bg-slate-900/40 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <ListTree className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
          <span className="text-xs font-semibold text-[var(--foreground)] truncate">
            Document Outline
          </span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[var(--accent)]/15 text-[var(--accent)] shrink-0">
            {headings.length}
          </span>
        </div>
        <button
          type="button"
          onClick={handleClose}
          className="p-1 rounded-md text-neutral-400 hover:text-[var(--foreground)] hover:bg-white/5 transition-colors cursor-pointer shrink-0"
          title="Close Document Outline"
          aria-label="Close Document Outline"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content: Heading Hierarchy or Clean Empty State */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5 text-xs">
        {headings.length === 0 ? (
          <div className="h-full min-h-[160px] flex flex-col items-center justify-center p-4 text-center">
            <ListTree className="w-8 h-8 mb-2 text-neutral-500 opacity-40 stroke-[1.5]" />
            <p className="text-xs font-medium text-neutral-300 mb-1">
              No headings in this note yet
            </p>
            <p className="text-[11px] leading-relaxed text-neutral-400">
              Add <code className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-neutral-300"># H1</code>,{' '}
              <code className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-neutral-300">## H2</code>, or{' '}
              <code className="px-1 py-0.5 rounded bg-slate-800 text-[10px] text-neutral-300">### H3</code> to build an outline.
            </p>
          </div>
        ) : (
          headings.map((h, i) => {
            const isActive = activeHeadingIndex === i;
            const indent = Math.min((h.level - 1) * 10, 40);

            return (
              <button
                key={h.id}
                type="button"
                onClick={() => handleHeadingClick(h)}
                style={{ paddingLeft: `${indent + 8}px` }}
                className={`w-full text-left py-1.5 pr-2 rounded-lg truncate transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-[var(--accent)]/15 text-[var(--accent)] font-semibold'
                    : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-white/5'
                }`}
                title={`H${h.level}: ${h.text}`}
              >
                <span className="text-[10px] font-mono shrink-0 opacity-60">
                  H{h.level}
                </span>
                <span className="truncate">{h.text}</span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
}
