'use client';

import React, { useRef } from 'react';
import { Code } from 'lucide-react';

interface PlaintextMarkdownEditorProps {
  rawMarkdown: string;
  onMarkdownChange: (newContent: string) => void;
  onSaveTrigger: (content: string) => void;
  gutterRef: React.RefObject<HTMLDivElement | null>;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}

export function PlaintextMarkdownEditor({
  rawMarkdown,
  onMarkdownChange,
  onSaveTrigger,
  gutterRef,
  textareaRef,
}: PlaintextMarkdownEditorProps) {
  const handleScroll = () => {
    if (textareaRef.current && gutterRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
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
    <div className="flex flex-col gap-4">
      {/* Plaintext Subheader & Markdown Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--card)] border border-[var(--border)] text-[11px] font-mono text-[var(--foreground)]">
            <Code className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Plaintext Mode (Raw Markdown)</span>
          </div>
          <div className="text-[11px] font-mono text-neutral-400 flex items-center gap-2">
            <span>{rawMarkdown.split('\n').length} lines</span>
            <span>·</span>
            <span>{rawMarkdown.trim() ? rawMarkdown.trim().split(/\s+/).length : 0} words</span>
            <span>·</span>
            <span>{rawMarkdown.length} chars</span>
          </div>
        </div>

        {/* Quick Syntax Chips */}
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('[[', 2)}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--card)] border border-[var(--border)] text-neutral-400 hover:text-[var(--accent)] hover:border-[var(--accent)] transition-colors cursor-pointer"
            title="Insert WikiLink [[Target]]"
          >
            [[WikiLink]]
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('# ')}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--card)] border border-[var(--border)] text-neutral-400 hover:text-[var(--foreground)] hover:border-[var(--border)] transition-colors cursor-pointer"
            title="Insert Heading"
          >
            # H1
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('## ')}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--card)] border border-[var(--border)] text-neutral-400 hover:text-[var(--foreground)] hover:border-[var(--border)] transition-colors cursor-pointer"
            title="Insert Subheading"
          >
            ## H2
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('- [ ] ')}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--card)] border border-[var(--border)] text-neutral-400 hover:text-[var(--foreground)] hover:border-[var(--border)] transition-colors cursor-pointer"
            title="Insert Task Checkbox"
          >
            - [ ] Task
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('**bold**', 6)}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--card)] border border-[var(--border)] text-neutral-400 hover:text-[var(--foreground)] hover:border-[var(--border)] transition-colors cursor-pointer"
            title="Insert Bold Text"
          >
            **Bold**
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('`code`', 5)}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--card)] border border-[var(--border)] text-neutral-400 hover:text-[var(--foreground)] hover:border-[var(--border)] transition-colors cursor-pointer"
            title="Insert Inline Code"
          >
            `Code`
          </button>
          <button
            type="button"
            onClick={() => insertMarkdownSnippet('> ')}
            className="px-2 py-0.5 rounded text-[11px] font-mono bg-[var(--card)] border border-[var(--border)] text-neutral-400 hover:text-[var(--foreground)] hover:border-[var(--border)] transition-colors cursor-pointer"
            title="Insert Quote"
          >
            &gt; Quote
          </button>
        </div>
      </div>

      {/* Line Numbered Raw Markdown Editor */}
      <div className="relative flex rounded-xl border border-[var(--border)] bg-[var(--card)]/60 overflow-hidden shadow-2xs focus-within:border-[var(--accent)] transition-colors">
        {/* Line Numbers Gutter */}
        <div
          ref={gutterRef}
          className="w-11 select-none py-4 pr-2.5 text-right font-mono text-[13px] leading-7 text-neutral-400 border-r border-[var(--border)] bg-[var(--card)] overflow-hidden shrink-0"
        >
          {rawMarkdown.split('\n').map((_, i) => (
            <div key={i} className="h-7">
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
          placeholder="# Type raw markdown here (supports YAML frontmatter and [[WikiLinks]])..."
          spellCheck={false}
          autoCapitalize="off"
          autoComplete="off"
          autoCorrect="off"
          className="flex-1 w-full resize-none p-4 font-mono text-[13.5px] leading-7 bg-transparent text-[var(--foreground)] placeholder-neutral-400 dark:placeholder-neutral-600 focus:outline-none min-h-[480px]"
        />
      </div>
    </div>
  );
}
