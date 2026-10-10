'use client';

import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Filter, Eye, Hash } from 'lucide-react';

interface GraphControlsProps {
  filterTag: string;
  onFilterTagChange: (tag: string) => void;
  availableTags: string[];
  showOrphans: boolean;
  onToggleOrphans: () => void;
  colorByEisenhower: boolean;
  onToggleColorByEisenhower: () => void;
  nodeCount: number;
  edgeCount: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}

export function GraphControls({
  filterTag,
  onFilterTagChange,
  availableTags,
  showOrphans,
  onToggleOrphans,
  colorByEisenhower,
  onToggleColorByEisenhower,
  nodeCount,
  edgeCount,
  onZoomIn,
  onZoomOut,
  onResetZoom,
}: GraphControlsProps) {
  return (
    <>
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-md p-1.5 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-md text-xs">
        {/* Tag Filter */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-neutral-100 dark:bg-neutral-800">
          <Filter className="w-3.5 h-3.5 text-neutral-500" />
          <select
            value={filterTag}
            onChange={(e) => onFilterTagChange(e.target.value)}
            className="bg-transparent text-neutral-800 dark:text-neutral-200 focus:outline-none cursor-pointer pr-1"
          >
            <option value="all">All Tags</option>
            {availableTags.map((t) => (
              <option key={t} value={t}>
                #{t}
              </option>
            ))}
          </select>
        </div>

        {/* Toggle Orphans */}
        <button
          onClick={onToggleOrphans}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
            showOrphans
              ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200'
              : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-400'
          }`}
          title="Toggle orphan nodes without connections"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{showOrphans ? 'Hide Orphans' : 'Show Orphans'}</span>
        </button>

        {/* Toggle Eisenhower Matrix Colors */}
        <button
          onClick={onToggleColorByEisenhower}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
            colorByEisenhower
              ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 font-medium'
              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
          }`}
          title="Color note node rings by Eisenhower priority quadrant"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span>Eisenhower Colors</span>
        </button>

        <div className="h-4 w-px bg-neutral-200 dark:border-neutral-800 mx-0.5" />

        {/* Zoom Controls */}
        <button
          onClick={onZoomIn}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={onResetZoom}
          className="p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400 transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stats Badge */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 px-3 py-1.5 rounded-lg bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md border border-neutral-200/80 dark:border-neutral-800/80 text-[11px] font-mono text-neutral-500 shadow-sm">
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-indigo-500" />
          <span>{nodeCount} Notes</span>
        </div>
        <span>·</span>
        <div className="flex items-center gap-1">
          <Hash className="w-3 h-3 text-neutral-400" />
          <span>{edgeCount} Links</span>
        </div>
      </div>
    </>
  );
}
