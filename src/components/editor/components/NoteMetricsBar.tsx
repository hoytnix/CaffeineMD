'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Editor } from '@tiptap/react';
import { FRONTMATTER_REGEX } from '@/src/lib/markdown/frontmatter';

export interface NoteMetricsBarProps {
  editor?: Editor | null;
  rawMarkdown?: string;
  editorMode?: 'rich' | 'plain';
  fallbackContent?: string;
}

/**
 * NoteMetricsBar
 * Displays real-time document statistics (word count and estimated LLM token count)
 * positioned immediately above NOTE PROPERTIES.
 * Accurately updates live in both Rich Text (Tiptap) and Plaintext (Markdown) authoring modes.
 */
export function NoteMetricsBar({
  editor,
  rawMarkdown,
  editorMode = 'rich',
  fallbackContent = '',
}: NoteMetricsBarProps) {
  const [editorText, setEditorText] = useState('');

  // Subscribe to live Tiptap content updates in Rich Text mode
  useEffect(() => {
    if (!editor || editor.isDestroyed) {
      setEditorText('');
      return;
    }

    setEditorText(editor.getText() || '');

    const handleUpdate = () => {
      setEditorText(editor.getText() || '');
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor]);

  // Determine active text based on current authoring mode
  const activeText = useMemo(() => {
    if (editorMode === 'plain') {
      const plain = rawMarkdown !== undefined ? rawMarkdown : fallbackContent;
      return plain.replace(FRONTMATTER_REGEX, '');
    }

    if (editorText) return editorText;
    if (editor && !editor.isDestroyed) {
      const text = editor.getText();
      if (text) return text;
    }

    return fallbackContent.replace(FRONTMATTER_REGEX, '');
  }, [editorMode, rawMarkdown, editorText, editor, fallbackContent]);

  // Calculate words and LLM token estimation (~4 chars/token heuristic)
  const { wordCount, tokenCount, charCount } = useMemo(() => {
    const trimmed = activeText.trim();
    if (!trimmed) {
      return { wordCount: 0, tokenCount: 0, charCount: 0 };
    }

    const words = trimmed.split(/\s+/).filter(Boolean).length;
    // Standard LLM / GPT token estimation heuristic: ~4 characters per token
    const tokens = Math.max(1, Math.ceil(trimmed.length / 4));

    return {
      wordCount: words,
      tokenCount: tokens,
      charCount: activeText.length,
    };
  }, [activeText]);

  return (
    <div
      role="status"
      aria-label="Document word and token count"
      className="flex items-center gap-2.5 text-xs font-mono text-neutral-400 mb-2.5 px-1 select-none"
    >
      <div
        className="flex items-center gap-1.5"
        title={`${wordCount.toLocaleString()} total words written in note (${charCount.toLocaleString()} characters)`}
      >
        <span className="font-semibold text-[var(--foreground)]">{wordCount.toLocaleString()}</span>
        <span>words</span>
      </div>

      <span className="text-[var(--border)]">·</span>

      <div
        className="flex items-center gap-1.5"
        title={`Estimated ${tokenCount.toLocaleString()} LLM tokens (~4 characters per token)`}
      >
        <span className="font-semibold text-[var(--foreground)]">{tokenCount.toLocaleString()}</span>
        <span>tokens</span>
      </div>
    </div>
  );
}
