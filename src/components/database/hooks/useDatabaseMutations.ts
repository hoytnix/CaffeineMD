'use client';

import { useCallback } from 'react';
import { db, VaultFile } from '@/src/lib/storage/db';
import { executeVaultMutation } from '@/src/lib/storage/vaultMutationService';

export interface UseDatabaseMutationsProps {
  activeWorkspaceId: string;
  filterFolder: string;
  filterTag: string;
  openFileTab: (path: string, title?: string) => void;
}

/**
 * Encapsulates record creation and mutation actions for frontmatter databases.
 */
export function useDatabaseMutations({
  activeWorkspaceId,
  filterFolder,
  filterTag,
  openFileTab,
}: UseDatabaseMutationsProps) {
  const handleCreateNewNote = useCallback(async () => {
    const timestamp = Date.now();
    const noteTitle = `New Note ${timestamp.toString().slice(-4)}`;
    const fileName = `${noteTitle}.md`;
    const targetFolder = filterFolder !== 'all' ? `${filterFolder}/` : '';
    const fullPath = `${targetFolder}${fileName}`;
    const initialTags = filterTag !== 'all' ? [filterTag] : [];

    const content = `---
title: "${noteTitle}"
tags: [${initialTags.map((t) => `"${t}"`).join(', ')}]
status: "Draft"
author: ""
eisenhower: "Not Urgent & Not Immediate"
---

# ${noteTitle}

Start writing here...
`;

    const newNote: VaultFile = {
      id: fullPath,
      path: fullPath,
      name: fileName,
      title: noteTitle,
      extension: 'md',
      content,
      frontmatter: {
        title: noteTitle,
        status: 'Draft',
        author: '',
        eisenhower: 'Not Urgent & Not Immediate',
        tags: initialTags,
      },
      tags: initialTags,
      eisenhower: 'Not Urgent & Not Immediate',
      isBinary: false,
      size: content.length,
      createdAt: timestamp,
      updatedAt: timestamp,
      vaultId: activeWorkspaceId || 'default-vault',
    };

    await executeVaultMutation(() => db.files.put(newNote));
    openFileTab(fullPath, newNote.title);
  }, [activeWorkspaceId, filterFolder, filterTag, openFileTab]);

  return { handleCreateNewNote };
}
