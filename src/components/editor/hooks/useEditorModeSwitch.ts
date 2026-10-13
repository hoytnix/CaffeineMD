'use client';

import { useEffect, useRef, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { VaultFile } from '@/src/lib/storage/db';
import {
  parseMarkdownContent,
  serializeMarkdownWithFrontmatter,
  markdownToEditorHtml,
  editorHtmlToMarkdown,
} from '@/src/lib/markdown/serializer';
import { useWorkspaceStore, EditorModeType } from '@/src/stores/workspaceStore';

export interface UseEditorModeSwitchProps {
  file: VaultFile | null;
  rawMarkdown: string;
  setRawMarkdown: (content: string) => void;
  editor?: Editor | null;
  onPersistRawMarkdown?: (content: string, file: VaultFile) => Promise<any> | void;
}

/**
 * useEditorModeSwitch
 * Manages mode switching transitions between rich-text (Tiptap), plaintext (raw markdown),
 * and git-style diff viewer, driven by global workspaceStore state.
 */
export function useEditorModeSwitch({
  file,
  rawMarkdown,
  setRawMarkdown,
  editor,
  onPersistRawMarkdown,
}: UseEditorModeSwitchProps) {
  const { editorMode, setEditorMode } = useWorkspaceStore();
  const prevModeRef = useRef<EditorModeType>(editorMode);
  const rawMarkdownRef = useRef(rawMarkdown);

  useEffect(() => {
    rawMarkdownRef.current = rawMarkdown;
  }, [rawMarkdown]);

  // React to editorMode changes from workspaceStore
  useEffect(() => {
    const prev = prevModeRef.current;
    if (prev === editorMode) return;
    prevModeRef.current = editorMode;

    if (prev === 'richtext' && (editorMode === 'plaintext' || editorMode === 'diff')) {
      // Transitioning FROM richtext TO plaintext or diff: serialize HTML to Markdown
      if (editor && !editor.isDestroyed && editor.schema) {
        try {
          const markdownBody = editorHtmlToMarkdown(editor.getHTML());
          const fullRaw = serializeMarkdownWithFrontmatter(markdownBody, file?.frontmatter || {});
          setRawMarkdown(fullRaw);
        } catch {
          if (file && file.content) setRawMarkdown(file.content);
        }
      } else if (file && !rawMarkdownRef.current) {
        setRawMarkdown(file.content || '');
      }
    } else if ((prev === 'plaintext' || prev === 'diff') && editorMode === 'richtext') {
      // Transitioning FROM plaintext or diff TO richtext: parse Markdown to HTML
      const currentRaw = rawMarkdownRef.current || file?.content || '';
      if (file) {
        try {
          const parsed = parseMarkdownContent(currentRaw, file.title);
          const html = markdownToEditorHtml(parsed.body);
          if (editor && !editor.isDestroyed && editor.schema) {
            editor.commands.setContent(html, { emitUpdate: false });
          }
          if (onPersistRawMarkdown) {
            onPersistRawMarkdown(currentRaw, file);
          }
        } catch (err) {
          console.warn('Error syncing to rich text:', err);
        }
      }
    }
  }, [editorMode, editor, file, setRawMarkdown, onPersistRawMarkdown]);

  const switchToPlaintext = useCallback(
    (currentEditor?: Editor | null) => {
      const activeEditor = currentEditor ?? editor;
      if (editorMode === 'richtext' && activeEditor && !activeEditor.isDestroyed && activeEditor.schema) {
        try {
          const markdownBody = editorHtmlToMarkdown(activeEditor.getHTML());
          const fullRaw = serializeMarkdownWithFrontmatter(markdownBody, file?.frontmatter || {});
          setRawMarkdown(fullRaw);
        } catch {
          if (file) setRawMarkdown(file.content || '');
        }
      } else if (file && !rawMarkdownRef.current) {
        setRawMarkdown(file.content || '');
      }
      setEditorMode('plaintext');
    },
    [editor, editorMode, file, setEditorMode, setRawMarkdown]
  );

  const switchToRichText = useCallback(
    (currentEditor?: Editor | null) => {
      const activeEditor = currentEditor ?? editor;
      const currentRaw = rawMarkdownRef.current || file?.content || '';
      if (file) {
        try {
          const parsed = parseMarkdownContent(currentRaw, file.title);
          const html = markdownToEditorHtml(parsed.body);
          if (activeEditor && !activeEditor.isDestroyed && activeEditor.schema) {
            activeEditor.commands.setContent(html, { emitUpdate: false });
          }
          if (onPersistRawMarkdown) {
            onPersistRawMarkdown(currentRaw, file);
          }
        } catch (err) {
          console.warn('Error syncing to rich text:', err);
        }
      }
      setEditorMode('richtext');
    },
    [editor, file, onPersistRawMarkdown, setEditorMode]
  );

  const switchToDiff = useCallback(
    (currentEditor?: Editor | null) => {
      const activeEditor = currentEditor ?? editor;
      if (editorMode === 'richtext' && activeEditor && !activeEditor.isDestroyed && activeEditor.schema) {
        try {
          const markdownBody = editorHtmlToMarkdown(activeEditor.getHTML());
          const fullRaw = serializeMarkdownWithFrontmatter(markdownBody, file?.frontmatter || {});
          setRawMarkdown(fullRaw);
        } catch {
          if (file) setRawMarkdown(file.content || '');
        }
      } else if (file && !rawMarkdownRef.current) {
        setRawMarkdown(file.content || '');
      }
      setEditorMode('diff');
    },
    [editor, editorMode, file, setEditorMode, setRawMarkdown]
  );

  return {
    editorMode,
    setEditorMode,
    switchToPlaintext,
    switchToRichText,
    switchToDiff,
  };
}

