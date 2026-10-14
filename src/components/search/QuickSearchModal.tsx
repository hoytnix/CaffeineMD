'use client';

import React, { useState, useEffect, useRef } from 'react';
import { db, VaultFile, EISENHOWER_CONFIG, EisenhowerQuadrant } from '@/src/lib/storage/db';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Search, FileText, Tag, ArrowRight, X } from 'lucide-react';

export function QuickSearchModal() {
  const { isSearchOpen, setIsSearchOpen, openFileTab } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ file: VaultFile; snippet: string }[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Escape key handler to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isSearchOpen) {
        setIsSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSearchOpen, setIsSearchOpen]);

  useEffect(() => {
    if (isSearchOpen) {
      inputRef.current?.focus();
    }
  }, [isSearchOpen]);

  useEffect(() => {
    if (!query.trim()) {
      // Show recent notes
      db.files
        .toArray()
        .then((all) => {
          const recent = all
            .filter((f) => !f.isBinary && !f.isTrash)
            .sort((a, b) => b.updatedAt - a.updatedAt);
          setResults(
            recent.slice(0, 8).map((f) => ({
              file: f,
              snippet: f.tags?.length ? `Tags: #${f.tags.join(' #')}` : f.path,
            }))
          );
        });
      return;
    }

    const qLower = query.toLowerCase();
    db.files
      .toArray()
      .then((allFiles) => {
        const matches: { file: VaultFile; snippet: string; score: number }[] = [];
        const active = allFiles.filter((f) => !f.isBinary && !f.isTrash);

        for (const file of active) {
          const title = (file.title || file.name).toLowerCase();
          const content = (file.content || '').toLowerCase();
          const tags = (file.tags || []).join(' ').toLowerCase();

          let score = 0;
          let snippet = file.path;

          if (title === qLower) score += 100;
          else if (title.startsWith(qLower)) score += 50;
          else if (title.includes(qLower)) score += 30;

          if (tags.includes(qLower)) score += 25;

          const contentIdx = content.indexOf(qLower);
          if (contentIdx !== -1) {
            score += 15;
            const start = Math.max(0, contentIdx - 35);
            const end = Math.min(file.content.length, contentIdx + query.length + 35);
            snippet = file.content.slice(start, end).replace(/\n/g, ' ');
          }

          if (score > 0) {
            matches.push({ file, snippet, score });
          }
        }

        matches.sort((a, b) => b.score - a.score);
        setResults(matches.slice(0, 10));
        setSelectedIndex(0);
      });
  }, [query]);

  const handleSelect = (file: VaultFile) => {
    openFileTab(file.path, file.title);
    setIsSearchOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex].file);
      }
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs p-4">
      <div className="w-full max-w-xl rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden text-neutral-900 dark:text-neutral-100">
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-neutral-100 dark:border-neutral-800">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes, tags, or content... (use ↑↓ to navigate, Enter to open)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder-neutral-400 text-neutral-900 dark:text-neutral-100"
          />
          {query && (
            <button onClick={() => setQuery('')} className="text-neutral-400 hover:text-neutral-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 rounded border border-neutral-200 dark:border-neutral-700">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-1">
          {results.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No matching notes found for &quot;{query}&quot;
            </div>
          ) : (
            results.map(({ file, snippet }, idx) => {
              const rawQuadrant = (file.eisenhower || file.frontmatter?.eisenhower) as EisenhowerQuadrant | undefined;
              const eqOpt = rawQuadrant && EISENHOWER_CONFIG[rawQuadrant] ? EISENHOWER_CONFIG[rawQuadrant] : null;

              return (
                <div
                  key={file.path}
                  onClick={() => handleSelect(file)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`p-2.5 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                    idx === selectedIndex
                      ? 'bg-neutral-100 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100'
                      : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50 text-neutral-700 dark:text-neutral-300'
                  }`}
                >
                  <div className="truncate flex-1 pr-3">
                    <div className="flex items-center gap-2">
                      {eqOpt && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${eqOpt.dotBg}`}
                          title={`Eisenhower: ${eqOpt.label}`}
                        />
                      )}
                      <FileText className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="text-xs font-semibold truncate">{file.title || file.name}</span>
                      <span className="text-[11px] text-neutral-400 font-mono truncate">{file.path}</span>
                    </div>
                    {snippet && (
                      <div className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-1 truncate pl-5 font-mono">
                        {snippet}
                      </div>
                    )}
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-400 shrink-0 opacity-0 group-hover:opacity-100" />
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
