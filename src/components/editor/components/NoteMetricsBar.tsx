'use client';

import React, { useMemo, useSyncExternalStore } from 'react';
import { Editor } from '@tiptap/react';
import { FRONTMATTER_REGEX } from '@/src/lib/markdown/frontmatter';

export interface NoteMetricsBarProps {
  editor?: Editor | null;
  rawMarkdown?: string;
  editorMode?: 'richtext' | 'plaintext' | 'diff' | 'rich' | 'plain';
  fallbackContent?: string;
}

const EMOJI_REGEX =
  /\p{Extended_Pictographic}(?:\uFE0F|\u200D\p{Extended_Pictographic}|[\uD83C\uDFFB-\uD83C\uDFFF])*/gu;

/**
 * Extracts links (Markdown, WikiLinks, HTML anchors, and bare URLs) from text.
 * Ignores fenced code blocks and inline code spans.
 */
function extractLinksFromText(rawText: string): { mdLinks: number; wikiLinks: number } {
  if (!rawText) return { mdLinks: 0, wikiLinks: 0 };
  const clean = rawText.replace(/```[\s\S]*?```/g, '').replace(/`[^`\n]+`/g, '');
  let mdLinks = 0;
  let wikiLinks = 0;

  // 1. HTML anchor tags
  const htmlMatches = clean.match(/<a\s+[^>]*href=/gi);
  if (htmlMatches) mdLinks += htmlMatches.length;
  let remaining = clean.replace(/<a\s+[^>]*>[\s\S]*?<\/a>/gi, '');

  // 2. WikiLinks [[target]] or [[target|alias]]
  const wikiMatches = remaining.match(/\[\[(.*?)\]\]/g);
  if (wikiMatches) wikiLinks += wikiMatches.length;
  remaining = remaining.replace(/\[\[(.*?)\]\]/g, '');

  // 3. Markdown links [text](url)
  const mdMatches = remaining.match(/\[(.*?)\]\((.*?)\)/g);
  if (mdMatches) mdLinks += mdMatches.length;
  remaining = remaining.replace(/\[(.*?)\]\((.*?)\)/g, '');

  // 4. Standalone raw URLs
  const rawUrls = remaining.match(/https?:\/\/[^\s<>)"]+/gi);
  if (rawUrls) mdLinks += rawUrls.length;

  return { mdLinks, wikiLinks };
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
    if (editorMode === 'plain' || editorMode === 'plaintext' || editorMode === 'diff') {
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

  // Calculate separate link counts (WikiLinks vs standard Markdown links & URLs)
  const { mdLinks, wikiLinks } = useMemo(() => {
    if (editorMode === 'rich' && editor && !editor.isDestroyed) {
      let md = 0;
      let wiki = 0;
      try {
        editor.state.doc.descendants((node) => {
          if (node.type.name === 'codeBlock') return false;
          if (node.type.name === 'wikiLink') {
            wiki++;
          } else if (node.isText) {
            if (node.marks?.some((m) => m.type.name === 'link')) {
              md++;
            } else if (node.text) {
              const urls = node.text.match(/https?:\/\/[^\s<>)"]+/gi);
              if (urls) md += urls.length;
            }
          }
        });
        return { mdLinks: md, wikiLinks: wiki };
      } catch {
        return extractLinksFromText(activeText);
      }
    }
    return extractLinksFromText(activeText);
  }, [editorMode, editor, activeText]);

  // Calculate byte count and formatted Kilobytes (KB)
  const { byteCount, kbDisplay } = useMemo(() => {
    const content =
      editorMode === 'plain' || editorMode === 'diff'
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

  const stats = useMemo(
    () => ({
      words: wordCount,
      chars: charCount,
      tokens: tokenCount,
      emojis: emojiCount,
      links: mdLinks,
      wikiLinks,
      kb: kbDisplay,
    }),
    [wordCount, charCount, tokenCount, emojiCount, mdLinks, wikiLinks, kbDisplay]
  );

  const metrics = [
    {
      id: 'words',
      value: stats.words.toLocaleString(),
      label: stats.words === 1 ? 'word' : 'words',
      title: `${stats.words.toLocaleString()} total words`,
    },
    {
      id: 'chars',
      value: stats.chars.toLocaleString(),
      label: stats.chars === 1 ? 'char' : 'chars',
      title: `${stats.chars.toLocaleString()} total characters`,
    },
    {
      id: 'tokens',
      value: stats.tokens.toLocaleString(),
      label: stats.tokens === 1 ? 'token' : 'tokens',
      title: `Estimated ${stats.tokens.toLocaleString()} LLM tokens (~4 characters per token)`,
    },
    {
      id: 'emojis',
      value: stats.emojis.toLocaleString(),
      label: stats.emojis === 1 ? 'emoji' : 'emojis',
      title: `${stats.emojis.toLocaleString()} total emojis`,
    },
    {
      id: 'links',
      customNode: (
        <span title="Markdown Links">
          <strong className="text-slate-400 font-semibold">{stats.links}</strong>{' '}
          {stats.links === 1 ? 'link' : 'links'}
        </span>
      ),
    },
    {
      id: 'wikilinks',
      customNode: (
        <span title="WikiLinks">
          <strong className="text-slate-400 font-semibold">{stats.wikiLinks}</strong>{' '}
          {stats.wikiLinks === 1 ? 'wikilink' : 'wikilinks'}
        </span>
      ),
    },
    {
      id: 'kb',
      value: stats.kb,
      label: 'KB',
      title: `${byteCount.toLocaleString()} bytes (${stats.kb} KB)`,
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
          {m.customNode ? (
            m.customNode
          ) : (
            <div className="flex items-center gap-1.5" title={m.title}>
              <span className="font-semibold text-[var(--foreground)]">{m.value}</span>
              <span>{m.label}</span>
            </div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
