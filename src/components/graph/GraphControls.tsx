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
      <div
        style={{
          backgroundColor: 'var(--theme-bg-sidebar)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-primary)',
        }}
        className="absolute top-4 left-4 z-10 flex items-center gap-2 backdrop-blur-md p-1.5 rounded-xl border shadow-md text-xs"
      >
        {/* Tag Filter */}
        <div
          style={{
            backgroundColor: 'var(--theme-bg-card)',
            borderColor: 'var(--theme-border)',
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg border"
        >
          <Filter className="w-3.5 h-3.5 text-neutral-400" />
          <select
            value={filterTag}
            onChange={(e) => onFilterTagChange(e.target.value)}
            style={{ color: 'var(--theme-text-primary)' }}
            className="bg-transparent focus:outline-none cursor-pointer pr-1"
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
          style={{
            backgroundColor: showOrphans ? 'var(--theme-bg-card)' : 'transparent',
            borderColor: 'var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer"
          title="Toggle orphan nodes without connections"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>{showOrphans ? 'Hide Orphans' : 'Show Orphans'}</span>
        </button>

        {/* Toggle Eisenhower Matrix Colors */}
        <button
          onClick={onToggleColorByEisenhower}
          style={
            colorByEisenhower
              ? {
                  backgroundColor: 'color-mix(in srgb, var(--theme-accent) 15%, transparent)',
                  borderColor: 'color-mix(in srgb, var(--theme-accent) 30%, transparent)',
                  color: 'var(--theme-accent)',
                }
              : {
                  backgroundColor: 'transparent',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-muted)',
                }
          }
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-colors cursor-pointer font-medium"
          title="Color note node rings by Eisenhower priority quadrant"
        >
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <span>Eisenhower Colors</span>
        </button>

        <div
          style={{ backgroundColor: 'var(--theme-border)' }}
          className="h-4 w-px mx-0.5"
        />

        {/* Zoom Controls */}
        <button
          onClick={onZoomIn}
          style={{ color: 'var(--theme-text-secondary)' }}
          className="p-1.5 rounded-lg hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          style={{ color: 'var(--theme-text-secondary)' }}
          className="p-1.5 rounded-lg hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={onResetZoom}
          style={{ color: 'var(--theme-text-secondary)' }}
          className="p-1.5 rounded-lg hover:bg-[var(--theme-bg-card)] transition-colors cursor-pointer"
          title="Reset View"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stats Badge */}
      <div
        style={{
          backgroundColor: 'var(--theme-bg-sidebar)',
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-muted)',
        }}
        className="absolute bottom-4 left-4 z-10 flex items-center gap-3 px-3 py-1.5 rounded-lg backdrop-blur-md border text-[11px] font-mono shadow-sm"
      >
        <div className="flex items-center gap-1">
          <span
            style={{ backgroundColor: 'var(--theme-accent)' }}
            className="w-2 h-2 rounded-full"
          />
          <span>{nodeCount} Notes</span>
        </div>
        <span>·</span>
        <div className="flex items-center gap-1">
          <Hash className="w-3 h-3 opacity-60" />
          <span>{edgeCount} Links</span>
        </div>
      </div>
    </>
  );
}
