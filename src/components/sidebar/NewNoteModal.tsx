'use client';

import React, { useState } from 'react';
import { db, VaultFile } from '@/src/lib/storage/db';
import { NativeFileSystemAdapter } from '@/src/lib/storage/fileSystem';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';

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

    await db.files.put(newNote);
    await NativeFileSystemAdapter.createNewFileOnDisk(path, newNote.content);
    try {
      const { triggerAutoSync } = await import('@/src/lib/sync/googleDriveSync');
      triggerAutoSync();
    } catch (err) {
      console.warn('Auto-sync trigger skipped:', err);
    }
    openFileTab(path, title);
    setNewNoteName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm p-4 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-xl">
        <h4 className="text-xs font-semibold mb-2">Create New Note</h4>
        <input
          type="text"
          placeholder="e.g. Daily Standup or Projects/Alpha.md"
          value={newNoteName}
          onChange={(e) => setNewNoteName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleCreateNewNote()}
          autoFocus
          className="w-full px-2.5 py-1.5 text-xs rounded-md bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 outline-none focus:border-indigo-500 mb-3"
        />
        <div className="flex justify-end gap-2 text-xs">
          <button
            onClick={onClose}
            className="px-3 py-1 text-neutral-500 hover:text-neutral-700 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateNewNote}
            className="px-3 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 font-medium cursor-pointer"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  );
}
