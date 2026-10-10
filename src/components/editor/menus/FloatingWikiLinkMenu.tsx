'use client';

import React from 'react';
import { Link2 } from 'lucide-react';

interface WikiLinkSuggestion {
  title: string;
  path: string;
  isNew?: boolean;
}

interface FloatingWikiLinkMenuProps {
  isOpen: boolean;
  coords: { top: number; left: number } | null;
  selectedIndex: number;
  suggestions: WikiLinkSuggestion[];
  onExecuteWikiLink: (suggestion: WikiLinkSuggestion) => void;
}

export function FloatingWikiLinkMenu({
  isOpen,
  coords,
  selectedIndex,
  suggestions,
  onExecuteWikiLink,
}: FloatingWikiLinkMenuProps) {
  if (!isOpen || !coords) return null;

  return (
    <div
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        position: 'fixed',
      }}
      className="z-50 w-72 max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl py-1 text-xs text-neutral-800 dark:text-neutral-200 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
        Link to Note [[...]]
      </div>
      {suggestions.length === 0 ? (
        <div className="px-3 py-2 text-neutral-400">No matching notes found</div>
      ) : (
        suggestions.map((suggestion, idx) => (
          <button
            key={suggestion.title + suggestion.path}
            onClick={() => onExecuteWikiLink(suggestion)}
            className={`w-full flex items-center justify-between px-3 py-2 text-left transition-colors cursor-pointer ${
              idx === selectedIndex
                ? 'bg-neutral-100 dark:bg-neutral-800'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <Link2 className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
              <span className="font-medium truncate text-neutral-900 dark:text-neutral-100">
                {suggestion.title}
              </span>
            </div>
            {suggestion.isNew && (
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-semibold uppercase tracking-wider ml-2 shrink-0">
                Create
              </span>
            )}
          </button>
        ))
      )}
    </div>
  );
}
