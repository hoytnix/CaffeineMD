'use client';

import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { useGraphData, GraphNode } from '@/src/hooks/useGraphData';
import { renderGraphCanvas } from '@/src/lib/graph/graphCanvasRenderer';
import { getThemeDefinition } from '@/src/lib/themes/themeDefinitions';
import { GraphControls } from './GraphControls';
import { useGraphCanvasTransform, GraphTransform } from './hooks/useGraphCanvasTransform';
import { useGraphSimulation } from './hooks/useGraphSimulation';

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

  const renderWithTransform = useCallback(
    (transform: GraphTransform) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      renderGraphCanvas({
        canvas,
        nodes,
        links,
        hoveredNode,
        transform,
        colorByEisenhower,
        themeColors,
      });
    },
    [nodes, links, hoveredNode, colorByEisenhower, themeColors]
  );

  const {
    transformRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleWheel,
    zoom,
    resetView,
  } = useGraphCanvasTransform({
    canvasRef,
    nodes,
    hoveredNode,
    setHoveredNode,
    onSelectNode: (node) => openFileTab(node.path, node.title),
    onRender: renderWithTransform,
  });

  const renderCurrentCanvas = useCallback(() => {
    renderWithTransform(transformRef.current);
  }, [renderWithTransform, transformRef]);

  useGraphSimulation({
    canvasRef,
    nodes,
    links,
    onTick: renderCurrentCanvas,
  });

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
