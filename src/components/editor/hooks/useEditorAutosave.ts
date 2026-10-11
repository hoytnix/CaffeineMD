'use client';

import { useState, useCallback, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { useNotePersistence } from '@/src/hooks/useNotePersistence';
import {
  parseMarkdownContent,
  serializeMarkdownWithFrontmatter,
  markdownToEditorHtml,
  editorHtmlToMarkdown,
} from '@/src/lib/markdown/serializer';
import { autoDetectUnlabeledCodeBlocks } from '../config/editorDomHandlers';
import { EditorMode } from '../EditorHeader';

export interface UseEditorAutosaveProps {
  filePath: string;
}

/**
 * useEditorAutosave
 * Coordinates debounced note persistence, dirty checking against IndexedDB,
 * seamless mode switching between rich-text (Tiptap), plaintext, and diff viewer,
 * and keyboard save listeners (⌘S).
 */
export function useEditorAutosave({ filePath }: UseEditorAutosaveProps) {
  const {
    file,
    setFile,
    title,
    setTitle,
    isSaving,
    saveSuccess,
    loading,
    rawMarkdown,
    setRawMarkdown,
    handleSave,
    handleSaveRaw,
    updateProperties,
    saveTimeoutRef,
  } = useNotePersistence({ filePath });

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
            editor.commands.setContent(html);
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
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      if (editorMode === 'rich' && editor && !editor.isDestroyed && editor.schema) {
        try {
          const markdownBody = editorHtmlToMarkdown(editor.getHTML());
          const fullRaw = serializeMarkdownWithFrontmatter(markdownBody, file?.frontmatter || {});
          setRawMarkdown(fullRaw);
        } catch {
          if (file) setRawMarkdown(file.content || '');
        }
      }
      setEditorMode('diff');
    },
    [editorMode, file, setRawMarkdown, saveTimeoutRef]
  );

  const handleRevert = useCallback(
    (editor: Editor | null) => {
      if (!file) return;
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      const baseline = file.content || '';
      setRawMarkdown(baseline);
      setTitle(file.title);
      if (editor && !editor.isDestroyed && editor.schema) {
        try {
          const parsed = parseMarkdownContent(baseline, file.title);
          const html = markdownToEditorHtml(parsed.body);
          editor.commands.setContent(html);
          autoDetectUnlabeledCodeBlocks(editor);
        } catch (err) {
          console.warn('Error reverting editor:', err);
        }
      }
    },
    [file, setRawMarkdown, setTitle, saveTimeoutRef]
  );

  const handleManualSave = useCallback(
    (editor: Editor | null) => {
      if (editorMode === 'plain' || editorMode === 'diff') {
        if (file) handleSaveRaw(rawMarkdown, file);
      } else if (editor && !editor.isDestroyed && editor.schema && file) {
        handleSave(editorHtmlToMarkdown(editor.getHTML()), file);
      }
    },
    [editorMode, file, handleSave, handleSaveRaw, rawMarkdown]
  );

  // Setup Cmd+S / Ctrl+S global save shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editorMode === 'plain' || editorMode === 'diff') {
          if (file) handleSaveRaw(rawMarkdown, file);
        } else if (file) {
          // Handled via manual save
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorMode, file, handleSaveRaw, rawMarkdown]);

  return {
    file,
    setFile,
    title,
    setTitle,
    isSaving,
    saveSuccess,
    loading,
    rawMarkdown,
    setRawMarkdown,
    editorMode,
    setEditorMode,
    handleSave,
    handleSaveRaw,
    updateProperties,
    saveTimeoutRef,
    switchToPlaintext,
    switchToRichText,
    switchToDiff,
    handleRevert,
    handleManualSave,
  };
}
