/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import { ExternalLink, Copy, Check, Unlink, FileText, Folder } from 'lucide-react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { VaultFile } from '@/src/lib/storage/db';

interface CachedMeta {
  title?: string;
  description?: string;
  screenshotUrl: string;
  ogImageUrl?: string;
}

const linkMetaCache = new Map<string, CachedMeta>();

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

function ExternalCardContent({
  data,
  editor,
  onClose,
}: {
  data: PreviewData;
  editor?: Editor | null;
  onClose: () => void;
}) {
  const url = data.href;
  const thumUrl = `https://image.thum.io/get/width/640/crop/380/noanimate/${url}`;
  const cached = linkMetaCache.get(url);

  const [meta, setMeta] = useState<CachedMeta | null>(cached || null);
  const [screenshotSrc, setScreenshotSrc] = useState<string>(cached?.screenshotUrl || thumUrl);
  const [fallbackOgImage, setFallbackOgImage] = useState<string | undefined>(cached?.ogImageUrl);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (data.videoId || data.isImage) return;
    if (linkMetaCache.has(url)) return;

    const controller = new AbortController();
    const fetchMetadata = async () => {
      try {
        const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=true`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const json = await res.json();
        const d = json?.data;
        const liveScreenshot = d?.screenshot?.url;
        const og = d?.image?.url;
        const item: CachedMeta = {
          title: d?.title,
          description: d?.description,
          screenshotUrl: liveScreenshot || thumUrl,
          ogImageUrl: og,
        };
        linkMetaCache.set(url, item);
        setMeta(item);
        if (liveScreenshot) {
          setScreenshotSrc(liveScreenshot);
          setImgError(false);
        }
        if (og) setFallbackOgImage(og);
      } catch {
        // Fallback to thumUrl already set
      }
    };

    fetchMetadata();
    return () => controller.abort();
  }, [url, thumUrl, data.videoId, data.isImage]);

  const displayTitle = meta?.title || data.title || data.hostname || url;

  return (
    <>
      {data.videoId ? (
        <div className="h-40 relative overflow-hidden bg-slate-950/80 border-b border-white/10 group">
          <img
            src={`https://img.youtube.com/vi/${data.videoId}/hqdefault.jpg`}
            alt="Preview"
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03]"
          />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
            <div className="w-10 h-7 rounded-lg bg-red-600/90 text-white flex items-center justify-center shadow-lg">
              <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-white ml-0.5" />
            </div>
          </div>
        </div>
      ) : data.isImage ? (
        <div className="h-40 relative overflow-hidden bg-slate-950/80 border-b border-white/10 group flex items-center justify-center">
          <img
            src={data.href}
            alt="Preview"
            className="w-full h-full object-cover transition-all duration-500 group-hover:scale-[1.03]"
          />
        </div>
      ) : (
        <div className="h-40 relative overflow-hidden bg-slate-950/80 border-b border-white/10 group">
          <div className="absolute top-0 inset-x-0 h-6 px-2.5 flex items-center justify-between bg-slate-950/75 backdrop-blur-md border-b border-white/5 z-10">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-rose-500/80" />
              <div className="w-2 h-2 rounded-full bg-amber-500/80" />
              <div className="w-2 h-2 rounded-full bg-emerald-500/80" />
            </div>
            <span className="text-[10px] text-slate-400 font-mono tracking-tight max-w-[170px] truncate">
              {data.hostname}
            </span>
          </div>

          {!imgLoaded && !imgError && (
            <div className="absolute inset-0 flex items-center justify-center animate-pulse bg-gradient-to-br from-slate-800/80 via-slate-900/90 to-slate-800/80">
              <span className="text-[10px] font-medium text-slate-300 bg-slate-950/70 backdrop-blur-sm px-2.5 py-1 rounded-full border border-white/10 shadow-xs">
                Capturing preview...
              </span>
            </div>
          )}

          {imgError ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-b from-slate-900/90 via-slate-950/95 to-slate-950 text-center p-4 pt-7 gap-2">
              <div className="p-2 rounded-xl bg-white/5 border border-white/10 shadow-inner">
                <img
                  src={`https://www.google.com/s2/favicons?domain=${data.hostname}&sz=64`}
                  alt=""
                  className="w-6 h-6 rounded-md shadow-xs"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-neutral-400 px-2 py-0.5 rounded bg-white/5 border border-white/10 max-w-[200px] truncate">
                {data.hostname}
              </span>
            </div>
          ) : (
            <img
              src={screenshotSrc}
              alt={`Preview of ${data.hostname}`}
              className={`w-full h-full object-cover object-top transition-all duration-500 group-hover:scale-[1.03] ${
                imgLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImgLoaded(true)}
              onError={() => {
                if (screenshotSrc !== fallbackOgImage && fallbackOgImage) {
                  setScreenshotSrc(fallbackOgImage);
                } else {
                  setImgError(true);
                }
              }}
            />
          )}
        </div>
      )}

      <div className="p-3 pt-2.5">
        <h4 className="text-xs font-semibold line-clamp-1 mb-0.5" title={displayTitle}>
          {displayTitle}
        </h4>
        {meta?.description && (
          <p className="text-[11px] line-clamp-2 opacity-75 mt-0.5 mb-1.5 leading-snug">
            {meta.description}
          </p>
        )}
        <p className="text-[10px] text-neutral-400 truncate font-mono mb-2">{data.href}</p>
        <div className="flex items-center justify-between border-t border-[var(--theme-border)]/60 pt-2">
          <span className="text-[9px] uppercase tracking-wider text-neutral-500 font-semibold">{data.hostname}</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => window.open(data.href, '_blank', 'noopener,noreferrer')}
              className="p-1 rounded-md hover:bg-white/10 text-neutral-400 hover:text-[var(--theme-accent,#6366f1)] transition-colors cursor-pointer"
              title="Open Link"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(data.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              }}
              className="p-1 rounded-md hover:bg-white/10 text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer"
              title="Copy URL"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                editor?.chain().focus().extendMarkRange('link').unsetLink().run();
                onClose();
              }}
              className="p-1 rounded-md hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
              title="Remove Link"
            >
              <Unlink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export function IosLinkPreviewCard({ editor }: { editor?: Editor | null }) {
  const [data, setData] = useState<PreviewData | null>(null);
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
      onMouseLeave={() => closeWithDelay(180)}
      style={{ left, top, backgroundColor: 'var(--theme-bg-card-glass, var(--theme-bg-card))', borderColor: 'var(--theme-border)' }}
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
