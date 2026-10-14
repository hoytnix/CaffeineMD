'use client';

import React, { useEffect } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { TiptapEditor } from './TiptapEditor';
import { Columns, Rows, X, FileText } from 'lucide-react';

interface SplitPaneContainerProps {
  primaryFilePath: string;
}

export function SplitPaneContainer({ primaryFilePath }: SplitPaneContainerProps) {
  const {
    splitPaneMode,
    splitFilePath,
    setSplitPaneMode,
    toggleSplitPane,
    setSplitFilePath,
    openTabs,
  } = useWorkspaceStore();


  if (splitPaneMode === 'none') {
    return <TiptapEditor key={primaryFilePath} filePath={primaryFilePath} />;
  }

  // Fallback split file path
  const fallbackSplit =
    openTabs.find((t) => t.path !== primaryFilePath)?.path || primaryFilePath;
  const activeSecondaryPath = splitFilePath || fallbackSplit;

  const isVertical = splitPaneMode === 'vertical';

  return (
    <div
      className={`flex-1 flex ${
        isVertical ? 'flex-row' : 'flex-col'
      } h-full w-full overflow-hidden min-w-0 min-h-0 relative`}
    >
      {/* Pane 1 (Primary) */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden min-w-0 min-h-0 relative border-r border-b border-[var(--border)]">
        <div className="flex items-center justify-between px-3 py-1 bg-[var(--card)]/40 border-b border-[var(--border)] text-[11px] text-neutral-400 select-none">
          <span className="font-semibold text-[var(--foreground)] truncate">Pane 1: {primaryFilePath}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSplitPaneMode(isVertical ? 'horizontal' : 'vertical')}
              title={isVertical ? 'Switch to Horizontal Split' : 'Switch to Vertical Split'}
              className="p-1 rounded text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10 cursor-pointer"
            >
              {isVertical ? <Rows className="w-3.5 h-3.5" /> : <Columns className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setSplitPaneMode('none')}
              title="Close Split View (⌘\)"
              className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <TiptapEditor key={`p1-${primaryFilePath}`} filePath={primaryFilePath} />
        </div>
      </div>

      {/* Pane 2 (Secondary) */}
      <div className="flex-1 flex flex-col h-full w-full overflow-hidden min-w-0 min-h-0 relative bg-transparent">
        {/* Pane 2 Document Selector Bar */}
        <div className="flex items-center justify-between px-3 py-1 bg-[var(--card)]/40 border-b border-[var(--border)] text-[11px] text-neutral-400 select-none">
          <div className="flex items-center gap-1.5 min-w-0">
            <FileText className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
            <select
              value={activeSecondaryPath}
              onChange={(e) => setSplitFilePath(e.target.value)}
              className="bg-transparent text-[11px] font-medium text-[var(--foreground)] outline-none cursor-pointer max-w-[220px] truncate"
              title="Select document for secondary pane"
            >
              {openTabs.map((t) => (
                <option key={t.path} value={t.path} className="bg-[var(--card)] text-[var(--foreground)]">
                  {t.title}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSplitPaneMode('none')}
              title="Close Split View (⌘\)"
              className="p-1 rounded text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-hidden relative">
          <TiptapEditor key={`p2-${activeSecondaryPath}`} filePath={activeSecondaryPath} />
        </div>
      </div>
    </div>
  );
}
