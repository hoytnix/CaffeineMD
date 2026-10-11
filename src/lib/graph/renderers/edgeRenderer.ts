import { GraphNode, GraphLink } from '@/src/hooks/useGraphData';

export function renderEdges(
  ctx: CanvasRenderingContext2D,
  links: GraphLink[],
  zoomLevel: number
) {
  // Zoom-dependent alpha fading
  const alpha = Math.min(0.6, Math.max(0.15, 0.35 * Math.sqrt(zoomLevel)));
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = Math.max(0.8, 1 / Math.sqrt(zoomLevel));
  ctx.globalAlpha = alpha;

  for (const link of links) {
    const source = link.source as GraphNode;
    const target = link.target as GraphNode;
    if (
      source.x !== undefined &&
      source.y !== undefined &&
      target.x !== undefined &&
      target.y !== undefined
    ) {
      ctx.beginPath();
      ctx.moveTo(source.x, source.y);
      ctx.lineTo(target.x, target.y);
      ctx.stroke();
    }
  }

  ctx.globalAlpha = 1;
}
