'use client';

import React, { useState, useEffect } from 'react';
import {
  Monitor,
  Tablet,
  Smartphone,
  ExternalLink,
  Loader2,
  Eye,
} from 'lucide-react';

export interface ExportPreviewDrawerProps {
  compiledHtml: string | null;
  isLoading: boolean;
  appName: string;
}

export function ExportPreviewDrawer({
  compiledHtml,
  isLoading,
  appName,
}: ExportPreviewDrawerProps) {
  const [viewport, setViewport] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const previewUrl = React.useMemo(() => {
    if (!compiledHtml) return null;
    const blob = new Blob([compiledHtml], { type: 'text/html;charset=utf-8' });
    return URL.createObjectURL(blob);
  }, [compiledHtml]);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleOpenExternal = () => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  };

  const getViewportWidth = () => {
    switch (viewport) {
      case 'mobile':
        return 'w-[375px] max-w-full';
      case 'tablet':
        return 'w-[768px] max-w-full';
      case 'desktop':
      default:
        return 'w-full';
    }
  };

  return (
    <div className="flex flex-col h-full w-full md:w-[460px] md:border-l bg-[var(--background)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-inner">
      {/* Drawer Control Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--border)] bg-[var(--card)]/50">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[var(--foreground)]">
            <Eye className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Sandboxed Preview</span>
          </div>
          {isLoading && (
            <div className="flex items-center gap-1 text-[11px] text-neutral-400">
              <Loader2 className="w-3 h-3 animate-spin text-[var(--accent)]" />
              <span>Updating...</span>
            </div>
          )}
        </div>

        {/* Viewport switcher */}
        <div className="flex items-center gap-1 bg-[var(--background)] p-0.5 rounded-lg border border-[var(--border)]">
          <button
            type="button"
            onClick={() => setViewport('desktop')}
            title="Desktop view"
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewport === 'desktop'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-neutral-400 hover:text-[var(--foreground)]'
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('tablet')}
            title="Tablet view (768px)"
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewport === 'tablet'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-neutral-400 hover:text-[var(--foreground)]'
            }`}
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setViewport('mobile')}
            title="Mobile view (375px)"
            className={`p-1.5 rounded-md text-xs transition-colors cursor-pointer ${
              viewport === 'mobile'
                ? 'bg-[var(--accent)] text-white shadow-xs'
                : 'text-neutral-400 hover:text-[var(--foreground)]'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Pop-out trigger */}
        <button
          type="button"
          onClick={handleOpenExternal}
          disabled={!previewUrl}
          title="Open preview in new tab"
          className="flex items-center gap-1 px-2 py-1 rounded-lg border border-[var(--border)] text-[11px] text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--background)] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ExternalLink className="w-3 h-3" />
          <span className="hidden sm:inline">Pop Out</span>
        </button>
      </div>

      {/* Frame Preview Canvas */}
      <div className="flex-1 p-3 bg-neutral-950/70 flex items-center justify-center overflow-hidden relative">
        {previewUrl ? (
          <iframe
            key={previewUrl}
            sandbox="allow-scripts"
            src={previewUrl}
            title={`${appName} Live Preview`}
            className={`${getViewportWidth()} h-full rounded-xl border border-[var(--border)] bg-[var(--background)] shadow-2xl transition-all duration-200`}
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-neutral-500 text-xs">
            <Loader2 className="w-5 h-5 animate-spin text-[var(--accent)]" />
            <span>Compiling preview...</span>
          </div>
        )}
      </div>
    </div>
  );
}
