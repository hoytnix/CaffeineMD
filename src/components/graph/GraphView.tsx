'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3-force';
import { db, VaultFile, BacklinkRecord } from '@/src/lib/storage/db';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { ZoomIn, ZoomOut, RotateCcw, Filter, Eye, Hash } from 'lucide-react';

interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  path: string;
  tags: string[];
  linkCount: number;
  radius: number;
}

interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

export function GraphView() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { openFileTab } = useWorkspaceStore();

  const [filterTag, setFilterTag] = useState<string>('all');
  const [showOrphans, setShowOrphans] = useState(true);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);

  // Transform / Zoom
  const transformRef = useRef({ x: 0, y: 0, k: 1 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0 });

  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

  const renderCanvas = React.useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI
    const dpr = window.devicePixelRatio || 1;
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
    const { x, y, k } = transformRef.current;
    ctx.translate(x, y);
    ctx.scale(k, k);

    // Render Edges
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.35;
    linksRef.current.forEach((link) => {
      const source = link.source as GraphNode;
      const target = link.target as GraphNode;
      if (source.x !== undefined && source.y !== undefined && target.x !== undefined && target.y !== undefined) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();
      }
    });

    // Render Nodes
    ctx.globalAlpha = 1;
    nodesRef.current.forEach((node) => {
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
  }, [hoveredNode]);

  useEffect(() => {
    async function loadGraphData() {
      const files = await db.files.where('isBinary').equals(0).toArray();
      const backlinks = await db.backlinks.toArray();

      // Collect tags
      const tagSet = new Set<string>();
      files.forEach((f) => f.tags?.forEach((t) => tagSet.add(t)));
      setAvailableTags(Array.from(tagSet));

      // Calculate link counts per node
      const linkCounts = new Map<string, number>();
      backlinks.forEach((bl) => {
        const targetTitle = bl.targetTitle.toLowerCase();
        linkCounts.set(targetTitle, (linkCounts.get(targetTitle) || 0) + 1);
        const sourcePath = bl.sourcePath.toLowerCase();
        linkCounts.set(sourcePath, (linkCounts.get(sourcePath) || 0) + 1);
      });

      // Filter nodes
      let graphNodes: GraphNode[] = files.map((f) => {
        const title = f.title || f.name.replace(/\.[^/.]+$/, '');
        const count = linkCounts.get(title.toLowerCase()) || linkCounts.get(f.path.toLowerCase()) || 0;
        return {
          id: f.path,
          title,
          path: f.path,
          tags: f.tags || [],
          linkCount: count,
          radius: Math.min(18, Math.max(5, 5 + count * 2.5)),
        };
      });

      if (filterTag !== 'all') {
        graphNodes = graphNodes.filter((n) => n.tags.includes(filterTag));
      }

      // Filter links
      const nodeIdSet = new Set(graphNodes.map((n) => n.id));
      const titleToIdMap = new Map<string, string>();
      graphNodes.forEach((n) => {
        titleToIdMap.set(n.title.toLowerCase(), n.id);
        titleToIdMap.set(n.path.toLowerCase(), n.id);
      });

      const graphLinks: GraphLink[] = [];
      backlinks.forEach((bl) => {
        const sourceId = titleToIdMap.get(bl.sourcePath.toLowerCase()) || titleToIdMap.get(bl.sourceTitle.toLowerCase());
        const targetId = titleToIdMap.get(bl.targetTitle.toLowerCase());

        if (sourceId && targetId && sourceId !== targetId && nodeIdSet.has(sourceId) && nodeIdSet.has(targetId)) {
          graphLinks.push({
            source: sourceId,
            target: targetId,
          });
        }
      });

      // Orphan filtering
      if (!showOrphans) {
        const connectedIds = new Set<string>();
        graphLinks.forEach((l) => {
          connectedIds.add(typeof l.source === 'string' ? l.source : (l.source as any).id);
          connectedIds.add(typeof l.target === 'string' ? l.target : (l.target as any).id);
        });
        graphNodes = graphNodes.filter((n) => connectedIds.has(n.id));
      }

      nodesRef.current = graphNodes;
      linksRef.current = graphLinks;
      setNodeCount(graphNodes.length);
      setEdgeCount(graphLinks.length);

      // Initialize D3 Force Simulation
      const canvas = canvasRef.current;
      const width = canvas ? canvas.clientWidth : 800;
      const height = canvas ? canvas.clientHeight : 600;

      if (simulationRef.current) simulationRef.current.stop();

      const sim = d3
        .forceSimulation<GraphNode>(graphNodes)
        .force(
          'link',
          d3
            .forceLink<GraphNode, GraphLink>(graphLinks)
            .id((d) => d.id)
            .distance(70)
        )
        .force('charge', d3.forceManyBody().strength(-120))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius((d: any) => d.radius + 6));

      simulationRef.current = sim;
      sim.on('tick', () => {
        renderCanvas();
      });
    }

    loadGraphData();
  }, [filterTag, showOrphans, renderCanvas]);

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
      renderCanvas();
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
      if (node.x !== undefined && node.y !== undefined) {
        const dist = Math.hypot(node.x - worldX, node.y - worldY);
        if (dist <= node.radius + 3) {
          found = node;
          break;
        }
      }
    }

    if (found !== hoveredNode) {
      setHoveredNode(found);
      renderCanvas();
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
    const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
    const newK = Math.max(0.2, Math.min(3, transformRef.current.k * zoomFactor));

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom towards mouse
    transformRef.current.x = mouseX - (mouseX - transformRef.current.x) * (newK / transformRef.current.k);
    transformRef.current.y = mouseY - (mouseY - transformRef.current.y) * (newK / transformRef.current.k);
    transformRef.current.k = newK;
    renderCanvas();
  };

  const handleResetZoom = () => {
    transformRef.current = { x: 0, y: 0, k: 1 };
    renderCanvas();
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-neutral-900 text-white relative select-none overflow-hidden">
      {/* Top Floating Controls Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 p-1.5 rounded-lg bg-neutral-900/80 backdrop-blur-md border border-neutral-800 text-xs shadow-lg">
        <div className="flex items-center gap-1 px-2 text-neutral-400">
          <Hash className="w-3.5 h-3.5" />
          <span>Tag:</span>
          <select
            value={filterTag}
            onChange={(e) => setFilterTag(e.target.value)}
            className="bg-transparent text-white outline-none cursor-pointer text-xs"
          >
            <option value="all" className="bg-neutral-900">All Tags</option>
            {availableTags.map((t) => (
              <option key={t} value={t} className="bg-neutral-900">
                #{t}
              </option>
            ))}
          </select>
        </div>

        <div className="w-[1px] h-4 bg-neutral-700 mx-1" />

        <button
          onClick={() => setShowOrphans(!showOrphans)}
          className={`flex items-center gap-1 px-2 py-1 rounded transition-colors ${
            showOrphans ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Orphans</span>
        </button>
      </div>

      {/* Top Right Stats */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-3 p-2 rounded-lg bg-neutral-900/80 backdrop-blur-md border border-neutral-800 text-xs text-neutral-400 shadow-lg font-mono">
        <div>
          Nodes: <span className="text-white font-semibold">{nodeCount}</span>
        </div>
        <div>
          Links: <span className="text-white font-semibold">{edgeCount}</span>
        </div>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={handleClick}
        className="w-full h-full cursor-grab active:cursor-grabbing bg-neutral-950"
      />

      {/* Bottom Zoom Controls */}
      <div className="absolute bottom-6 right-6 z-10 flex items-center gap-1.5 p-1 rounded-lg bg-neutral-900/85 backdrop-blur-md border border-neutral-800 shadow-xl">
        <button
          onClick={() => {
            transformRef.current.k = Math.min(3, transformRef.current.k * 1.2);
            renderCanvas();
          }}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            transformRef.current.k = Math.max(0.2, transformRef.current.k * 0.8);
            renderCanvas();
          }}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-1.5 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
          title="Reset View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Hover Node Tooltip */}
      {hoveredNode && (
        <div
          className="absolute bottom-6 left-6 z-10 p-3 rounded-lg bg-neutral-900/90 backdrop-blur-md border border-neutral-800 shadow-xl text-xs max-w-xs pointer-events-none"
        >
          <div className="font-semibold text-white truncate">{hoveredNode.title}</div>
          <div className="text-neutral-400 font-mono text-[11px] mt-0.5 truncate">{hoveredNode.path}</div>
          <div className="text-indigo-400 font-mono text-[11px] mt-1">
            {hoveredNode.linkCount} bidirectional {hoveredNode.linkCount === 1 ? 'connection' : 'connections'}
          </div>
          {hoveredNode.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1 text-[10px] text-neutral-400">
              {hoveredNode.tags.map((t) => (
                <span key={t}>#{t}</span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
