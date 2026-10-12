'use client';

import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { VaultFile } from '@/src/lib/storage/db';
import {
  parseMarkdownContent,
  serializeMarkdownWithFrontmatter,
  markdownToEditorHtml,
  editorHtmlToMarkdown,
} from '@/src/lib/markdown/serializer';
import { autoDetectUnlabeledCodeBlocks } from '../config/editorDomHandlers';
import { EditorMode } from '../EditorHeader';

export interface UseEditorModeSwitchProps {
  file: VaultFile | null;
  rawMarkdown: string;
  setRawMarkdown: (content: string) => void;
}

/**
 * useEditorModeSwitch
 * Manages mode switching transitions between rich-text (Tiptap), plaintext (raw markdown),
 * and git-style diff viewer, ensuring lossless buffer transfer across representations.
 */
export function useEditorModeSwitch({
  file,
  rawMarkdown,
  setRawMarkdown,
}: UseEditorModeSwitchProps) {
  const [editorMode, setEditorMode] = useState<EditorMode>('rich');

  const switchToPlaintext = useCallback(
    (editor: Editor | null) => {
      if (editorMode === 'rich' && editor && !editor.isDestroyed && editor.schema) {
        try {
          const markdownBody = editorHtmlToMarkdown(editor.getHTML());
          const fullRaw = serializeMarkdownWithFrontmatter(markdownBody, file?.frontmatter || {});
          setRawMarkdown(fullRaw);
        } catch {
          if (file) setRawMarkdown(file.content || '');
        }
      } else if (file && !rawMarkdown) {
        setRawMarkdown(file.content || '');
      }
      setEditorMode('plain');
    },
    [editorMode, file, rawMarkdown, setRawMarkdown]
  );

  const switchToRichText = useCallback(
    (editor: Editor | null) => {
      if (file) {
        try {
          const parsed = parseMarkdownContent(rawMarkdown, file.title);
          const html = markdownToEditorHtml(parsed.body);
          if (editor && !editor.isDestroyed && editor.schema) {
            editor.commands.setContent(html, { emitUpdate: false });
            autoDetectUnlabeledCodeBlocks(editor);
          }
        } catch (err) {
          console.warn('Error syncing to rich text:', err);
        }
      }
      setEditorMode('rich');
    },
    [file, rawMarkdown]
  );

  const switchToDiff = useCallback(
    (editor: Editor | null) => {
      if (editorMode === 'rich' && editor && !editor.isDestroyed && editor.schema) {
        try {
          const markdownBody = editorHtmlToMarkdown(editor.getHTML());
          const fullRaw = serializeMarkdownWithFrontmatter(markdownBody, file?.frontmatter || {});
          setRawMarkdown(fullRaw);
        } catch {
          if (file) setRawMarkdown(file.content || '');
        }
      } else if (file && !rawMarkdown) {
        setRawMarkdown(file.content || '');
      }
      setEditorMode('diff');
    },
    [editorMode, file, setRawMarkdown]
  );

  return {
    editorMode,
    setEditorMode,
    switchToPlaintext,
    switchToRichText,
    switchToDiff,
  };
}
