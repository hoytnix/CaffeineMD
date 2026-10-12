'use client';

import { useRef, useEffect, useMemo } from 'react';
import { useEditor, Editor } from '@tiptap/react';
import { VaultFile } from '@/src/lib/storage/db';
import {
  parseMarkdownContent,
  markdownToEditorHtml,
  editorHtmlToMarkdown,
} from '@/src/lib/markdown/serializer';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { getEditorExtensions, EditorExtensionCallbacks } from '../config/editorExtensions';
import { handleWikiLinkDomClick, autoDetectUnlabeledCodeBlocks } from '../config/editorDomHandlers';

export interface UseTiptapInitProps {
  filePath: string;
  file: VaultFile | null;
  callbacks: EditorExtensionCallbacks;
  activeWorkspaceId: string;
  openFileTab: (path: string, title?: string) => void;
  handleDrop: (view: any, event: DragEvent) => boolean;
  handlePaste: (view: any, event: ClipboardEvent) => boolean;
  onAutoSave: (markdown: string, file: VaultFile) => void;
}

/**
 * useTiptapInit
 * Encapsulates Tiptap v2 editor instance lifecycle, ProseMirror extensions,
 * DOM event handlers (WikiLinks, drag-drop, paste), and external note synchronization.
 */
export function useTiptapInit({
  filePath,
  file,
  callbacks,
  activeWorkspaceId,
  openFileTab,
  handleDrop,
  handlePaste,
  onAutoSave,
}: UseTiptapInitProps) {
  const { setActiveEditor } = useWorkspaceStore();
  const loadedPathRef = useRef<string | null>(null);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const extensions = useMemo(() => getEditorExtensions(callbacks), [callbacks]);

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      editorProps: {
        attributes: {
          class:
            'focus:outline-none min-h-[280px] sm:min-h-[500px] text-[15px] leading-[1.8] text-neutral-800 dark:text-neutral-200 first:mt-0 [&>*:first-child]:mt-0',
        },
        handleDOMEvents: {
          click: (_view, event) =>
            handleWikiLinkDomClick(event, openFileTab, activeWorkspaceId || 'default-vault'),
          drop: handleDrop,
          paste: handlePaste,
        },
      },
      onUpdate: ({ editor: currentEditor }) => {
        if (!file || !currentEditor || currentEditor.isDestroyed || !currentEditor.schema) return;
        autoDetectUnlabeledCodeBlocks(currentEditor);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(() => {
          if (!currentEditor || currentEditor.isDestroyed || !currentEditor.schema) return;
          try {
            onAutoSave(editorHtmlToMarkdown(currentEditor.getHTML()), file);
          } catch (err) {
            console.warn('Auto-save skipped:', err);
          }
        }, 250);
      },
    },
    [filePath, handleDrop, handlePaste, extensions]
  );

  // Sync Note Content to Tiptap when file loads or switches
  // CRITICAL: Guard against re-injecting content when editor is focused to prevent Enter-key cursor jumping!
  useEffect(() => {
    if (!editor || editor.isDestroyed || !editor.schema || !file || file.isBinary) return;

    const isFileSwitch = loadedPathRef.current !== file.path;

    if (isFileSwitch) {
      try {
        const parsed = parseMarkdownContent(file.content || '', file.title);
        const editorHtml = markdownToEditorHtml(parsed.body);
        editor.commands.setContent(editorHtml);
        autoDetectUnlabeledCodeBlocks(editor);
        loadedPathRef.current = file.path;
      } catch (err) {
        console.warn('Failed to parse note markdown for editor:', err);
      }
      return;
    }

    // If currently focused and typing, NEVER overwrite document state from reactive local saves
    if (editor.isFocused) {
      return;
    }

    // Only update unfocused editor if significant external change occurred (e.g. sync reconciliation)
    try {
      const parsed = parseMarkdownContent(file.content || '', file.title);
      const editorHtml = markdownToEditorHtml(parsed.body);
      const currentHtml = editor.getHTML();
      if (currentHtml === '<p></p>' || Math.abs(currentHtml.length - editorHtml.length) > 10) {
        editor.commands.setContent(editorHtml);
        autoDetectUnlabeledCodeBlocks(editor);
      }
    } catch (err) {
      console.warn('Failed to parse note markdown for editor:', err);
    }
  }, [file, editor, filePath]);

  useEffect(() => {
    if (editor) setActiveEditor(editor);
    return () => setActiveEditor(null);
  }, [editor, setActiveEditor]);

  return {
    editor,
    extensions,
    loadedPathRef,
    saveTimeoutRef,
  };
}
