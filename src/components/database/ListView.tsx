'use client';

import React from 'react';
import { VaultFile, EISENHOWER_CONFIG } from '@/src/lib/storage/db';
import { normalizeEisenhower, DEFAULT_NOTE_PROPERTIES } from '@/src/lib/markdown/frontmatter';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { User, FileText, LayoutList, LayoutGrid } from 'lucide-react';
import { ListCardItem } from './list/ListCardItem';

interface ListViewProps {
  files: VaultFile[];
}

export function ListView({ files }: ListViewProps) {
  const { openFileTab, listViewLayout, setListViewLayout } = useWorkspaceStore();

  return (
    <div className="space-y-3">
      {/* Inline Header Control Bar */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[var(--foreground)] opacity-70">
            {files.length} {files.length === 1 ? 'note' : 'notes'}
          </span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] opacity-60">
            {listViewLayout === 'grid' ? 'Card Grid' : 'Compact List'}
          </span>
        </div>

        <div
          role="group"
          aria-label="List layout quick switch"
          className="flex items-center p-0.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
        >
          <button
            type="button"
            onClick={() => setListViewLayout('list')}
            aria-label="Switch to Compact List"
            title="Compact List"
            className={`p-1 rounded cursor-pointer transition-colors ${
              listViewLayout === 'list'
                ? 'bg-white dark:bg-neutral-900 text-[var(--foreground)] shadow-xs font-medium'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setListViewLayout('grid')}
            aria-label="Switch to Card Grid"
            title="Card Grid"
            className={`p-1 rounded cursor-pointer transition-colors ${
              listViewLayout === 'grid'
                ? 'bg-white dark:bg-neutral-900 text-[var(--foreground)] shadow-xs font-medium'
                : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-100'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {files.length === 0 ? (
        <div className="border border-[var(--border)] bg-[var(--card)] rounded-xl p-8 text-center text-xs text-neutral-400">
          No records match the current filters.
        </div>
      ) : listViewLayout === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
          {files.map((file) => (
            <ListCardItem
              key={file.path}
              file={file}
              onClick={(path) => openFileTab(path, file.title)}
            />
          ))}
        </div>
      ) : (
        <div className="border border-[var(--border)] bg-[var(--card)] rounded-xl divide-y divide-[var(--border)] overflow-hidden">
          {files.map((file) => {
            const currentEisenhower = normalizeEisenhower(
              file.eisenhower || (file.frontmatter?.eisenhower as string | undefined)
            );
            const opt = EISENHOWER_CONFIG[currentEisenhower];
            const status =
              (file.frontmatter?.status as string | undefined) ||
              DEFAULT_NOTE_PROPERTIES.status;
            const author = file.frontmatter?.author as string | undefined;

            return (
              <div
                key={file.path}
                role="button"
                tabIndex={0}
                onClick={() => openFileTab(file.path, file.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    openFileTab(file.path, file.title);
                  }
                }}
                className="p-3.5 flex items-center justify-between hover:bg-[var(--bg-primary)]/40 cursor-pointer transition-colors select-none text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {opt ? (
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${opt.dotBg}`}
                      title={`Eisenhower: ${opt.label}`}
                    />
                  ) : (
                    <span
                      className="w-2 h-2 rounded-full shrink-0 bg-neutral-300 dark:bg-neutral-700 opacity-40"
                      title="Unassigned priority"
                    />
                  )}
                  <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                  <span className="font-semibold text-xs text-[var(--foreground)] truncate">
                    {file.title || file.name}
                  </span>

                  {/* Status Badge */}
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--bg-primary)] text-[var(--foreground)] opacity-80 border border-[var(--border)] shrink-0">
                    {status}
                  </span>

                  {/* Author */}
                  {author && (
                    <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[var(--foreground)] opacity-50 truncate">
                      <User className="w-3 h-3" />
                      <span className="truncate">{author}</span>
                    </span>
                  )}

                  {/* Eisenhower Pill */}
                  {opt && (
                    <span
                      className={`hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${opt.badgeClass} shrink-0`}
                    >
                      {opt.shortLabel}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-[var(--foreground)] opacity-60 shrink-0 ml-4">
                  {file.tags && file.tags.length > 0 && (
                    <div className="hidden sm:flex gap-1.5">
                      {file.tags.map((t) => (
                        <span
                          key={t}
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--bg-primary)] border border-[var(--border)]"
                        >
                          #{t.replace(/^#/, '')}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="font-mono text-[11px]">
                    {new Date(file.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
