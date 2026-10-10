'use client';

import React from 'react';
import { VaultFile } from '@/src/lib/storage/db';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';

interface ListViewProps {
  files: VaultFile[];
}

export function ListView({ files }: ListViewProps) {
  const { openFileTab } = useWorkspaceStore();

  if (files.length === 0) {
    return (
      <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 p-8 text-center text-xs text-neutral-400">
        No records match the current filters.
      </div>
    );
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg bg-white dark:bg-neutral-900 divide-y divide-neutral-100 dark:divide-neutral-800">
      {files.map((file) => (
        <div
          key={file.path}
          onClick={() => openFileTab(file.path, file.title)}
          className="p-3.5 flex items-center justify-between hover:bg-neutral-50 dark:hover:bg-neutral-800/40 cursor-pointer transition-colors"
        >
          <div className="flex items-center gap-3">
            <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100">
              {file.title || file.name}
            </span>
            {file.frontmatter?.status && (
              <span className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400">
                · {file.frontmatter.status}
              </span>
            )}
            {file.frontmatter?.priority && (
              <span className="text-[11px] font-mono text-neutral-500">
                · {file.frontmatter.priority}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4 text-xs text-neutral-400">
            {file.tags && file.tags.length > 0 && (
              <div className="flex gap-1.5">
                {file.tags.map((t) => (
                  <span key={t}>#{t}</span>
                ))}
              </div>
            )}
            <span className="font-mono text-[11px]">
              {new Date(file.updatedAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
