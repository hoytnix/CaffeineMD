import { GraphNode } from '@/src/hooks/useGraphData';
import { EISENHOWER_CONFIG } from '@/src/lib/storage/db';

export interface GraphNodeColors {
  bgPrimary?: string;
  bgCard?: string;
  border?: string;
  textPrimary?: string;
  textSecondary?: string;
  textMuted?: string;
  accent?: string;
}

export function renderNodes(
  ctx: CanvasRenderingContext2D,
  nodes: GraphNode[],
  hoveredNode: GraphNode | null,
  zoomLevel: number,
  colorByEisenhower = true,
  themeColors?: GraphNodeColors
) {
  ctx.globalAlpha = 1;

  const accentColor = themeColors?.accent || '#6366f1';
  const nodeFillConnected = themeColors?.accent || '#4f46e5';
  const nodeFillDefault = themeColors?.bgCard || '#64748b';
  const nodeStroke = themeColors?.border || '#ffffff';
  const textLabelColor = themeColors?.textPrimary || themeColors?.textSecondary || '#475569';
  const textHoverColor = themeColors?.accent || '#4338ca';

  for (const node of nodes) {
    if (node.x === undefined || node.y === undefined) continue;

    const isHovered = hoveredNode?.id === node.id;
    const eqConfig = node.eisenhower ? EISENHOWER_CONFIG[node.eisenhower] : null;

    // Eisenhower Halo / Ring
    if (colorByEisenhower && eqConfig) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 3.5, 0, Math.PI * 2);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = eqConfig.color;
      ctx.stroke();
    }

    // Outer glow for hovered
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 5, 0, Math.PI * 2);
      ctx.fillStyle = accentColor;
      ctx.globalAlpha = 0.25;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Node body circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = isHovered
      ? accentColor
      : colorByEisenhower && eqConfig
      ? eqConfig.color
      : node.linkCount > 1
      ? nodeFillConnected
      : nodeFillDefault;
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = nodeStroke;
    ctx.stroke();

    // Node text label
    if (isHovered || zoomLevel > 0.8 || node.linkCount > 0) {
      ctx.font = `${Math.max(10, 11 / zoomLevel)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = isHovered ? textHoverColor : textLabelColor;
      ctx.textAlign = 'center';
      ctx.fillText(node.title, node.x, node.y + node.radius + 12);
    }
  }
}
