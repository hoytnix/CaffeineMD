'use client';

import React, { useState, useMemo } from 'react';
import { db, VaultFile, EisenhowerQuadrant, EISENHOWER_CONFIG } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Tag, Search, FileText, Calendar, Hash, ArrowRight, Filter } from 'lucide-react';

/**
 * Strips markdown and frontmatter syntax to create a clean plaintext excerpt
 */
export function extractCleanExcerpt(content: string, maxLength = 400): string {
  if (!content) return '';

  // 1. Strip YAML frontmatter
  let clean = content.replace(/^---[\s\S]*?---\r?\n?/g, '');

  // 2. Strip fenced code blocks
  clean = clean.replace(/```[\s\S]*?```/g, '');

  // 3. Strip inline code
  clean = clean.replace(/`[^`\n]+`/g, '');

  // 4. Strip markdown image tags
  clean = clean.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');

  // 5. Convert markdown links [text](url) -> text
  clean = clean.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // 6. Convert WikiLinks [[Target|Alias]] -> Alias or Target
  clean = clean.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => alias || target);

  // 7. Strip headings, blockquotes, list markers
  clean = clean.replace(/^#{1,6}\s+/gm, '');
  clean = clean.replace(/^>\s+/gm, '');
  clean = clean.replace(/^-\s+\[[ xX]\]\s+/gm, '');
  clean = clean.replace(/^[-*]\s+/gm, '');
  clean = clean.replace(/^\d+\.\s+/gm, '');

  // 8. Strip emphasis formatting
  clean = clean.replace(/\*\*(.*?)\*\*/g, '$1');
  clean = clean.replace(/\*(.*?)\*/g, '$1');
  clean = clean.replace(/~~(.*?)~~/g, '$1');

  // 9. Normalize whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  if (clean.length > maxLength) {
    return clean.slice(0, maxLength).trim() + '...';
  }
  return clean;
}

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

  // Active selected tag (defaults to store's selectedTagFilter or first popular tag or 'all')
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
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-[var(--background)] text-[var(--foreground)]">
      {/* Header Bar */}
      <div className="sticky top-0 z-20 px-8 py-5 bg-[var(--card)]/90 backdrop-blur-md border-b border-[var(--border)] flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">Tag Cloud & Note Registry</h1>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Browse notes grouped by taxonomic hashtags across your entire vault
              </p>
            </div>
          </div>

          {/* Search within filtered tag view */}
          <div className="relative w-64">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search notes in tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Top Tag Navigation Pill Cloud with Note Count Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <button
            onClick={() => setSelectedTagFilter(null)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
              activeTag === 'all'
                ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 shadow-xs'
                : 'bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <span>All Tags</span>
            <span className="font-mono text-[11px] opacity-70 tabular-nums">({files.length})</span>
          </button>

          {tagCounts.map((t) => {
            const isSelected = activeTag.toLowerCase() === t.name.toLowerCase();
            return (
              <button
                key={t.name}
                onClick={() => setSelectedTagFilter(t.name)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-800'
                }`}
              >
                <span>#{t.name}</span>
                <span className="font-mono text-[11px] opacity-75 tabular-nums">({t.count})</span>
              </button>
            );
          })}
        </div>
      </div>

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
          <div className="py-16 text-center border border-dashed border-neutral-200 dark:border-neutral-800 rounded-2xl p-12 bg-white/50 dark:bg-neutral-900/40">
            <Hash className="w-10 h-10 text-neutral-300 dark:text-neutral-700 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No notes found</h3>
            <p className="text-xs text-neutral-400 mt-1 max-w-sm mx-auto">
              No notes match the current tag &quot;#{activeTag}&quot; and search criteria. Select another tag above or add tags in note properties.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredNotes.map((note) => {
              const rawQuadrant = (note.eisenhower || note.frontmatter?.eisenhower) as EisenhowerQuadrant | undefined;
              const eisenhowerOpt = rawQuadrant && EISENHOWER_CONFIG[rawQuadrant] ? EISENHOWER_CONFIG[rawQuadrant] : null;
              const excerpt = extractCleanExcerpt(note.content || '', 400);

              return (
                <div
                  key={note.path}
                  onClick={() => openFileTab(note.path, note.title)}
                  className="group flex flex-col justify-between p-5 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800/80 hover:border-indigo-400 dark:hover:border-indigo-700/60 hover:shadow-md transition-all cursor-pointer"
                >
                  {/* Top Note Metadata Header */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 truncate">
                        {eisenhowerOpt && (
                          <span
                            className={`w-2 h-2 rounded-full shrink-0 ${eisenhowerOpt.dotBg}`}
                            title={`Eisenhower: ${eisenhowerOpt.label}`}
                          />
                        )}
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                          {note.title || note.name}
                        </h3>
                      </div>

                      {eisenhowerOpt && (
                        <span
                          className={`text-[10px] font-medium px-2 py-0.5 rounded-md border shrink-0 ${eisenhowerOpt.badgeClass}`}
                          title={eisenhowerOpt.label}
                        >
                          {eisenhowerOpt.shortLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 font-mono mb-3 truncate">
                      <span className="truncate">{note.path}</span>
                      <span>·</span>
                      <span className="shrink-0 tabular-nums">
                        {new Date(note.updatedAt).toLocaleDateString()}
                      </span>
                    </div>

                    {/* 400-Character Plaintext Excerpt Preview */}
                    <p className="text-xs text-neutral-600 dark:text-neutral-300 leading-relaxed line-clamp-5">
                      {excerpt || <span className="italic text-neutral-400">Empty note body</span>}
                    </p>
                  </div>

                  {/* Bottom Secondary Tags List */}
                  <div className="mt-4 pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
                    <div className="flex flex-wrap gap-1 items-center overflow-hidden">
                      {note.tags && note.tags.length > 0 ? (
                        note.tags.map((t) => {
                          const cleanTag = t.replace(/^#/, '');
                          const isTagActive = activeTag.toLowerCase() === cleanTag.toLowerCase();
                          return (
                            <button
                              key={cleanTag}
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedTagFilter(cleanTag);
                              }}
                              className={`text-[10px] px-1.5 py-0.5 rounded transition-colors cursor-pointer ${
                                isTagActive
                                  ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-semibold'
                                  : 'text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
                              }`}
                            >
                              #{cleanTag}
                            </button>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-neutral-400 italic">No tags</span>
                      )}
                    </div>

                    <span className="opacity-0 group-hover:opacity-100 transition-opacity text-indigo-500">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
