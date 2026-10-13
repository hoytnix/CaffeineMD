'use client';

import React, { useState } from 'react';
import { FileMatchGroup } from '@/src/lib/search/vaultFindReplace';
import { ChevronDown, ChevronRight, FileText } from 'lucide-react';

interface VaultMatchFileRowProps {
  group: FileMatchGroup;
  onToggleCheck: (noteId: string) => void;
  onOpenFile?: (path: string) => void;
}

export function VaultMatchFileRow({
  group,
  onToggleCheck,
  onOpenFile,
}: VaultMatchFileRowProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="border border-[var(--border)] rounded-xl bg-[var(--background)] overflow-hidden text-xs">
      {/* File header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[var(--card)] border-b border-[var(--border)]/60 select-none">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="checkbox"
            checked={group.checked}
            onChange={() => onToggleCheck(group.noteId)}
            className="rounded accent-[var(--accent)] cursor-pointer"
            aria-label={`Select ${group.noteTitle} for replacement`}
          />
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 min-w-0 text-left font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <ChevronDown className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            ) : (
              <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            )}
            <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
            <span className="truncate">{group.noteTitle}</span>
          </button>
          <span className="text-[11px] text-neutral-500 font-mono truncate hidden sm:inline">
            {group.notePath}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-1.5 py-0.2 rounded-full bg-indigo-500/10 text-indigo-400 text-[10px] font-mono font-medium border border-indigo-500/20">
            {group.matches.length} {group.matches.length === 1 ? 'match' : 'matches'}
          </span>
          {onOpenFile && (
            <button
              type="button"
              onClick={() => onOpenFile(group.notePath)}
              className="text-[10px] text-neutral-400 hover:text-[var(--foreground)] underline cursor-pointer"
            >
              Open
            </button>
          )}
        </div>
      </div>

      {/* Matches preview lines */}
      {isExpanded && (
        <div className="divide-y divide-[var(--border)]/40 max-h-56 overflow-y-auto">
          {group.matches.map((m, idx) => (
            <div
              key={idx}
              className="px-3 py-1.5 font-mono text-[11px] flex items-start gap-2.5 hover:bg-neutral-800/20 transition-colors"
            >
              <span className="text-neutral-500 text-[10px] select-none shrink-0 w-8 text-right pt-0.5">
                L{m.line}
              </span>
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className="text-neutral-300 truncate whitespace-pre">
                  {m.preview}
                </div>
                <div className="text-emerald-400/90 text-[10.5px] truncate flex items-center gap-1">
                  <span className="text-neutral-500 select-none">&rarr;</span>
                  <span className="bg-emerald-500/10 px-1 rounded">{m.replacementText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
