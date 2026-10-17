'use client';

import { useRef, useCallback, RefObject } from 'react';
import { GraphNode } from '@/src/hooks/useGraphData';

export interface GraphTransform {
  x: number;
  y: number;
  k: number;
}

export interface UseGraphCanvasTransformProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  nodes: GraphNode[];
  hoveredNode: GraphNode | null;
  setHoveredNode: (node: GraphNode | null) => void;
  onSelectNode: (node: GraphNode) => void;
  onRender: (transform: GraphTransform) => void;
}

/**
 * Manages canvas pan/zoom affine transform state, wheel zooming,
 * drag panning, and node hit-testing for the Knowledge Graph.
 */
export function useGraphCanvasTransform({
  canvasRef,
  nodes,
  hoveredNode,
  setHoveredNode,
  onSelectNode,
  onRender,
}: UseGraphCanvasTransformProps) {
  const transformRef = useRef<GraphTransform>({ x: 0, y: 0, k: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    dragStartRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (isDraggingRef.current) {
        const dx = e.clientX - dragStartRef.current.x;
        const dy = e.clientY - dragStartRef.current.y;
        transformRef.current.x += dx;
        transformRef.current.y += dy;
        dragStartRef.current = { x: e.clientX, y: e.clientY };
        onRender(transformRef.current);
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const { x, y, k } = transformRef.current;
      const worldX = (mouseX - x) / k;
      const worldY = (mouseY - y) / k;

      let found: GraphNode | null = null;
      for (const node of nodes) {
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
    },
    [canvasRef, nodes, hoveredNode, setHoveredNode, onRender]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleClick = useCallback(() => {
    if (hoveredNode) {
      onSelectNode(hoveredNode);
    }
  }, [hoveredNode, onSelectNode]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      const newK = Math.max(0.2, Math.min(4, transformRef.current.k * zoomFactor));

      transformRef.current.x =
        mouseX - (mouseX - transformRef.current.x) * (newK / transformRef.current.k);
      transformRef.current.y =
        mouseY - (mouseY - transformRef.current.y) * (newK / transformRef.current.k);
      transformRef.current.k = newK;

      onRender(transformRef.current);
    },
    [canvasRef, onRender]
  );

  const zoom = useCallback(
    (factor: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const cx = canvas.clientWidth / 2;
      const cy = canvas.clientHeight / 2;
      const newK = Math.max(0.2, Math.min(4, transformRef.current.k * factor));

      transformRef.current.x =
        cx - (cx - transformRef.current.x) * (newK / transformRef.current.k);
      transformRef.current.y =
        cy - (cy - transformRef.current.y) * (newK / transformRef.current.k);
      transformRef.current.k = newK;

      onRender(transformRef.current);
    },
    [canvasRef, onRender]
  );

  const resetView = useCallback(() => {
    transformRef.current = { x: 0, y: 0, k: 1 };
    onRender(transformRef.current);
  }, [onRender]);

  return {
    transformRef,
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
    handleClick,
    handleWheel,
    zoom,
    resetView,
  };
}
