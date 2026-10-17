'use client';

import { useMemo, useEffect, useCallback } from 'react';

/**
 * Manages the creation, automatic revocation, and external tab opening
 * of an ephemeral Blob URL for HTML export previews.
 */
export function usePreviewBlobUrl(compiledHtml: string | null) {
  const previewUrl = useMemo(() => {
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

  const handleOpenExternal = useCallback(() => {
    if (previewUrl) {
      window.open(previewUrl, '_blank');
    }
  }, [previewUrl]);

  return {
    previewUrl,
    handleOpenExternal,
  };
}
