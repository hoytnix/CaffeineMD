'use client';

import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { EMOJI_LIST, EMOJI_CATEGORIES, EmojiItem } from '@/src/lib/emoji/emojiData';
import { Search, X, Check, Command, Sparkles } from 'lucide-react';

export function EmojiDrawer() {
  const { isEmojiDrawerOpen, setEmojiDrawerOpen, activeEditor } = useWorkspaceStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const lastActiveElementRef = useRef<HTMLElement | null>(null);

  const handleClose = useCallback(() => {
    setSearchQuery('');
    setSelectedIndex(0);
    setEmojiDrawerOpen(false);
  }, [setEmojiDrawerOpen]);

  // Focus search input when drawer opens
  useEffect(() => {
    if (isEmojiDrawerOpen) {
      if (document.activeElement && document.activeElement !== document.body) {
        lastActiveElementRef.current = document.activeElement as HTMLElement;
      }
      const timer = setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isEmojiDrawerOpen]);

  // Filter emojis
  const filteredEmojis = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return EMOJI_LIST.filter((item) => {
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      if (!matchesCategory) return false;
      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.keywords.some((k) => k.toLowerCase().includes(q))
      );
    });
  }, [selectedCategory, searchQuery]);

  // Handle toast notification
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2200);
  }, []);

  // Insert emoji at target
  const handleInsertEmoji = useCallback(
    (emoji: string) => {
      let inserted = false;

      // 1. Target Tiptap editor if available and focused or active
      if (activeEditor && !activeEditor.isDestroyed) {
        try {
          activeEditor.chain().focus().insertContent(emoji).run();
          inserted = true;
        } catch (err) {
          console.warn('Tiptap insert failed:', err);
        }
      }

      // 2. If not tiptap, check last active input/textarea
      if (!inserted && lastActiveElementRef.current) {
        const el = lastActiveElementRef.current;
        if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
          const start = el.selectionStart ?? el.value.length;
          const end = el.selectionEnd ?? el.value.length;
          const val = el.value;
          el.value = val.substring(0, start) + emoji + val.substring(end);
          el.selectionStart = el.selectionEnd = start + emoji.length;
          el.focus();
          // Dispatch input event for React controlled inputs
          el.dispatchEvent(new Event('input', { bubbles: true }));
          inserted = true;
        }
      }

      // 3. Fallback: Copy to clipboard with toast
      if (!inserted) {
        navigator.clipboard.writeText(emoji).then(() => {
          showToast(`Copied ${emoji} to clipboard!`);
        }).catch(() => {
          showToast(`Selected ${emoji}`);
        });
      } else {
        showToast(`Inserted ${emoji}`);
      }

      // Close drawer after insertion
      handleClose();
    },
    [activeEditor, handleClose, showToast]
  );

  // Keyboard navigation inside drawer
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const total = filteredEmojis.length;
    if (total === 0) return;

    const cols = 8; // approximate column count in grid

    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % total);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + total) % total);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + cols < total ? prev + cols : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - cols >= 0 ? prev - cols : prev));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredEmojis[selectedIndex]) {
        handleInsertEmoji(filteredEmojis[selectedIndex].char);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    }
  };

  if (!isEmojiDrawerOpen) {
    return (
      <>
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900/90 dark:bg-white/90 text-white dark:text-neutral-900 shadow-xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
            <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
            <span>{toastMessage}</span>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-50 transition-opacity animate-in fade-in"
      />

      {/* Floating Drawer / Bottom-Right Modal */}
      <div
        onKeyDown={handleKeyDown}
        className="fixed bottom-6 right-6 w-96 max-w-[calc(100vw-3rem)] h-[480px] bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-150"
      >
        {/* Header with Title, Search & Close */}
        <div className="p-3 border-b border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50 flex flex-col gap-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">☕</span>
              <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                Emoji Drawer
              </span>
              <span className="text-[10px] text-neutral-400 bg-neutral-200/60 dark:bg-neutral-800 px-1.5 py-0.5 rounded font-mono">
                ⌘⇧Space
              </span>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative flex items-center">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search emojis (e.g. spark, fire, note)..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIndex(0);
              }}
              className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/60 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Categorized Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[11px]">
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedIndex(0);
              }}
              className={`px-2 py-1 rounded-md shrink-0 transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
              }`}
            >
              All
            </button>
            {EMOJI_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setSelectedIndex(0);
                }}
                className={`flex items-center gap-1 px-2 py-1 rounded-md shrink-0 transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900 font-medium'
                    : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Emoji Matrix Grid */}
        <div className="flex-1 overflow-y-auto p-3">
          {filteredEmojis.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-neutral-400 text-xs">
              <span className="text-2xl mb-1">🔍</span>
              <p>No matching emoji found</p>
              <p className="text-[11px] text-neutral-500 mt-0.5">Try searching &quot;smile&quot; or &quot;rocket&quot;</p>
            </div>
          ) : (
            <div className="grid grid-cols-8 gap-1.5">
              {filteredEmojis.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                return (
                  <button
                    key={`${item.char}-${idx}`}
                    onClick={() => handleInsertEmoji(item.char)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    title={`${item.name} (${item.char})`}
                    className={`aspect-square flex items-center justify-center text-xl rounded-lg transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-indigo-100 dark:bg-indigo-950/70 ring-2 ring-indigo-500 scale-110 shadow-xs z-10'
                        : 'hover:bg-neutral-100 dark:hover:bg-neutral-800'
                    }`}
                  >
                    <span className="font-['Apple_Color_Emoji','Segoe_UI_Emoji','Noto_Color_Emoji',sans-serif] leading-none">
                      {item.char}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer info: active emoji preview & instructions */}
        <div className="px-3 py-2 border-t border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/70 dark:bg-neutral-900/70 flex items-center justify-between text-[11px] text-neutral-500">
          {filteredEmojis[selectedIndex] ? (
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-sm">{filteredEmojis[selectedIndex].char}</span>
              <span className="font-medium text-neutral-800 dark:text-neutral-200 truncate">
                {filteredEmojis[selectedIndex].name}
              </span>
            </div>
          ) : (
            <span>Use Arrow Keys + Enter to insert</span>
          )}

          <div className="flex items-center gap-1 text-[10px] text-neutral-400 shrink-0 font-mono">
            <span>Enter to insert</span>
          </div>
        </div>
      </div>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl bg-neutral-900/95 dark:bg-white/95 text-white dark:text-neutral-900 shadow-2xl backdrop-blur-md text-xs font-medium animate-in fade-in slide-in-from-bottom-2">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600" />
          <span>{toastMessage}</span>
        </div>
      )}
    </>
  );
}
