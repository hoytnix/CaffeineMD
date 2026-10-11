'use client';

import React, { useMemo, useSyncExternalStore } from 'react';
import { Editor } from '@tiptap/react';
import { FRONTMATTER_REGEX } from '@/src/lib/markdown/frontmatter';

export interface NoteMetricsBarProps {
  editor?: Editor | null;
  rawMarkdown?: string;
  editorMode?: 'rich' | 'plain';
  fallbackContent?: string;
}

const EMOJI_REGEX =
  /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|[\uD83C\uDFFB-\uD83C\uDFFF])*/gu;

/**
 * Extracts links (Markdown, WikiLinks, HTML anchors, and bare URLs) from text.
 * Ignores fenced code blocks and inline code spans.
 */
function extractLinksFromText(rawText: string): number {
  if (!rawText) return 0;
  const clean = rawText.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]+`/g, '');
  let count = 0;

  // 1. HTML anchor tags
  const htmlMatches = clean.match(/<a\s+[^>]*href=/gi);
  if (htmlMatches) count += htmlMatches.length;
  let remaining = clean.replace(/<a\s+[^>]*>[\s\S]*?<\/a>/gi, '');

  // 2. WikiLinks [[target]] or [[target|alias]]
  const wikiMatches = remaining.match(/\[\[(.*?)\]\]/g);
  if (wikiMatches) count += wikiMatches.length;
  remaining = remaining.replace(/\[\[(.*?)\]\]/g, '');

  // 3. Markdown links [text](url)
  const mdMatches = remaining.match(/\[(.*?)\]\((.*?)\)/g);
  if (mdMatches) count += mdMatches.length;
  remaining = remaining.replace(/\[(.*?)\]\((.*?)\)/g, '');

  // 4. Standalone raw URLs
  const rawUrls = remaining.match(/https?:\/\/[^\s<>)"]+/gi);
  if (rawUrls) count += rawUrls.length;

  return count;
}

/**
 * NoteMetricsBar
 * Displays real-time document statistics (words, chars, tokens, emojis, links, KB)
 * positioned immediately above NOTE PROPERTIES across Rich Text and Plaintext modes.
 */
export function NoteMetricsBar({
  editor,
  rawMarkdown,
  editorMode = 'rich',
  fallbackContent = '',
}: NoteMetricsBarProps) {
  // Subscribe to live Tiptap content updates in Rich Text mode
  const editorText = useSyncExternalStore(
    (onStoreChange) => {
      if (!editor || editor.isDestroyed) return () => {};
      editor.on('update', onStoreChange);
      return () => {
        editor.off('update', onStoreChange);
      };
    },
    () => {
      if (!editor || editor.isDestroyed) return '';
      return editor.getText() || '';
    },
    () => ''
  );

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

  // Calculate words, characters, LLM token estimation, and emojis
  const { wordCount, tokenCount, charCount, emojiCount } = useMemo(() => {
    const trimmed = activeText.trim();
    if (!trimmed) {
      return { wordCount: 0, tokenCount: 0, charCount: 0, emojiCount: 0 };
    }
    const words = trimmed.split(/\s+/).filter(Boolean).length;
    const tokens = Math.max(1, Math.ceil(trimmed.length / 4));
    const chars = activeText.length;
    const emojiMatches = activeText.match(EMOJI_REGEX);
    return {
      wordCount: words,
      tokenCount: tokens,
      charCount: chars,
      emojiCount: emojiMatches ? emojiMatches.length : 0,
    };
  }, [activeText]);

  // Calculate link count (WikiLinks, Markdown links, HTML anchors, and raw URLs)
  const linkCount = useMemo(() => {
    if (editorMode === 'rich' && editor && !editor.isDestroyed) {
      let count = 0;
      try {
        editor.state.doc.descendants((node) => {
          if (node.type.name === 'codeBlock') return false;
          if (node.type.name === 'wikiLink') {
            count++;
          } else if (node.isText) {
            if (node.marks?.some((m) => m.type.name === 'link')) {
              count++;
            } else if (node.text) {
              const urls = node.text.match(/https?:\/\/[^\s<>)"]+/gi);
              if (urls) count += urls.length;
            }
          }
        });
        return count;
      } catch {
        return extractLinksFromText(activeText);
      }
    }
    return extractLinksFromText(activeText);
  }, [editorMode, editor, activeText]);

  // Calculate byte count and formatted Kilobytes (KB)
  const { byteCount, kbDisplay } = useMemo(() => {
    const content =
      editorMode === 'plain'
        ? rawMarkdown !== undefined
          ? rawMarkdown
          : fallbackContent
        : activeText || fallbackContent;

    if (!content) return { byteCount: 0, kbDisplay: '0' };
    const bytes = new TextEncoder().encode(content).length;
    const kbVal = bytes / 1024;
    const kbStr =
      bytes === 0 ? '0' : kbVal < 0.1 ? (bytes / 1024).toFixed(2) : (bytes / 1024).toFixed(1);
    return { byteCount: bytes, kbDisplay: kbStr };
  }, [editorMode, rawMarkdown, fallbackContent, activeText]);

  const metrics = [
    {
      id: 'words',
      value: wordCount.toLocaleString(),
      label: wordCount === 1 ? 'word' : 'words',
      title: `${wordCount.toLocaleString()} total words`,
    },
    {
      id: 'chars',
      value: charCount.toLocaleString(),
      label: charCount === 1 ? 'char' : 'chars',
      title: `${charCount.toLocaleString()} total characters`,
    },
    {
      id: 'tokens',
      value: tokenCount.toLocaleString(),
      label: tokenCount === 1 ? 'token' : 'tokens',
      title: `Estimated ${tokenCount.toLocaleString()} LLM tokens (~4 characters per token)`,
    },
    {
      id: 'emojis',
      value: emojiCount.toLocaleString(),
      label: emojiCount === 1 ? 'emoji' : 'emojis',
      title: `${emojiCount.toLocaleString()} total emojis`,
    },
    {
      id: 'links',
      value: linkCount.toLocaleString(),
      label: linkCount === 1 ? 'link' : 'links',
      title: `${linkCount.toLocaleString()} links & WikiLinks`,
    },
    {
      id: 'kb',
      value: kbDisplay,
      label: 'KB',
      title: `${byteCount.toLocaleString()} bytes (${kbDisplay} KB)`,
    },
  ];

  return (
    <div
      role="status"
      aria-label="Document statistics"
      className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs font-mono text-neutral-400 mb-2.5 px-1 select-none"
    >
      {metrics.map((m, idx) => (
        <React.Fragment key={m.id}>
          {idx > 0 && <span className="text-[var(--border)]">·</span>}
          <div className="flex items-center gap-1.5" title={m.title}>
            <span className="font-semibold text-[var(--foreground)]">{m.value}</span>
            <span>{m.label}</span>
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}
