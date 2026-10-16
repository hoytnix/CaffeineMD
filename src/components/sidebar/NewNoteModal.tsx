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
  const {
    openFileTab,
    setActiveFilePath,
    activeWorkspaceId,
    newNoteParentPath,
    setNewNoteModalOpen,
  } = useWorkspaceStore();

  if (!isOpen) return null;

  const folder =
    newNoteParentPath && newNoteParentPath !== '/'
      ? newNoteParentPath.replace(/\/+$/, '')
      : '';
  const destinationDisplay = folder || '/';

  const handleCreateNewNote = async () => {
    // Sanitize input title/file name (strip invalid filesystem characters)
    const sanitized = newNoteName.trim().replace(/[:*?"<>|\\]/g, '');
    if (!sanitized) return;

    // If name does not end with .md, append .md
    const fileName = sanitized.endsWith('.md') ? sanitized : `${sanitized}.md`;
    const cleanName = fileName.trim().replace(/^\/+/, '');
    const finalFilePath = folder ? `${folder}/${cleanName}` : `/${cleanName}`;
    const title = cleanName.replace(/\.[^/.]+$/, '').split('/').pop() || cleanName;

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
      id: finalFilePath,
      path: finalFilePath,
      name: cleanName.split('/').pop() || cleanName,
      title,
      folder: folder || '',
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
      { syncDiskNote: { path: finalFilePath, content: newNote.content } }
    );

    setActiveFilePath(finalFilePath);
    openFileTab(finalFilePath, title);
    setNewNoteName('');
    setNewNoteModalOpen(false);
    onClose();
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={folder ? `Create New Note in ${folder}` : 'Create New Note'}
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
      <div className="mb-2 text-xs text-neutral-400">
        Creating in: <span className="font-mono text-indigo-400 font-semibold">{destinationDisplay}</span>
      </div>
      <input
        type="text"
        placeholder="e.g. Daily Standup or Architecture.md"
        value={newNoteName}
        onChange={(e) => setNewNoteName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && handleCreateNewNote()}
        autoFocus
        className="w-full px-3 py-2 text-xs rounded-lg bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)] outline-none focus:border-indigo-500"
      />
    </ModalShell>
  );
}
