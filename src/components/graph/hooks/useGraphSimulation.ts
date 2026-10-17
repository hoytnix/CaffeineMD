'use client';

import { useEffect, useRef, RefObject } from 'react';
import * as d3 from 'd3-force';
import { GraphNode, GraphLink } from '@/src/hooks/useGraphData';

export interface UseGraphSimulationProps {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  nodes: GraphNode[];
  links: GraphLink[];
  onTick: () => void;
}

/**
 * Manages the D3 force simulation lifecycle, node/link reference synchronization,
 * and tick loop rendering for the Knowledge Graph canvas.
 */
export function useGraphSimulation({
  canvasRef,
  nodes,
  links,
  onTick,
}: UseGraphSimulationProps) {
  const nodesRef = useRef<GraphNode[]>([]);
  const linksRef = useRef<GraphLink[]>([]);
  const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink> | null>(null);

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
      onTick();
    });

    return () => {
      sim.stop();
    };
  }, [nodes, links, canvasRef, onTick]);

  return {
    nodesRef,
    linksRef,
    simulationRef,
  };
}
