'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { listNotes } from '@/src/lib/storage/repositories/noteRepository';
import { VaultFile } from '@/src/lib/storage/schema';
import { FileText, Search, CornerDownLeft } from 'lucide-react';

interface QuickSwitcherContentProps {
  onClose: () => void;
}

function QuickSwitcherContent({ onClose }: QuickSwitcherContentProps) {
  const { openFileTab, activeWorkspaceId } = useWorkspaceStore();
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState<VaultFile[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    listNotes(activeWorkspaceId).then((all) => {
      if (active) {
        setNotes(all.filter((f) => !f.isBinary && !f.isTrash));
      }
    });
    return () => {
      active = false;
    };
  }, [activeWorkspaceId]);

  const filteredNotes = useMemo(() => {
    if (!query.trim()) {
      return notes.slice(0, 10);
    }
    const q = query.toLowerCase().trim();
    return notes
      .filter((note) => {
        const titleMatch = (note.title || '').toLowerCase().includes(q);
        const pathMatch = note.path.toLowerCase().includes(q);
        const tagMatch = (note.tags || []).some((t) => t.toLowerCase().includes(q));
        const aliasMatch = Array.isArray(note.frontmatter?.aliases)
          ? note.frontmatter.aliases.some((a: string) => String(a).toLowerCase().includes(q))
          : false;
        return titleMatch || pathMatch || tagMatch || aliasMatch;
      })
      .slice(0, 15);
  }, [notes, query]);

  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.children[selectedIndex] as HTMLElement;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  const handleSelectNote = (note: VaultFile) => {
    openFileTab(note.path, note.title || note.name);
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredNotes.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredNotes.length) % Math.max(filteredNotes.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredNotes[selectedIndex]) {
        handleSelectNote(filteredNotes[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col text-[var(--foreground)] animate-in zoom-in-95 duration-150"
      >
        {/* Search Input Bar */}
        <div className="flex items-center px-4 py-3 border-b border-[var(--border)] gap-3 bg-[var(--background)]/60">
          <Search className="w-4 h-4 text-neutral-400 shrink-0" />
          <input
            ref={inputRef}
            autoFocus
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type to switch document (⌘P)..."
            className="flex-1 bg-transparent text-sm text-[var(--foreground)] outline-none placeholder:text-neutral-500 font-medium"
          />
          <kbd className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[var(--card)] border border-[var(--border)] text-neutral-400">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
          {filteredNotes.length === 0 ? (
            <div className="py-8 text-center text-xs text-neutral-400">
              No matching documents found.
            </div>
          ) : (
            filteredNotes.map((note, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={note.path}
                  onClick={() => handleSelectNote(note)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[var(--accent)] text-white font-medium'
                      : 'text-[var(--foreground)] hover:bg-[var(--card)]/80'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <FileText className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-neutral-400'}`} />
                    <span className="truncate">{note.title || note.name}</span>
                    <span className={`text-[11px] truncate ${isSelected ? 'text-white/70' : 'text-neutral-400'}`}>
                      {note.path}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="flex items-center gap-1 text-[10px] text-white/80 shrink-0">
                      <span>Open</span>
                      <CornerDownLeft className="w-3 h-3" />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Minimal Footer */}
        <div className="flex items-center justify-between px-3.5 py-2 border-t border-[var(--border)] text-[11px] text-neutral-400 bg-[var(--background)]/40">
          <span>Navigate with ↑ ↓ · Press Enter to open</span>
          <span>{filteredNotes.length} document{filteredNotes.length === 1 ? '' : 's'}</span>
        </div>
      </div>
    </div>
  );
}

export function DocumentQuickSwitcherModal() {
  const { isQuickSwitcherOpen, setQuickSwitcherOpen } = useWorkspaceStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        setQuickSwitcherOpen(!isQuickSwitcherOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isQuickSwitcherOpen, setQuickSwitcherOpen]);

  if (!isQuickSwitcherOpen) return null;

  return <QuickSwitcherContent onClose={() => setQuickSwitcherOpen(false)} />;
}
