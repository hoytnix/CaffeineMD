export type PreviewViewport = 'desktop' | 'tablet' | 'mobile';

/**
 * Resolves Tailwind width utility classes for the responsive export preview iframe.
 */
export function getViewportWidth(viewport: PreviewViewport): string {
  switch (viewport) {
    case 'mobile':
      return 'w-[375px] max-w-full';
    case 'tablet':
      return 'w-[768px] max-w-full';
    case 'desktop':
    default:
      return 'w-full';
  }
}
