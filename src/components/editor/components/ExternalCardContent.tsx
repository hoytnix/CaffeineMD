/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { ExternalLink, Copy, Check, Unlink } from 'lucide-react';
import type { PreviewData } from './IosLinkPreviewCard';

interface CachedMeta {
  title?: string;
  description?: string;
  screenshotUrl: string;
  ogImageUrl?: string;
}

const linkMetaCache = new Map<string, CachedMeta>();

export function ExternalCardContent({
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
              <div className="w-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-white ml-0.5" />
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
          <a
            href={data.href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-[var(--theme-accent,#6366f1)] text-white hover:brightness-110 transition-all shadow-xs cursor-pointer"
            title="Open Link in new tab"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Open</span>
          </a>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(data.href);
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              }}
              className="p-1.5 rounded-md hover:bg-white/10 text-neutral-400 hover:text-emerald-400 transition-colors cursor-pointer"
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
              className="p-1.5 rounded-md hover:bg-red-500/20 text-neutral-400 hover:text-red-400 transition-colors cursor-pointer"
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
