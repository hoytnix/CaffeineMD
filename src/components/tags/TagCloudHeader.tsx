'use client';

import React from 'react';
import { Tag, Search } from 'lucide-react';

export interface TagCountItem {
  name: string;
  count: number;
}

export interface TagCloudHeaderProps {
  totalNotes: number;
  activeTag: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  tagCounts: TagCountItem[];
  onSelectTag: (tag: string | null) => void;
}

export function TagCloudHeader({
  totalNotes,
  activeTag,
  searchQuery,
  onSearchChange,
  tagCounts,
  onSelectTag,
}: TagCloudHeaderProps) {
  return (
    <div
      style={{ borderColor: 'var(--theme-border)' }}
      className="sticky top-0 z-20 px-8 py-5 backdrop-blur-sm border-b flex flex-col gap-4 bg-[var(--bg-secondary)]/80"
    >
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div
            style={{ backgroundColor: 'var(--theme-bg-card)', color: 'var(--theme-accent)' }}
            className="p-2 rounded-xl"
          >
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight">Tag Cloud &amp; Note Registry</h1>
            <p
              style={{ color: 'var(--theme-text-muted)' }}
              className="text-xs"
            >
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
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              backgroundColor: 'var(--theme-bg-card)',
              borderColor: 'var(--theme-border)',
              color: 'var(--theme-text-primary)',
            }}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs placeholder-neutral-400 outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Top Tag Navigation Pill Cloud with Note Count Badges */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          onClick={() => onSelectTag(null)}
          style={
            activeTag === 'all'
              ? { backgroundColor: 'var(--theme-accent)', color: '#ffffff' }
              : {
                  backgroundColor: 'var(--theme-bg-card)',
                  borderColor: 'var(--theme-border)',
                  color: 'var(--theme-text-secondary)',
                }
          }
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 border cursor-pointer"
        >
          <span>All Tags</span>
          <span className="font-mono text-[11px] opacity-70 tabular-nums">({totalNotes})</span>
        </button>

        {tagCounts.map((t) => {
          const isSelected = activeTag.toLowerCase() === t.name.toLowerCase();
          return (
            <button
              key={t.name}
              onClick={() => onSelectTag(t.name)}
              style={
                isSelected
                  ? { backgroundColor: 'var(--theme-accent)', color: '#ffffff' }
                  : {
                      backgroundColor: 'var(--theme-bg-card)',
                      borderColor: 'var(--theme-border)',
                      color: 'var(--theme-text-secondary)',
                    }
              }
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors shrink-0 border cursor-pointer hover:border-[var(--theme-accent)]"
            >
              <span>#{t.name}</span>
              <span className="font-mono text-[11px] opacity-75 tabular-nums">({t.count})</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
