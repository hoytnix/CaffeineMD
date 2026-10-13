'use client';

import React from 'react';
import { ExecutionOutputItem } from '@/src/lib/sandbox/types';
import { CornerDownLeft, Trash2, Clock } from 'lucide-react';

interface CodeBlockOutputDrawerProps {
  outputs: ExecutionOutputItem[];
  executionTimeMs: number | null;
  onInsertIntoNote: () => void;
  onClear: () => void;
}

export function CodeBlockOutputDrawer({
  outputs,
  executionTimeMs,
  onInsertIntoNote,
  onClear,
}: CodeBlockOutputDrawerProps) {
  if (outputs.length === 0) return null;

  return (
    <div
      contentEditable={false}
      className="mt-2 border-t border-[var(--border)] pt-2 text-xs font-mono select-text bg-neutral-900/40 dark:bg-black/40 rounded-b-md px-3 py-2 space-y-1.5"
    >
      <div className="flex items-center justify-between text-[11px] text-neutral-400 border-b border-[var(--border)]/50 pb-1 mb-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-neutral-300">Terminal Output</span>
          {executionTimeMs !== null && (
            <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-neutral-800 text-[10px] text-neutral-400">
              <Clock className="w-2.5 h-2.5" />
              {executionTimeMs}ms
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onInsertIntoNote}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-400 text-[10px] transition-colors cursor-pointer"
            title="Insert output into note beneath code block"
          >
            <CornerDownLeft className="w-3 h-3" />
            <span>Insert into Note</span>
          </button>
          <button
            type="button"
            onClick={onClear}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            title="Clear output"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-[11.5px] leading-relaxed">
        {outputs.map((item, idx) => {
          if (item.type === 'stderr' || item.type === 'error') {
            return (
              <div key={idx} className="text-rose-400 whitespace-pre-wrap">
                {item.text}
              </div>
            );
          }
          if (item.type === 'result') {
            return (
              <div key={idx} className="text-emerald-400 font-medium whitespace-pre-wrap">
                <span className="text-neutral-500 select-none">&rArr; </span>
                {item.text}
              </div>
            );
          }
          return (
            <div key={idx} className="text-neutral-300 whitespace-pre-wrap">
              {item.text}
            </div>
          );
        })}
      </div>
    </div>
  );
}
