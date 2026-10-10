import { GraphNode, GraphLink } from '@/src/hooks/useGraphData';

interface RenderOptions {
  canvas: HTMLCanvasElement;
  nodes: GraphNode[];
  links: GraphLink[];
  hoveredNode: GraphNode | null;
  transform: { x: number; y: number; k: number };
}

export function renderGraphCanvas({
  canvas,
  nodes,
  links,
  hoveredNode,
  transform,
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

  // Apply zoom/pan
  const { x, y, k } = transform;
  ctx.translate(x, y);
  ctx.scale(k, k);

  // Render Edges
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.35;
  links.forEach((link) => {
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
  });

  // Render Nodes
  ctx.globalAlpha = 1;
  nodes.forEach((node) => {
    if (node.x === undefined || node.y === undefined) return;

    const isHovered = hoveredNode?.id === node.id;

    // Outer glow for hovered
    if (isHovered) {
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius + 4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
      ctx.fill();
    }

    // Circle
    ctx.beginPath();
    ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
    ctx.fillStyle = isHovered ? '#6366f1' : node.linkCount > 1 ? '#4f46e5' : '#64748b';
    ctx.fill();
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Label
    if (isHovered || k > 0.8 || node.linkCount > 0) {
      ctx.font = `${Math.max(10, 11 / k)}px ui-sans-serif, system-ui, sans-serif`;
      ctx.fillStyle = isHovered ? '#4338ca' : '#475569';
      ctx.textAlign = 'center';
      ctx.fillText(node.title, node.x, node.y + node.radius + 12);
    }
  });

  ctx.restore();
}
