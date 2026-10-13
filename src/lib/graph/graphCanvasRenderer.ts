import { GraphNode, GraphLink } from '@/src/hooks/useGraphData';
import { renderEdges } from './renderers/edgeRenderer';
import { renderNodes } from './renderers/nodeRenderer';

export * from './physicsSimulation';
export * from './renderers/edgeRenderer';
export * from './renderers/nodeRenderer';

export interface GraphThemeColors {
  bgPrimary: string;
  bgCard: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
}

export interface RenderOptions {
  canvas: HTMLCanvasElement;
  nodes: GraphNode[];
  links: GraphLink[];
  hoveredNode: GraphNode | null;
  transform: { x: number; y: number; k: number };
  colorByEisenhower?: boolean;
  themeColors?: GraphThemeColors;
}

export function renderGraphFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  themeColors?: GraphThemeColors
) {
  if (themeColors?.bgPrimary) {
    ctx.fillStyle = themeColors.bgPrimary;
    ctx.fillRect(0, 0, width, height);
  }
}

export function renderGraphCanvas({
  canvas,
  nodes,
  links,
  hoveredNode,
  transform,
  colorByEisenhower = true,
  themeColors,
}: RenderOptions) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Handle high DPI
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;

  if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
    canvas.width = width * dpr;
    canvas.height = height * dpr;
  }

  ctx.save();
  ctx.scale(dpr, dpr);
  ctx.clearRect(0, 0, width, height);

  // Render canvas frame background
  renderGraphFrame(ctx, width, height, themeColors);

  // Apply zoom and pan transformation
  const { x, y, k } = transform;
  ctx.translate(x, y);
  ctx.scale(k, k);

  // Render edges pass
  renderEdges(ctx, links, k, themeColors);

  // Render nodes pass
  renderNodes(ctx, nodes, hoveredNode, k, colorByEisenhower, themeColors);

  ctx.restore();
}
