'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { db, VaultFile } from '@/src/lib/storage/db';
import { NativeFileSystemAdapter } from '@/src/lib/storage/fileSystem';
import {
  parseMarkdownContent,
  serializeMarkdownWithFrontmatter,
  FRONTMATTER_REGEX,
  DEFAULT_NOTE_PROPERTIES,
  NoteProperties,
} from '@/src/lib/markdown/serializer';

interface UseNotePersistenceOptions {
  filePath: string;
}

export function useNotePersistence({ filePath }: UseNotePersistenceOptions) {
  const [file, setFile] = useState<VaultFile | null>(null);
  const [title, setTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rawMarkdown, setRawMarkdown] = useState('');

  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up debounce timer on unmount
  useEffect(() => {
    const timerRef = saveTimeoutRef;
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // Load Note from IndexedDB
  useEffect(() => {
    let isMounted = true;
    async function load() {
      setLoading(true);
      let record = await db.files.get(filePath);
      if (isMounted) {
        if (record) {
          // If note is missing frontmatter, auto-populate default fields while preserving the existing note body
          if (!record.isBinary && (record.extension === 'md' || record.extension === 'markdown' || record.extension === 'txt')) {
            const hasFrontmatter = FRONTMATTER_REGEX.test(record.content || '');
            const parsed = parseMarkdownContent(record.content || '', record.title || record.name.replace(/\.[^/.]+$/, ''));
            if (!hasFrontmatter) {
              const fullSerialized = serializeMarkdownWithFrontmatter(parsed.body, parsed.frontmatter);
              const updatedRecord: VaultFile = {
                ...record,
                content: fullSerialized,
                title: parsed.title || record.title,
                frontmatter: parsed.frontmatter,
                tags: parsed.tags,
                eisenhower: parsed.eisenhower,
                updatedAt: record.updatedAt || Date.now(),
              };
              await db.files.put(updatedRecord);
              await NativeFileSystemAdapter.writeBackToFile(updatedRecord.path, fullSerialized);
              try {
                const { triggerAutoSync } = await import('@/src/lib/sync/googleDriveSync');
                triggerAutoSync();
              } catch (err) {
                console.warn('Auto-sync trigger skipped:', err);
              }
              record = updatedRecord;
            }
          }

          setFile(record);
          setTitle(record.title || record.name.replace(/\.[^/.]+$/, ''));
          setRawMarkdown(record.content || '');
        } else {
          setFile(null);
          setRawMarkdown('');
        }
        setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [filePath]);

  // Core update helper
  const commitFileUpdate = useCallback(
    async (
      currentFile: VaultFile,
      fullContent: string,
      computedTitle?: string,
      frontmatterOverride?: Record<string, any>,
      tagsOverride?: string[]
    ) => {
      setIsSaving(true);
      const parsed = parseMarkdownContent(fullContent, currentFile.title);

      const finalTitle = computedTitle || title || parsed.title || currentFile.title;
      const finalFrontmatter = frontmatterOverride || parsed.frontmatter || currentFile.frontmatter || DEFAULT_NOTE_PROPERTIES;
      const finalTags = tagsOverride || parsed.tags || currentFile.tags || [];
      const finalEisenhower = (finalFrontmatter.eisenhower || parsed.eisenhower || currentFile.eisenhower) as any;

      const updatedFile: VaultFile = {
        ...currentFile,
        title: finalTitle,
        content: fullContent,
        frontmatter: finalFrontmatter,
        tags: finalTags,
        eisenhower: finalEisenhower,
        updatedAt: Date.now(),
      };

      // 1. Save to IndexedDB
      await db.files.put(updatedFile);

      // 2. Update Backlinks
      await db.backlinks.where('sourcePath').equals(updatedFile.path).delete();
      for (const wl of parsed.wikiLinks) {
        await db.backlinks.put({
          id: `${updatedFile.path}::${wl.target}`,
          sourcePath: updatedFile.path,
          sourceTitle: updatedFile.title,
          targetTitle: wl.target,
          snippet: wl.raw,
          vaultId: updatedFile.vaultId,
        });
      }

      // 3. Write back to disk if native folder is bound
      await NativeFileSystemAdapter.writeBackToFile(updatedFile.path, fullContent);

      // 4. Trigger silent background auto-sync to Google Drive if connected
      try {
        const { triggerAutoSync } = await import('@/src/lib/sync/googleDriveSync');
        triggerAutoSync();
      } catch (err) {
        console.warn('Auto-sync trigger skipped:', err);
      }

      setFile(updatedFile);
      setRawMarkdown(fullContent);
      if (finalTitle !== title) {
        setTitle(finalTitle);
      }

      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 1500);

      return updatedFile;
    },
    [title]
  );

  // Update properties helper (for editor header and inspector)
  const updateProperties = useCallback(
    async (props: Partial<NoteProperties>, currentFile?: VaultFile) => {
      const target = currentFile || file;
      if (!target) return null;

      const parsed = parseMarkdownContent(target.content || '', target.title);
      const mergedFrontmatter: NoteProperties = {
        ...DEFAULT_NOTE_PROPERTIES,
        ...(target.frontmatter || {}),
        ...parsed.frontmatter,
        ...props,
      };

      if (props.title !== undefined) {
        mergedFrontmatter.title = props.title;
      }
      if (props.tags !== undefined) {
        mergedFrontmatter.tags = props.tags;
      }

      const newContent = serializeMarkdownWithFrontmatter(parsed.body, mergedFrontmatter);
      return commitFileUpdate(
        target,
        newContent,
        mergedFrontmatter.title,
        mergedFrontmatter,
        mergedFrontmatter.tags
      );
    },
    [file, commitFileUpdate]
  );

  // Handle saving in Rich Text Mode
  const handleSave = useCallback(
    async (newMarkdownBody: string, currentFile: VaultFile) => {
      const fullSerialized = serializeMarkdownWithFrontmatter(
        newMarkdownBody,
        currentFile.frontmatter || {}
      );
      return commitFileUpdate(currentFile, fullSerialized, title);
    },
    [commitFileUpdate, title]
  );

  // Handle saving in Plaintext Mode (raw markdown with frontmatter)
  const handleSaveRaw = useCallback(
    async (newRawContent: string, currentFile: VaultFile) => {
      const parsed = parseMarkdownContent(newRawContent, currentFile.title);
      const fullSerialized = serializeMarkdownWithFrontmatter(parsed.body, parsed.frontmatter);
      return commitFileUpdate(
        currentFile,
        fullSerialized,
        parsed.title || title,
        parsed.frontmatter,
        parsed.tags
      );
    },
    [commitFileUpdate, title]
  );

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
    handleSave,
    handleSaveRaw,
    updateProperties,
    saveTimeoutRef,
  };
}
