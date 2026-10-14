'use client';

import React, { useState, useMemo } from 'react';
import { db } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Hash } from 'lucide-react';
import { TagCloudHeader } from './TagCloudHeader';
import { TagNoteCard } from './TagNoteCard';

export { extractCleanExcerpt } from '@/src/lib/markdown/excerpt';

export function TagCloudView() {
  const {
    openFileTab,
    selectedTagFilter,
    setSelectedTagFilter,
    activeWorkspaceId,
  } = useWorkspaceStore();

  const rawFiles = useLiveQuery(() => db.files.filter((f) => !f.isBinary && !f.isTrash).toArray());
  const files = useMemo(() => {
    const list = rawFiles ?? [];
    return list.filter((f) => {
      if (!activeWorkspaceId || activeWorkspaceId === 'default-vault') {
        return !f.vaultId || f.vaultId === 'default-vault';
      }
      return f.vaultId === activeWorkspaceId;
    });
  }, [rawFiles, activeWorkspaceId]);

  const [searchQuery, setSearchQuery] = useState('');

  // Discover all tags with their respective note counts
  const tagCounts = useMemo(() => {
    const map = new Map<string, number>();
    files.forEach((file) => {
      file.tags?.forEach((tag) => {
        const clean = tag.replace(/^#/, '').trim();
        if (clean) {
          map.set(clean, (map.get(clean) || 0) + 1);
        }
      });
    });

    return Array.from(map.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [files]);

  // Active selected tag (defaults to store's selectedTagFilter or 'all')
  const activeTag = selectedTagFilter || 'all';

  // Filter notes by active tag and search query
  const filteredNotes = useMemo(() => {
    return files.filter((file) => {
      if (activeTag !== 'all') {
        const hasTag = file.tags?.some(
          (t) => t.replace(/^#/, '').toLowerCase() === activeTag.toLowerCase()
        );
        if (!hasTag) return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (file.title || file.name).toLowerCase().includes(q);
        const contentMatch = file.content?.toLowerCase().includes(q);
        const tagMatch = file.tags?.some((t) => t.toLowerCase().includes(q));
        if (!titleMatch && !contentMatch && !tagMatch) return false;
      }

      return true;
    });
  }, [files, activeTag, searchQuery]);

  return (
    <div
      style={{ color: 'var(--theme-text-primary)' }}
      className="flex-1 flex flex-col h-full overflow-y-auto bg-transparent"
    >
      {/* Header Bar */}
      <TagCloudHeader
        totalNotes={files.length}
        activeTag={activeTag}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        tagCounts={tagCounts}
        onSelectTag={setSelectedTagFilter}
      />

      {/* Main Notes Grid */}
      <div className="p-8 max-w-7xl w-full mx-auto flex-1">
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-neutral-500 font-medium">
            Showing <span className="font-mono tabular-nums text-neutral-800 dark:text-neutral-200">{filteredNotes.length}</span> notes{' '}
            {activeTag !== 'all' ? (
              <span>tagged with <span className="font-semibold text-indigo-600 dark:text-indigo-400">#{activeTag}</span></span>
            ) : (
              <span>across all vault tags</span>
            )}
          </div>
        </div>

        {filteredNotes.length === 0 ? (
          <div
            style={{
              backgroundColor: 'var(--theme-bg-sidebar)',
              borderColor: 'var(--theme-border)',
            }}
            className="py-16 text-center border border-dashed rounded-2xl p-12"
          >
            <Hash className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No notes found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              No notes match the current tag &quot;#{activeTag}&quot; and search criteria. Select another tag above or add tags in note properties.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => (
              <TagNoteCard
                key={note.path}
                note={note}
                activeTag={activeTag}
                onOpenNote={openFileTab}
                onSelectTag={setSelectedTagFilter}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
