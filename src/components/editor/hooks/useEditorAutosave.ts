'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Editor } from '@tiptap/react';
import { useNotePersistence } from '@/src/hooks/useNotePersistence';
import {
  parseFrontmatter,
  serializeFrontmatter,
  markdownToEditorHtml,
  editorHtmlToMarkdown,
} from '@/src/lib/markdown/serializer';
import { useEditorModeSwitch } from './useEditorModeSwitch';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { VaultFile } from '@/src/lib/storage/db';

export interface UseEditorAutosaveProps {
  filePath: string;
  editor?: Editor | null;
}

function isContentEqual(a: string, b: string): boolean {
  if (a === b) return true;
  return a.replace(/\r\n/g, '\n').trim() === b.replace(/\r\n/g, '\n').trim();
}

/**
 * useEditorAutosave
 * Coordinates configurable interval autosaving, debounced note persistence,
 * immediate flushes on note switch / tab close, dirty tracking, and seamless mode switching.
 */
export function useEditorAutosave({ filePath, editor }: UseEditorAutosaveProps) {
  const { autosaveInterval = 300000 } = useWorkspaceStore();

  const {
    file, setFile, title, setTitle, isSaving, saveSuccess, loading,
    rawMarkdown, setRawMarkdown, handleSave: persistRichMarkdown,
    handleSaveRaw: persistRawMarkdown, updateProperties,
  } = useNotePersistence({ filePath });

  const {
    editorMode, setEditorMode, switchToPlaintext, switchToRichText, switchToDiff,
  } = useEditorModeSwitch({
    file,
    rawMarkdown,
    setRawMarkdown,
    editor,
    onPersistRawMarkdown: persistRawMarkdown,
  });

  const [isDirty, setIsDirty] = useState(false);

  const fileRef = useRef(file);
  useEffect(() => {
    fileRef.current = file;
  }, [file]);

  const lastSavedContentRef = useRef<string>('');
  const isDirtyRef = useRef(false);
  const dirtyContentRef = useRef<{ mode: 'rich' | 'plain'; content: string } | null>(null);
  const dirtyStartTimeRef = useRef<number | null>(null);
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * Idempotent saver: strips existing frontmatter from input, merges meta, and persists.
   */
  const performSave = useCallback(
    async (inputMarkdown: string, targetFile?: VaultFile | null) => {
      const currentFile = targetFile || fileRef.current;
      if (!currentFile) return;

      const currentMeta = currentFile.frontmatter || {};
      const parsed = parseFrontmatter(inputMarkdown);
      const mergedMeta =
        Object.keys(parsed.meta).length > 0
          ? { ...currentMeta, ...parsed.meta }
          : currentMeta;

      const fullRaw = serializeFrontmatter(mergedMeta, parsed.content);
      const updated = await persistRawMarkdown(fullRaw, currentFile);
      if (updated?.content) {
        lastSavedContentRef.current = updated.content;
      }
      return updated;
    },
    [persistRawMarkdown]
  );

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
      performSave(pending.content, currentFile);
    }
  }, [performSave]);

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
      await performSave(pending.content, currentFile);
    } catch (err) {
      console.warn('Flush autosave failed:', err);
    }
  }, [performSave]);

  // Unified scheduler for rich and plain text autosaves
  const triggerAutosave = useCallback(
    (mode: 'rich' | 'plain', content: string, currentFile?: typeof file) => {
      const targetFile = currentFile || file;
      if (!targetFile) return;

      const currentMeta = targetFile.frontmatter || {};
      const parsed = parseFrontmatter(content);
      const mergedMeta =
        Object.keys(parsed.meta).length > 0
          ? { ...currentMeta, ...parsed.meta }
          : currentMeta;

      const fullRaw = serializeFrontmatter(mergedMeta, parsed.content);
      const baseline = lastSavedContentRef.current || targetFile.content || '';

      // If content matches saved baseline, reset dirty status and clear pending timer
      if (isContentEqual(fullRaw, baseline)) {
        isDirtyRef.current = false;
        dirtyContentRef.current = null;
        dirtyStartTimeRef.current = null;
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
          autosaveTimerRef.current = null;
        }
        setIsDirty(false);
        setRawMarkdown(baseline);
        return;
      }

      // Legitimate unsaved changes detected
      isDirtyRef.current = true;
      setIsDirty(true);
      dirtyContentRef.current = { mode, content: fullRaw };
      setRawMarkdown(fullRaw);

      // If content matches saved baseline, reset dirty status and clear pending timer
      if (isContentEqual(fullRaw, baseline)) {
        isDirtyRef.current = false;
        dirtyContentRef.current = null;
        dirtyStartTimeRef.current = null;
        if (autosaveTimerRef.current) {
          clearTimeout(autosaveTimerRef.current);
          autosaveTimerRef.current = null;
        }
        setIsDirty(false);
        setRawMarkdown(baseline);
        return;
      }

      // Legitimate unsaved changes detected
      isDirtyRef.current = true;
      setIsDirty(true);
      dirtyContentRef.current = { mode, content };
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
      lastSavedContentRef.current = baseline;
      setRawMarkdown(baseline);
      setTitle(file.title);
      if (editor && !editor.isDestroyed && editor.schema) {
        try {
          const { content: cleanBody } = parseFrontmatter(baseline);
          editor.commands.setContent(markdownToEditorHtml(cleanBody), { emitUpdate: false });
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

      if (editorMode === 'plaintext' || editorMode === 'diff') {
        if (file) {
          await performSave(rawMarkdown, file);
        }
      } else if (editor && !editor.isDestroyed && editor.schema && file) {
        await performSave(editorHtmlToMarkdown(editor.getHTML()), file);
      }
    },
    [editorMode, file, performSave, rawMarkdown]
  );

  // Setup Cmd+S / Ctrl+S global save shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (editorMode === 'plaintext' || editorMode === 'diff') {
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
    scheduleAutosave, scheduleAutosaveRaw, flushPendingSave, performSave,
    isDirty, autosaveInterval, updateProperties, saveTimeoutRef: autosaveTimerRef,
    switchToPlaintext, switchToRichText, switchToDiff, handleRevert, handleManualSave,
  };
}
