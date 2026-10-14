'use client';

import React, { useState } from 'react';
import { db, VaultFile } from '@/src/lib/storage/db';
import { executeVaultMutation } from '@/src/lib/storage/vaultMutationService';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { ModalShell } from '@/src/components/common/ModalShell';

interface NewNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewNoteModal({ isOpen, onClose }: NewNoteModalProps) {
  const [newNoteName, setNewNoteName] = useState('');
  const { openFileTab, activeWorkspaceId } = useWorkspaceStore();

  if (!isOpen) return null;

  const handleCreateNewNote = async () => {
    if (!newNoteName.trim()) return;

    let path = newNoteName.trim();
    if (!path.endsWith('.md')) path += '.md';

    const title = path.replace(/\.[^/.]+$/, '').split('/').pop() || path;

    const content = `---
title: "${title}"
tags: []
status: "Draft"
author: ""
eisenhower: "Not Urgent & Not Immediate"
---

# ${title}

Start writing here...`;

    const newNote: VaultFile = {
      id: path,
      path,
      name: path.split('/').pop() || path,
      title,
      extension: 'md',
      content,
      frontmatter: {
        title,
        tags: [],
        status: 'Draft',
        author: '',
        eisenhower: 'Not Urgent & Not Immediate',
      },
      tags: [],
      eisenhower: 'Not Urgent & Not Immediate',
      isBinary: false,
      size: content.length,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      vaultId: activeWorkspaceId || 'default-vault',
    };

    await executeVaultMutation(
      () => db.files.put(newNote),
      { syncDiskNote: { path, content: newNote.content } }
    );
    openFileTab(path, title);
    setNewNoteName('');
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="Create New Note"
      footer={
        <>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCreateNewNote}
            disabled={!newNoteName.trim()}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            Create
          </button>
        </>
      }
    >
      <input
        type="text"
        placeholder="e.g. Daily Standup or Projects/Alpha.md"
        value={newNoteName}
        onChange={(e) => setNewNoteName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreateNewNote()}
        autoFocus
        className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] outline-none focus:border-indigo-500"
      />
    </ModalShell>
  );
}
