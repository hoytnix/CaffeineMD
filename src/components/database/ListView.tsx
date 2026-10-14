'use client';

import React from 'react';
import { VaultFile, EISENHOWER_CONFIG } from '@/src/lib/storage/db';
import { normalizeEisenhower, DEFAULT_NOTE_PROPERTIES } from '@/src/lib/markdown/frontmatter';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { User, FileText } from 'lucide-react';

interface ListViewProps {
  files: VaultFile[];
}

export function ListView({ files }: ListViewProps) {
  const { openFileTab } = useWorkspaceStore();

  if (files.length === 0) {
    return (
      <div
        style={{ backgroundColor: 'var(--theme-bg-sidebar-glass, var(--theme-bg-sidebar))', borderColor: 'var(--theme-border)' }}
        className="border rounded-lg p-8 text-center text-xs text-neutral-400"
      >
        No records match the current filters.
      </div>
    );
  }

  return (
    <div
      style={{ backgroundColor: 'var(--theme-bg-sidebar-glass, var(--theme-bg-sidebar))', borderColor: 'var(--theme-border)' }}
      className="border rounded-lg divide-y"
    >
      {files.map((file) => {
        const currentEisenhower = normalizeEisenhower(file.eisenhower || file.frontmatter?.eisenhower);
        const opt = EISENHOWER_CONFIG[currentEisenhower];
        const status = file.frontmatter?.status || DEFAULT_NOTE_PROPERTIES.status;
        const author = file.frontmatter?.author;

        return (
          <div
            key={file.path}
            onClick={() => openFileTab(file.path, file.title)}
            style={{ borderColor: 'var(--theme-border)' }}
            className="p-3.5 flex items-center justify-between hover:bg-[var(--theme-bg-card)] cursor-pointer transition-colors"
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
              <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                {file.title || file.name}
              </span>

              {/* Status Badge */}
              <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border border-[var(--border)] shrink-0">
                {status}
              </span>

              {/* Author */}
              {author && (
                <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-neutral-400 truncate">
                  <User className="w-3 h-3 text-neutral-400" />
                  <span className="truncate">{author}</span>
                </span>
              )}

              {/* Eisenhower Pill */}
              {opt && (
                <span className={`hidden md:inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border ${opt.badgeClass} shrink-0`}>
                  {opt.shortLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 text-xs text-neutral-400 shrink-0 ml-4">
              {file.tags && file.tags.length > 0 && (
                <div className="hidden sm:flex gap-1.5">
                  {file.tags.map((t) => (
                    <span
                      key={t}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-neutral-50 dark:bg-neutral-800/60 text-neutral-500 border border-[var(--border)]"
                    >
                      #{t}
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
  );
}
