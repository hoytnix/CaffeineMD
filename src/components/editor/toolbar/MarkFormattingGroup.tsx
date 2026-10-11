'use client';

import React, { useState } from 'react';
import { Editor } from '@tiptap/react';
import {
  Copy,
  Check,
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  SquareCode,
  Quote,
  Link as LinkIcon,
  Minus,
  Undo,
  Redo,
} from 'lucide-react';
import { editorHtmlToMarkdown } from '@/src/lib/markdown/serializer';

export interface MarkFormattingGroupProps {
  editor: Editor;
  onActionNotice?: (msg: string) => void;
}

export function MarkFormattingGroup({ editor, onActionNotice }: MarkFormattingGroupProps) {
  const [copiedRecently, setCopiedRecently] = useState(false);

  const handleCopyAll = () => {
    try {
      const html = editor.getHTML();
      const markdown = editorHtmlToMarkdown(html);
      navigator.clipboard.writeText(markdown || editor.getText());
      setCopiedRecently(true);
      setTimeout(() => setCopiedRecently(false), 2000);
      onActionNotice?.('Copied note to clipboard');
    } catch (err) {
      console.warn('Failed to copy note:', err);
    }
  };

  const handleInsertLink = () => {
    const url = window.prompt('Enter link URL (or note title for WikiLink):');
    if (url) {
      if (url.startsWith('http://') || url.startsWith('https://')) {
        editor.chain().focus().setLink?.({ href: url }).run();
      } else {
        editor.chain().focus().insertContent(`[[${url}]]`).run();
      }
    }
  };

  return (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={handleCopyAll}
        title="Copy All as Markdown"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          copiedRecently
            ? 'bg-emerald-500/20 text-emerald-400 font-medium'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        {copiedRecently ? (
          <Check className="w-4 h-4 shrink-0 stroke-[2]" />
        ) : (
          <Copy className="w-4 h-4 shrink-0 stroke-[2]" />
        )}
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold (⌘B)"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          editor.isActive('bold')
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <Bold className="w-4 h-4 shrink-0 stroke-[2]" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic (⌘I)"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          editor.isActive('italic')
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <Italic className="w-4 h-4 shrink-0 stroke-[2]" />
      </button>

      <button
        type="button"
        onClick={() => {
          if ((editor.commands as any).toggleUnderline) {
            (editor.chain().focus() as any).toggleUnderline().run();
          }
        }}
        title="Underline (⌘U)"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          editor.isActive('underline')
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <UnderlineIcon className="w-4 h-4 shrink-0 stroke-[2]" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          editor.isActive('strike')
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <Strikethrough className="w-4 h-4 shrink-0 stroke-[2]" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Inline Code"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          editor.isActive('code')
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <Code className="w-4 h-4 shrink-0 stroke-[2]" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        title="Code Block"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          editor.isActive('codeBlock')
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <SquareCode className="w-4 h-4 shrink-0 stroke-[2]" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        title="Blockquote"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          editor.isActive('blockquote')
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <Quote className="w-4 h-4 shrink-0 stroke-[2]" />
      </button>

      <button
        type="button"
        onClick={handleInsertLink}
        title="Insert Link or WikiLink"
        className={`p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] ${
          editor.isActive('link')
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <LinkIcon className="w-4 h-4 shrink-0 stroke-[2]" />
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Divider"
        className="p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60"
      >
        <Minus className="w-4 h-4 shrink-0 stroke-[2]" />
      </button>

      <button
        type="button"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
        title="Undo (⌘Z)"
        className="p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Undo className="w-4 h-4 shrink-0 stroke-[2]" />
      </button>

      <button
        type="button"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
        title="Redo (⌘⇧Z)"
        className="p-1 px-2 rounded-lg transition-all flex items-center justify-center cursor-pointer min-w-[26px] h-[26px] text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <Redo className="w-4 h-4 shrink-0 stroke-[2]" />
      </button>
    </div>
  );
}
