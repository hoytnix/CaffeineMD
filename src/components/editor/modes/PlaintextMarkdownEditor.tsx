'use client';

import React, { useRef, useState, useMemo, useEffect, useLayoutEffect } from 'react';
import { Code, WrapText } from 'lucide-react';
import { useContextMenu } from '@/src/hooks/useContextMenu';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { PlaintextContextMenu, PlaintextSelectionInfo } from './PlaintextContextMenu';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface PlaintextMarkdownEditorProps {
  rawMarkdown: string;
  onMarkdownChange: (newContent: string) => void;
  onSaveTrigger: (content: string) => void;
  gutterRef?: React.RefObject<HTMLDivElement | null>;
  textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
}

export function PlaintextMarkdownEditor({
  rawMarkdown,
  onMarkdownChange,
  onSaveTrigger,
  gutterRef: externalGutterRef,
  textareaRef: externalTextareaRef,
}: PlaintextMarkdownEditorProps) {
  const internalGutterRef = useRef<HTMLDivElement>(null);
  const internalTextareaRef = useRef<HTMLTextAreaElement>(null);
  const mirrorRef = useRef<HTMLDivElement>(null);

  const [wordWrap, setWordWrap] = useState(true);
  const [lineHeights, setLineHeights] = useState<number[]>([]);
  const {
    isOpen: isContextMenuOpen,
    position: contextMenuPos,
    targetData: contextMenuSelection,
    openMenu: openContextMenu,
    closeMenu: closeContextMenu,
  } = useContextMenu<PlaintextSelectionInfo>();

  const gutterRef = externalGutterRef || internalGutterRef;
  const textareaRef = externalTextareaRef || internalTextareaRef;

  const { theme, customThemeColors, editorFontFamily } = useWorkspaceStore();
  const isMono =
    editorFontFamily === 'mono' ||
    (theme === 'custom' && (customThemeColors?.fontFamily === 'JetBrains Mono' || customThemeColors?.fontFamily?.includes('JetBrains Mono')));
  const isSerif =
    editorFontFamily === 'serif' ||
    (theme === 'custom' && (customThemeColors?.fontFamily === 'Merriweather' || customThemeColors?.fontFamily?.includes('Merriweather')));

  const effectiveFontFamily = isMono
    ? 'var(--font-mono)'
    : isSerif
    ? 'Georgia, Cambria, "Times New Roman", Times, serif'
    : (editorFontFamily === 'sans' ? 'var(--theme-font-family, var(--font-sans))' : 'var(--font-mono)');
  const fontClass = isMono ? 'font-mono' : isSerif ? 'font-serif' : '';

  const lines = useMemo(() => rawMarkdown.split('\n'), [rawMarkdown]);

  useIsomorphicLayoutEffect(() => {
    if (!wordWrap) {
      setLineHeights([]);
      return;
    }

    const textarea = textareaRef.current;
    const mirror = mirrorRef.current;
    if (!textarea || !mirror) return;

    const updateHeights = () => {
      mirror.style.width = `${textarea.clientWidth}px`;
      const children = mirror.children;
      const heights: number[] = [];
      for (let i = 0; i < children.length; i++) {
        heights.push((children[i] as HTMLElement).offsetHeight || 28);
      }
      setLineHeights(heights);
    };

    updateHeights();

    const observer = new ResizeObserver(() => {
      updateHeights();
    });
    observer.observe(textarea);

    return () => observer.disconnect();
  }, [rawMarkdown, wordWrap, textareaRef]);

  // Jump to specific line/offset on custom event (e.g., from Document Outline HUD)
  useEffect(() => {
    const handleScrollToLine = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const textarea = textareaRef.current;
      if (!textarea || !detail) return;

      textarea.focus();

      if (typeof detail.offset === 'number') {
        textarea.selectionStart = detail.offset;
        textarea.selectionEnd = detail.offset + (detail.text?.length || 0);
      }

      if (typeof detail.line === 'number') {
        const lineIdx = detail.line - 1;
        let targetTop = 0;
        if (lineHeights.length > lineIdx && lineHeights[lineIdx]) {
          targetTop = lineHeights.slice(0, lineIdx).reduce((acc, h) => acc + h, 0);
        } else {
          targetTop = lineIdx * 28;
        }
        textarea.scrollTo({ top: Math.max(0, targetTop - 30), behavior: 'smooth' });
        if (gutterRef.current) {
          gutterRef.current.scrollTo({ top: Math.max(0, targetTop - 30), behavior: 'smooth' });
        }
      }
    };

    window.addEventListener('caffeinemd:scroll-to-line', handleScrollToLine);
    return () => window.removeEventListener('caffeinemd:scroll-to-line', handleScrollToLine);
  }, [lineHeights, textareaRef, gutterRef]);

  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  };

  const handleGutterWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop += e.deltaY;
    }
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    if (e.key === 'Tab') {
      e.preventDefault();
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;

      if (e.shiftKey) {
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        if (value.slice(lineStart, lineStart + 2) === '  ') {
          const newValue = value.slice(0, lineStart) + value.slice(lineStart + 2);
          onMarkdownChange(newValue);
          setTimeout(() => {
            textarea.selectionStart = Math.max(start - 2, lineStart);
            textarea.selectionEnd = Math.max(end - 2, lineStart);
          }, 0);
        }
      } else {
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onMarkdownChange(newValue);
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        }, 0);
      }
    }
  };

  const insertMarkdownSnippet = (snippet: string, cursorOffset?: number) => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const currentVal = textarea.value;

    const newVal = currentVal.substring(0, start) + snippet + currentVal.substring(end);
    onMarkdownChange(newVal);

    setTimeout(() => {
      textarea.focus();
      const newPos = cursorOffset !== undefined ? start + cursorOffset : start + snippet.length;
      textarea.selectionStart = textarea.selectionEnd = newPos;
    }, 0);

    onSaveTrigger(newVal);
  };

  return (
    <div className="flex flex-col space-y-2 sm:space-y-4">
      {/* Plaintext Subheader & Markdown Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 pb-2 sm:pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--card)] border border-[var(--border)] text-[11px] font-mono text-[var(--foreground)]">
            <Code className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Plaintext Mode (Raw Markdown)</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-2">
            <span>{rawMarkdown.split('\n').length} lines</span>
            <span>·</span>
            <span>{rawMarkdown.length} chars</span>
          </div>
        </div>

        {/* Quick Syntax Chips & Wrap Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => setWordWrap(!wordWrap)}
            className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer flex items-center gap-1 ${
              wordWrap
                ? 'bg-[var(--accent)]/15 border-[var(--accent)] text-[var(--accent)]'
                : 'bg-[var(--card)] border-[var(--border)] text-neutral-400 hover:text-[var(--foreground)]'
            }`}
            title={wordWrap ? 'Word wrap is ON (Click to disable)' : 'Word wrap is OFF (Click to enable)'}
          >
            <WrapText className="w-3 h-3" />
            <span>Wrap: {wordWrap ? 'On' : 'Off'}</span>
          </button>
          {[
            { label: '[[WikiLink]]', snippet: '[[', offset: 2, title: 'Insert WikiLink [[Target]]', highlight: true },
            { label: '# H1', snippet: '# ', title: 'Insert Heading' },
            { label: '## H2', snippet: '## ', title: 'Insert Subheading' },
            { label: '- [ ] Task', snippet: '- [ ] ', title: 'Insert Task Checkbox' },
            { label: '**Bold**', snippet: '**bold**', offset: 6, title: 'Insert Bold Text' },
            { label: '`Code`', snippet: '`code`', offset: 5, title: 'Insert Inline Code' },
            { label: '> Quote', snippet: '> ', title: 'Insert Quote' },
          ].map((chip) => (
            <button
              key={chip.label}
              type="button"
              onClick={() => insertMarkdownSnippet(chip.snippet, chip.offset)}
              className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer ${
                chip.highlight
                  ? 'bg-[var(--card)] border-[var(--border)] text-neutral-400 hover:text-[var(--accent)] hover:border-[var(--accent)]'
                  : 'bg-[var(--card)] border-[var(--border)] text-neutral-400 hover:text-[var(--foreground)] hover:border-[var(--border)]'
              }`}
              title={chip.title}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Line Numbered Raw Markdown Editor */}
      <div
        className="relative flex rounded-xl border border-[var(--border)] overflow-hidden shadow-2xs backdrop-blur-md focus-within:border-[var(--accent)] transition-colors h-[550px] sm:h-[680px] max-h-[calc(100vh-220px)] min-h-[350px] sm:min-h-[480px] bg-transparent"
      >
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          onWheel={handleGutterWheel}
          className="w-10 sm:w-11 select-none py-2.5 sm:py-4 pr-2 sm:pr-2.5 text-right font-mono text-[13px] leading-7 text-neutral-400 border-r border-[var(--border)] overflow-hidden shrink-0 h-full bg-[var(--bg-secondary)]/80 backdrop-blur-sm"
        >
          {lines.map((_, i) => (
            <div
              key={i}
              style={{ height: wordWrap && lineHeights[i] ? `${lineHeights[i]}px` : '28px' }}
              className="leading-7"
            >
              {i + 1}
            </div>
          ))}
        </div>

        {/* Raw Markdown Textarea */}
        <textarea
          ref={textareaRef}
          value={rawMarkdown}
          onChange={(e) => onMarkdownChange(e.target.value)}
          onScroll={handleScroll}
          onKeyDown={handleTextareaKeyDown}
          onContextMenu={(e) => {
            const el = textareaRef.current;
            const start = el?.selectionStart ?? 0;
            const end = el?.selectionEnd ?? 0;
            const text = start !== end ? rawMarkdown.substring(start, end) : '';
            openContextMenu(e, { start, end, text });
          }}
          placeholder="# Type raw markdown here (supports YAML frontmatter and [[WikiLinks]])..."
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          style={{ fontFamily: effectiveFontFamily }}
          className={`flex-1 w-full h-full resize-none overflow-y-auto py-2.5 sm:py-4 px-2.5 sm:px-4 text-[13px] leading-7 bg-transparent text-[var(--foreground)] placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none ${fontClass} ${
            wordWrap ? 'whitespace-pre-wrap break-words' : 'overflow-x-auto whitespace-pre'
          }`}
        />
      </div>

      {/* Offscreen Mirror to Measure Wrapped Line Heights */}
      <div
        ref={mirrorRef}
        aria-hidden="true"
        style={{ fontFamily: effectiveFontFamily }}
        className={`absolute -top-[99999px] -left-[99999px] invisible pointer-events-none text-[13px] leading-7 whitespace-pre-wrap break-words py-2.5 sm:py-4 px-2.5 sm:px-4 box-border ${fontClass}`}
      >
        {lines.map((line, i) => (
          <div key={i}>{line || '\u00A0'}</div>
        ))}
      </div>

      {/* Unified Glassmorphic Plaintext Context Menu */}
      <PlaintextContextMenu
        textareaRef={textareaRef}
        rawMarkdown={rawMarkdown}
        onMarkdownChange={onMarkdownChange}
        isOpen={isContextMenuOpen}
        onClose={closeContextMenu}
        position={contextMenuPos}
        selection={contextMenuSelection}
      />
    </div>
  );
}
