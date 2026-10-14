'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import { ExternalLink, FileText, Folder } from 'lucide-react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { VaultFile } from '@/src/lib/storage/db';
import { ExternalCardContent } from './ExternalCardContent';

export interface PreviewData {
  type: 'external' | 'wikilink';
  href: string;
  title: string;
  hostname?: string;
  videoId?: string | null;
  isImage?: boolean;
  targetTitle?: string;
  targetNote?: VaultFile | null;
  rect: DOMRect;
}

export function IosLinkPreviewCard({ editor }: { editor?: Editor | null }) {
  const [data, setData] = useState<PreviewData | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const isClickedRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const { notes, openFileTab } = useWorkspaceStore();

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const closeWithDelay = useCallback((ms = 260) => {
    clearTimer();
    timerRef.current = setTimeout(() => {
      isClickedRef.current = false;
      setData(null);
    }, ms);
  }, [clearTimer]);

  const resolvePreviewData = useCallback((target: HTMLElement): PreviewData | null => {
    const wikiTarget = target.getAttribute('data-wikilink') || (target.classList.contains('wiki-link') ? target.textContent?.replace(/[\[\]]/g, '').trim() : null);
    const href = target.getAttribute('href');
    const rect = target.getBoundingClientRect();

    if (wikiTarget) {
      const cleanName = wikiTarget.trim();
      const found = notes.find((n) => n.title?.toLowerCase() === cleanName.toLowerCase() || n.name.replace(/\.[^/.]+$/, '').toLowerCase() === cleanName.toLowerCase());
      return { type: 'wikilink', href: `#${cleanName}`, title: cleanName, targetTitle: cleanName, targetNote: found, rect };
    } else if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
      try {
        const u = new URL(href);
        const yt = href.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)?.[1] || null;
        const isImg = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(href);
        const slug = u.pathname.split('/').filter(Boolean).pop();
        const text = target.textContent?.trim();
        const title = text && text !== href ? text : slug ? decodeURIComponent(slug).replace(/[-_]/g, ' ') : u.hostname;
        return { type: 'external', href, title, hostname: u.hostname, videoId: yt, isImage: isImg, rect };
      } catch {}
    }
    return null;
  }, [notes]);

  const showPreviewForAnchor = useCallback((anchor: HTMLElement, isPinned = false) => {
    clearTimer();
    const preview = resolvePreviewData(anchor);
    if (preview) {
      isClickedRef.current = isPinned;
      setData(preview);
    }
  }, [clearTimer, resolvePreviewData]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const dom = editor.view.dom;

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href], [data-wikilink], .wiki-link') as HTMLElement;
      if (!target || !dom.contains(target)) return;

      clearTimer();
      timerRef.current = setTimeout(() => {
        showPreviewForAnchor(target, false);
      }, 280);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href], [data-wikilink], .wiki-link');
      if (!target) return;
      if (isClickedRef.current) return;
      closeWithDelay();
    };

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href]:not([data-wikilink])') as HTMLAnchorElement | null;
      if (!target || !dom.contains(target)) return;
      const href = target.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showPreviewForAnchor(target, true);
      }
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        };
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      const touchStart = touchStartRef.current;
      touchStartRef.current = null;
      if (!touchStart || e.changedTouches.length === 0) return;

      const touch = e.changedTouches[0];
      const dx = Math.abs(touch.clientX - touchStart.x);
      const dy = Math.abs(touch.clientY - touchStart.y);
      const dt = Date.now() - touchStart.time;

      if (dx > 10 || dy > 10 || dt > 800) return;

      const target = (e.target as HTMLElement).closest('a[href]:not([data-wikilink])') as HTMLAnchorElement | null;
      if (!target || !dom.contains(target)) return;
      const href = target.getAttribute('href');
      if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        showPreviewForAnchor(target, true);
      }
    };

    const handleCustomPreview = (e: Event) => {
      const customEvent = e as CustomEvent<{ href: string; anchor?: HTMLElement }>;
      const anchor = customEvent.detail?.anchor || ((e.target as HTMLElement)?.closest?.('a[href]:not([data-wikilink])') as HTMLElement | null);
      if (anchor && dom.contains(anchor)) {
        showPreviewForAnchor(anchor, true);
      }
    };

    dom.addEventListener('mouseover', handleMouseOver);
    dom.addEventListener('mouseout', handleMouseOut);
    dom.addEventListener('click', handleClick, { capture: true });
    dom.addEventListener('touchstart', handleTouchStart, { passive: true });
    dom.addEventListener('touchend', handleTouchEnd, { capture: true });
    dom.addEventListener('caffeinemd:preview-link', handleCustomPreview);

    return () => {
      dom.removeEventListener('mouseover', handleMouseOver);
      dom.removeEventListener('mouseout', handleMouseOut);
      dom.removeEventListener('click', handleClick, { capture: true });
      dom.removeEventListener('touchstart', handleTouchStart);
      dom.removeEventListener('touchend', handleTouchEnd, { capture: true });
      dom.removeEventListener('caffeinemd:preview-link', handleCustomPreview);
      clearTimer();
    };
  }, [editor, showPreviewForAnchor, closeWithDelay, clearTimer]);

  useEffect(() => {
    if (!data) return;

    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
        isClickedRef.current = false;
        setData(null);
      }
    };

    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        isClickedRef.current = false;
        setData(null);
      }
    };

    document.addEventListener('pointerdown', handleGlobalClick);
    document.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handleGlobalClick);
      document.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [data]);

  if (!data || typeof document === 'undefined') return null;

  const cardWidth = data.type === 'external' ? 320 : 288;
  const left = Math.max(12, Math.min(window.innerWidth - (cardWidth + 16), data.rect.left + data.rect.width / 2 - cardWidth / 2));
  const cardHeight = data.type === 'external' ? 300 : 210;
  const placeAbove = data.rect.bottom + cardHeight + 10 > window.innerHeight && data.rect.top > cardHeight + 10;
  const top = placeAbove ? Math.max(8, data.rect.top - cardHeight - 8) : data.rect.bottom + 6;

  const excerpt = data.targetNote?.content?.replace(/^---[\s\S]*?---/, '').trim().slice(0, 110) || 'Note exists in workspace.';

  return createPortal(
    <div
      ref={cardRef}
      onMouseEnter={clearTimer}
      onMouseLeave={() => {
        isClickedRef.current = false;
        closeWithDelay(180);
      }}
      style={{ left, top, backgroundColor: 'var(--card)', borderColor: 'var(--theme-border)' }}
      className={`fixed z-[99999] ${data.type === 'external' ? 'w-80' : 'w-72'} rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden text-[var(--theme-text-primary,var(--foreground))] animate-in fade-in zoom-in-95 duration-150 select-none group`}
    >
      {data.type === 'external' ? (
        <ExternalCardContent key={data.href} data={data} editor={editor} onClose={() => setData(null)} />
      ) : (
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="w-4 h-4 text-[var(--theme-accent,#6366f1)] shrink-0" />
            <h4 className="text-xs font-bold truncate flex-1">{data.targetNote?.title || data.targetTitle}</h4>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--theme-border)]/50 text-neutral-400 flex items-center gap-1">
              <Folder className="w-2.5 h-2.5" />{data.targetNote?.folder || 'Vault'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-400 line-clamp-3 font-mono leading-relaxed mb-2.5 pl-1">{excerpt}</p>
          <button
            type="button"
            onClick={() => {
              if (data.targetNote) openFileTab(data.targetNote.path, data.targetNote.title);
              setData(null);
            }}
            className="w-full py-1 px-2.5 rounded-lg text-xs font-medium bg-[var(--theme-accent,#6366f1)] text-white hover:brightness-110 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <ExternalLink className="w-3 h-3" /> Jump to Note
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
