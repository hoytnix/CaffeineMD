'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { useNotePersistence } from '@/src/hooks/useNotePersistence';
import {
  parseMarkdownContent,
  serializeMarkdownWithFrontmatter,
  markdownToEditorHtml,
  editorHtmlToMarkdown,
} from '@/src/lib/markdown/serializer';
import { autoDetectUnlabeledCodeBlocks } from '../config/editorDomHandlers';
import { useEditorModeSwitch } from './useEditorModeSwitch';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';

export interface UseEditorAutosaveProps {
  filePath: string;
}

/**
 * useEditorAutosave
 * Coordinates configurable interval autosaving, debounced note persistence,
 * immediate flushes on note switch / tab close, dirty tracking, and seamless mode switching.
 */
export function useEditorAutosave({ filePath }: UseEditorAutosaveProps) {
  const { autosaveInterval = 300000 } = useWorkspaceStore();

  const {
    file, setFile, title, setTitle, isSaving, saveSuccess, loading,
    rawMarkdown, setRawMarkdown, handleSave: persistRichMarkdown,
    handleSaveRaw: persistRawMarkdown, updateProperties,
  } = useNotePersistence({ filePath });

  const {
    editorMode, setEditorMode, switchToPlaintext, switchToRichText, switchToDiff,
  } = useEditorModeSwitch({ file, rawMarkdown, setRawMarkdown });

  const [isDirty, setIsDirty] = useState(false);

  const fileRef = useRef(file);
  fileRef.current = file;

  const isDirtyRef = useRef(false);
  const dirtyContentRef = useRef<{ mode: 'rich' | 'plain'; content: string } | null>(null);
  const dirtyStartTimeRef = useRef<number | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronous flush helper for unmount, note switch, and tab close
  const flushImmediateDirty = useCallback(() => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    if (isDirtyRef.current && dirtyContentRef.current && fileRef.current) {
      const currentFile = fileRef.current;
      const pending = dirtyContentRef.current;
      isDirtyRef.current = false;
      dirtyContentRef.current = null;
      dirtyStartTimeRef.current = null;
      if (pending.mode === 'rich') {
        persistRichMarkdown(pending.content, currentFile);
      } else {
        persistRawMarkdown(pending.content, currentFile);
      }
    }
  }, [persistRichMarkdown, persistRawMarkdown]);

  // Background timer flush helper
  const flushPendingSave = useCallback(async () => {
    if (autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
    }
    dirtyStartTimeRef.current = null;

    if (!isDirtyRef.current || !dirtyContentRef.current || !fileRef.current) {
      setIsDirty(false);
      return;
    }

    const currentFile = fileRef.current;
    const pending = dirtyContentRef.current;
    isDirtyRef.current = false;
    dirtyContentRef.current = null;
    setIsDirty(false);

    try {
      if (pending.mode === 'rich') {
        await persistRichMarkdown(pending.content, currentFile);
      } else {
        await persistRawMarkdown(pending.content, currentFile);
      }
    } catch (err) {
      console.warn('Flush autosave failed:', err);
    }
  }, [persistRichMarkdown, persistRawMarkdown]);

  // Unified scheduler for rich and plain text autosaves
  const triggerAutosave = useCallback(
    (mode: 'rich' | 'plain', content: string, currentFile?: typeof file) => {
      const targetFile = currentFile || file;
      if (!targetFile) return;

      isDirtyRef.current = true;
      setIsDirty(true);
      dirtyContentRef.current = { mode, content };

      const fullRaw =
        mode === 'rich'
          ? serializeMarkdownWithFrontmatter(content, targetFile.frontmatter || {})
          : content;
      setRawMarkdown(fullRaw);

      if (autosaveInterval === 0) {
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
          autosaveTimerRef.current = null;
        }
        dirtyStartTimeRef.current = null;
        return;
      }

      if (!dirtyStartTimeRef.current) {
        dirtyStartTimeRef.current = Date.now();
      }
      const elapsed = Date.now() - dirtyStartTimeRef.current;
      const remaining = Math.max(autosaveInterval - elapsed, 0);

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      autosaveTimerRef.current = setTimeout(() => {
        dirtyStartTimeRef.current = null;
        flushPendingSave();
      }, Math.min(autosaveInterval, remaining));
    },
    [file, autosaveInterval, flushPendingSave, setRawMarkdown]
  );

  const scheduleAutosave = useCallback(
    (body: string, currentFile?: typeof file) => triggerAutosave('rich', body, currentFile),
    [triggerAutosave]
  );

  const scheduleAutosaveRaw = useCallback(
    (raw: string, currentFile?: typeof file) => triggerAutosave('plain', raw, currentFile),
    [triggerAutosave]
  );

  // Immediate flush on note switch, unmount, or tab close
  useEffect(() => {
    window.addEventListener('beforeunload', flushImmediateDirty);
    return () => {
      window.removeEventListener('beforeunload', flushImmediateDirty);
      flushImmediateDirty();
    };
  }, [filePath, flushImmediateDirty]);

  // Handle settings changes to autosaveInterval
  useEffect(() => {
    if (autosaveInterval === 0 && autosaveTimerRef.current) {
      clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
      dirtyStartTimeRef.current = null;
    }
  }, [autosaveInterval]);

  const handleRevert = useCallback(
    (editor: Editor | null) => {
      if (!file) return;
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
      dirtyStartTimeRef.current = null;
      isDirtyRef.current = false;
      dirtyContentRef.current = null;
      setIsDirty(false);

      const baseline = file.content || '';
      setRawMarkdown(baseline);
      setTitle(file.title);
      if (editor && !editor.isDestroyed && editor.schema) {
        try {
          const parsed = parseMarkdownContent(baseline, file.title);
          editor.commands.setContent(markdownToEditorHtml(parsed.body), { emitUpdate: false });
          autoDetectUnlabeledCodeBlocks(editor);
        } catch (err) {
          console.warn('Error reverting editor:', err);
        }
      }
    },
    [file, setRawMarkdown, setTitle]
  );

  const handleManualSave = useCallback(
    async (editor: Editor | null) => {
      if (autosaveTimerRef.current) clearTimeout(autosaveTimerRef.current);
      autosaveTimerRef.current = null;
      dirtyStartTimeRef.current = null;
      isDirtyRef.current = false;
      dirtyContentRef.current = null;
      setIsDirty(false);

      if (editorMode === 'plain' || editorMode === 'diff') {
        if (file) await persistRawMarkdown(rawMarkdown, file);
      } else if (editor && !editor.isDestroyed && editor.schema && file) {
        await persistRichMarkdown(editorHtmlToMarkdown(editor.getHTML()), file);
      }
    },
    [editorMode, file, persistRichMarkdown, persistRawMarkdown, rawMarkdown]
  );

  // Setup Cmd+S / Ctrl+S global save shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editorMode === 'plain' || editorMode === 'diff') {
          if (file) handleManualSave(null);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editorMode, file, handleManualSave]);

  return {
    file, setFile, title, setTitle, isSaving, saveSuccess, loading,
    rawMarkdown, setRawMarkdown, editorMode, setEditorMode,
    handleSave: scheduleAutosave, handleSaveRaw: scheduleAutosaveRaw,
    scheduleAutosave, scheduleAutosaveRaw, flushPendingSave,
    isDirty, autosaveInterval, updateProperties, saveTimeoutRef: autosaveTimerRef,
    switchToPlaintext, switchToRichText, switchToDiff, handleRevert, handleManualSave,
  };
}
