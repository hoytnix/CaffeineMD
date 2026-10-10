'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { db, VaultFile } from '@/src/lib/storage/db';
import { NativeFileSystemAdapter } from '@/src/lib/storage/fileSystem';
import {
  parseMarkdownContent,
  serializeMarkdownWithFrontmatter,
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
      const record = await db.files.get(filePath);
      if (isMounted) {
        if (record) {
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
      const finalFrontmatter = frontmatterOverride || parsed.frontmatter || currentFile.frontmatter || {};
      const finalTags = tagsOverride || parsed.tags || currentFile.tags || [];

      const updatedFile: VaultFile = {
        ...currentFile,
        title: finalTitle,
        content: fullContent,
        frontmatter: finalFrontmatter,
        tags: finalTags,
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
      return commitFileUpdate(
        currentFile,
        newRawContent,
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
    saveTimeoutRef,
  };
}
