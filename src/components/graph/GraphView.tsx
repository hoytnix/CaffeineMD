'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as d3 from 'd3-force';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { useGraphData, GraphNode, GraphLink } from '@/src/hooks/useGraphData';
import { renderGraphCanvas } from '@/src/lib/graph/graphCanvasRenderer';
import { getThemeDefinition } from '@/src/lib/themes/themeDefinitions';
import { GraphControls } from './GraphControls';

export function GraphView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { openFileTab, theme, themeId, customTheme, customThemeColors } = useWorkspaceStore();

  const activeThemeId = theme || themeId || 'dark';
  const activeCustomTheme = customThemeColors || customTheme;

  const themeColors = useMemo(() => {
    const def = getThemeDefinition(activeThemeId, activeCustomTheme);
    const bgImage = def.bgImageUrl || def.backgroundImageUrl;
    const hasBgImage = Boolean(bgImage || def.backgroundGradient);
    return {
      bgPrimary: def.background,
      bgCard: def.card,
      border: def.border,
      textPrimary: def.foreground,
      textSecondary: def.foreground,
      textMuted: def.isDark ? '#94a3b8' : '#64748b',
      accent: def.accent,
      bgImageUrl: bgImage,
      backgroundGradient: def.backgroundGradient,
      hasBgImage,
    };
  }, [activeThemeId, activeCustomTheme]);

  const [filterTag, setFilterTag] = useState<string>('all');
  const [showOrphans, setShowOrphans] = useState(true);
  const [colorByEisenhower, setColorByEisenhower] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  const { nodes, links, availableTags, nodeCount, edgeCount } = useGraphData({
    filterTag,
    showOrphans,
  });

  // Transform / Zoom
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  const renderCurrentCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderGraphCanvas({
      canvas,
      nodes: nodesRef.current,
      links: linksRef.current,
      hoveredNode,
      transform: transformRef.current,
      colorByEisenhower,
      themeColors,
    });
  }, [hoveredNode, colorByEisenhower, themeColors]);

  // Sync simulation when nodes/links change
  useEffect(() => {
    nodesRef.current = nodes;
    linksRef.current = links;

    const canvas = canvasRef.current;
    const width = canvas ? canvas.clientWidth : 800;
    const height = canvas ? canvas.clientHeight : 600;

    if (simulationRef.current) simulationRef.current.stop();

    const sim = d3
      .forceSimulation<GraphNode>(nodes)
      .force(
        'link',
        d3
          .forceLink<GraphNode, GraphLink>(links)
          .id((d) => d.id)
          .distance(70)
      )
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius((d: any) => d.radius + 6));

    simulationRef.current = sim;
    sim.on('tick', () => {
      renderCurrentCanvas();
    });

    return () => {
      sim.stop();
    };
  }, [nodes, links, renderCurrentCanvas]);

  // Canvas Mouse Interactions
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingRef.current) {
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      transformRef.current.x += dx;
      transformRef.current.y += dy;
      dragStartRef.current = { x: e.clientX, y: e.clientY };
      renderCurrentCanvas();
      return;
    }

    // Hit test for hovered node
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const { x, y, k } = transformRef.current;
    const worldX = (mouseX - x) / k;
    const worldY = (mouseY - y) / k;

    let found: GraphNode | null = null;
    for (const node of nodesRef.current) {
      if (node.x === undefined || node.y === undefined) continue;
      const dist = Math.hypot(node.x - worldX, node.y - worldY);
      if (dist <= node.radius + 4) {
        found = node;
        break;
      }
    }

    if (found?.id !== hoveredNode?.id) {
      setHoveredNode(found);
      canvas.style.cursor = found ? 'pointer' : 'grab';
    }
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleClick = () => {
    if (hoveredNode) {
      openFileTab(hoveredNode.path, hoveredNode.title);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newK = Math.max(0.2, Math.min(4, transformRef.current.k * zoomFactor));

    // Zoom toward cursor
    transformRef.current.x = mouseX - (mouseX - transformRef.current.x) * (newK / transformRef.current.k);
    transformRef.current.y = mouseY - (mouseY - transformRef.current.y) * (newK / transformRef.current.k);
    transformRef.current.k = newK;

    renderCurrentCanvas();
  };

  const zoom = (factor: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.clientWidth / 2;
    const cy = canvas.clientHeight / 2;
    const newK = Math.max(0.2, Math.min(4, transformRef.current.k * factor));

    transformRef.current.x = cx - (cx - transformRef.current.x) * (newK / transformRef.current.k);
    transformRef.current.y = cy - (cy - transformRef.current.y) * (newK / transformRef.current.k);
    transformRef.current.k = newK;

    renderCurrentCanvas();
  };

  const resetView = () => {
    transformRef.current = { x: 0, y: 0, k: 1 };
    renderCurrentCanvas();
  };

  // Re-render canvas when theme colors change
  useEffect(() => {
    renderCurrentCanvas();
  }, [themeColors, renderCurrentCanvas]);

  return (
    <div
      style={{ color: 'var(--theme-text-primary)' }}
      className="relative w-full h-full overflow-hidden flex flex-col select-none bg-transparent"
    >
      <GraphControls
        filterTag={filterTag}
        onFilterTagChange={setFilterTag}
        availableTags={availableTags}
        showOrphans={showOrphans}
        onToggleOrphans={() => setShowOrphans((prev) => !prev)}
        colorByEisenhower={colorByEisenhower}
        onToggleColorByEisenhower={() => setColorByEisenhower((prev) => !prev)}
        nodeCount={nodeCount}
        edgeCount={edgeCount}
        onZoomIn={() => zoom(1.2)}
        onZoomOut={() => zoom(0.8)}
        onResetZoom={resetView}
      />

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        onWheel={handleWheel}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
}
