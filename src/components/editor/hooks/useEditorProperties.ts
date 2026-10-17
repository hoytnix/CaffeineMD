'use client';

import { useCallback } from 'react';
import { Editor } from '@tiptap/react';
import { db, VaultFile } from '@/src/lib/storage/db';
import {
  parseFrontmatter,
  serializeFrontmatter,
  editorHtmlToMarkdown,
  NoteProperties,
  DEFAULT_NOTE_PROPERTIES,
} from '@/src/lib/markdown/serializer';
import { EditorModeType } from '@/src/stores/workspaceStore';

export interface UseEditorPropertiesProps {
  file: VaultFile | null;
  editorMode: EditorModeType;
  editor: Editor | null;
  rawMarkdown: string;
  setFile: React.Dispatch<React.SetStateAction<VaultFile | null>>;
  setRawMarkdown: React.Dispatch<React.SetStateAction<string>>;
}

/**
 * Reconciles YAML frontmatter property updates with the current editor body
 * and persists the serialized Markdown document to IndexedDB.
 */
export function useEditorProperties({
  file,
  editorMode,
  editor,
  rawMarkdown,
  setFile,
  setRawMarkdown,
}: UseEditorPropertiesProps) {
  const handleUpdateProperties = useCallback(
    async (newPropsOrFile: Partial<NoteProperties> | VaultFile) => {
      if (!file) return;

      const isVaultFile = 'frontmatter' in newPropsOrFile && Boolean(newPropsOrFile.frontmatter);
      const incomingMeta = isVaultFile
        ? (newPropsOrFile as VaultFile).frontmatter || {}
        : (newPropsOrFile as Partial<NoteProperties>);

      const newMeta: NoteProperties = {
        ...DEFAULT_NOTE_PROPERTIES,
        ...(file.frontmatter || {}),
        ...incomingMeta,
      };

      const cleanBody =
        editorMode === 'richtext' && editor && !editor.isDestroyed
          ? parseFrontmatter(editorHtmlToMarkdown(editor.getHTML())).content
          : parseFrontmatter(file.content || rawMarkdown || '').content;

      const fullContent = serializeFrontmatter(newMeta, cleanBody);

      const updatedFile: VaultFile = {
        ...file,
        ...(isVaultFile ? (newPropsOrFile as VaultFile) : {}),
        content: fullContent,
        frontmatter: newMeta,
        title: newMeta.title || file.title,
        tags: Array.isArray(newMeta.tags) ? newMeta.tags : file.tags,
        eisenhower: newMeta.eisenhower || file.eisenhower,
        updatedAt: Date.now(),
      };

      setFile(updatedFile);
      setRawMarkdown(fullContent);
      await db.files.put(updatedFile);
      return updatedFile;
    },
    [file, editorMode, editor, rawMarkdown, setFile, setRawMarkdown]
  );

  return { handleUpdateProperties };
}
