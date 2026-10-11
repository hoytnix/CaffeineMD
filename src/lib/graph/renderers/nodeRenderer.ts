import { GraphNode } from '@/src/hooks/useGraphData';
import { EISENHOWER_CONFIG } from '@/src/lib/storage/db';

export function renderNodes(
  ctx: CanvasRenderingContext2D,
  nodes: GraphNode[],
  hoveredNode: GraphNode | null,
  zoomLevel: number,
  colorByEisenhower = true
) {
  ctx.globalAlpha = 1;

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
      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.fill();
    }

    // Node body circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = isHovered
      ? '#6366f1'
      : colorByEisenhower && eqConfig
      ? eqConfig.color
      : node.linkCount > 1
      ? '#4f46e5'
      : '#64748b';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Node text label
    if (isHovered || zoomLevel > 0.8 || node.linkCount > 0) {
      ctx.font = `${Math.max(10, 11 / zoomLevel)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = isHovered ? '#4338ca' : '#475569';
      ctx.textAlign = 'center';
      ctx.fillText(node.title, node.x, node.y + node.radius + 12);
    }
  }
}
