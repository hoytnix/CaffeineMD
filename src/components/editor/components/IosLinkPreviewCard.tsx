/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import { ExternalLink, Copy, Check, Unlink, FileText, Folder } from 'lucide-react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { VaultFile } from '@/src/lib/storage/db';

interface PreviewData {
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
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const { notes, openFileTab } = useWorkspaceStore();

  const clearTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
  }, []);

  const closeWithDelay = useCallback((ms = 260) => {
    clearTimer();
    timerRef.current = setTimeout(() => setData(null), ms);
  }, [clearTimer]);

  useEffect(() => {
    if (!editor || editor.isDestroyed) return;
    const dom = editor.view.dom;

    const handleMouseOver = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href], [data-wikilink], .wiki-link') as HTMLElement;
      if (!target || !dom.contains(target)) return;

      const wikiTarget = target.getAttribute('data-wikilink') || (target.classList.contains('wiki-link') ? target.textContent?.replace(/[\[\]]/g, '').trim() : null);
      const href = target.getAttribute('href');

      clearTimer();
      timerRef.current = setTimeout(() => {
        const rect = target.getBoundingClientRect();
        if (wikiTarget) {
          const cleanName = wikiTarget.trim();
          const found = notes.find((n) => n.title?.toLowerCase() === cleanName.toLowerCase() || n.name.replace(/\.[^/.]+$/, '').toLowerCase() === cleanName.toLowerCase());
          setData({ type: 'wikilink', href: `#${cleanName}`, title: cleanName, targetTitle: cleanName, targetNote: found, rect });
        } else if (href && (href.startsWith('http://') || href.startsWith('https://'))) {
          try {
            const u = new URL(href);
            const yt = href.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/)?.[1] || null;
            const isImg = /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(href);
            const slug = u.pathname.split('/').filter(Boolean).pop();
            const text = target.textContent?.trim();
            const title = text && text !== href ? text : slug ? decodeURIComponent(slug).replace(/[-_]/g, ' ') : u.hostname;
            setData({ type: 'external', href, title, hostname: u.hostname, videoId: yt, isImage: isImg, rect });
          } catch {}
        }
      }, 140);
    };

    const handleMouseOut = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('a[href], [data-wikilink], .wiki-link');
      if (target) closeWithDelay();
    };

    dom.addEventListener('mouseover', handleMouseOver);
    dom.addEventListener('mouseout', handleMouseOut);
    return () => {
      dom.removeEventListener('mouseover', handleMouseOver);
      dom.removeEventListener('mouseout', handleMouseOut);
      clearTimer();
    };
  }, [editor, notes, closeWithDelay, clearTimer]);

  if (!data || typeof document === 'undefined') return null;

  const left = Math.max(12, Math.min(window.innerWidth - 308, data.rect.left + data.rect.width / 2 - 144));
  const placeAbove = data.rect.bottom + 230 > window.innerHeight && data.rect.top > 230;
  const top = placeAbove ? data.rect.top - 215 : data.rect.bottom + 6;

  const excerpt = data.targetNote?.content?.replace(/^---[\s\S]*?---/, '').trim().slice(0, 110) || 'Note exists in workspace.';

  return createPortal(
    <div
      ref={cardRef}
      onMouseEnter={clearTimer}
      onMouseLeave={() => closeWithDelay(180)}
      style={{ left, top, backgroundColor: 'var(--theme-bg-card-glass, var(--theme-bg-card))', borderColor: 'var(--theme-border)' }}
      className="fixed z-[99999] w-72 rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden text-[var(--theme-text-primary,var(--foreground))] animate-in fade-in zoom-in-95 duration-150 select-none"
    >
      {data.type === 'external' ? (
        <>
          {data.videoId ? (
            <img src={`https://img.youtube.com/vi/${data.videoId}/mqdefault.jpg`} alt="Preview" className="w-full h-28 object-cover" />
          ) : data.isImage ? (
            <img src={data.href} alt="Preview" className="w-full h-28 object-cover bg-black/20" />
          ) : (
            <div className="h-14 bg-gradient-to-r from-[var(--theme-accent,#6366f1)]/20 via-purple-500/10 to-transparent flex items-center px-3.5 gap-2.5">
              <img src={`https://www.google.com/s2/favicons?domain=${data.hostname}&sz=64`} alt="" className="w-5 h-5 rounded-md shadow-xs shrink-0" />
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 truncate">{data.hostname}</span>
            </div>
          )}
          <div className="p-3 pt-2">
            <h4 className="text-xs font-semibold line-clamp-1 mb-0.5">{data.title}</h4>
            <p className="text-[10px] text-neutral-400 truncate font-mono mb-2">{data.href}</p>
            <div className="flex items-center justify-between border-t border-[var(--theme-border)]/60 pt-2">
              <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">{data.hostname}</span>
              <div className="flex items-center gap-1">
                <button type="button" onClick={() => window.open(data.href, '_blank', 'noopener,noreferrer')} className="p-1 rounded-md hover:bg-white/10 text-neutral-400 hover:text-[var(--theme-accent,#6366f1)] transition-colors cursor-pointer" title="Open Link"><ExternalLink className="w-3.5 h-3.5" /></button>
                <button type="button" onClick={() => { navigator.clipboard.writeText(data.href); setCopied(true); setTimeout(() => setCopied(false), 1400); }} className="p-1 rounded-md hover:bg-white/10 text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer" title="Copy URL">{copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}</button>
                <button type="button" onClick={() => { editor?.chain().focus().extendMarkRange('link').unsetLink().run(); setData(null); }} className="p-1 rounded-md hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer" title="Remove Link"><Unlink className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <FileText className="w-4 h-4 text-[var(--theme-accent,#6366f1)] shrink-0" />
            <h4 className="text-xs font-bold truncate flex-1">{data.targetNote?.title || data.targetTitle}</h4>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-[var(--theme-border)]/50 text-neutral-400 flex items-center gap-1"><Folder className="w-2.5 h-2.5" />{data.targetNote?.folder || 'Vault'}</span>
          </div>
          <p className="text-[11px] text-neutral-400 line-clamp-3 font-mono leading-relaxed mb-2.5 pl-1">{excerpt}</p>
          <button type="button" onClick={() => { if (data.targetNote) openFileTab(data.targetNote.path, data.targetNote.title); setData(null); }} className="w-full py-1 px-2.5 rounded-lg text-xs font-medium bg-[var(--theme-accent,#6366f1)] text-white hover:brightness-110 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"><ExternalLink className="w-3 h-3" /> Jump to Note</button>
        </div>
      )}
    </div>,
    document.body
  );
}
