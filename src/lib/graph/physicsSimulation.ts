import * as d3 from 'd3-force';
import { GraphNode, GraphLink } from '@/src/hooks/useGraphData';

export interface SimulationConfig {
  linkDistance?: number;
  chargeStrength?: number;
  collisionPadding?: number;
  alphaDecay?: number;
  velocityDecay?: number;
}

export const DEFAULT_SIMULATION_CONFIG: Required<SimulationConfig> = {
  linkDistance: 70,
  chargeStrength: -120,
  collisionPadding: 6,
  alphaDecay: 0.0228,
  velocityDecay: 0.4,
};

/**
 * Creates and starts a d3-force numerical simulation for graph nodes and links
 */
export function createGraphSimulation(
  nodes: GraphNode[],
  links: GraphLink[],
  width: number,
  height: number,
  onTick?: () => void,
  config: SimulationConfig = {}
): d3.Simulation<GraphNode, GraphLink> {
  const merged = { ...DEFAULT_SIMULATION_CONFIG, ...config };

  const sim = d3
    .forceSimulation<GraphNode>(nodes)
    .alphaDecay(merged.alphaDecay)
    .velocityDecay(merged.velocityDecay)
    .force(
      'link',
      d3
        .forceLink<GraphNode, GraphLink>(links)
        .id((d) => d.id)
        .distance(merged.linkDistance)
    )
    .force('charge', d3.forceManyBody().strength(merged.chargeStrength))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius((d: any) => d.radius + merged.collisionPadding));

  if (onTick) {
    sim.on('tick', onTick);
  }

  return sim;
}

/**
 * Pure Euler / Verlet numerical step for headless simulation or physics boundary clamping
 */
export function applyBoundaryConstraints(
  nodes: GraphNode[],
  width: number,
  height: number,
  padding = 20
) {
  for (const node of nodes) {
    if (node.x !== undefined) {
      node.x = Math.max(padding, Math.min(width - padding, node.x));
    }
    if (node.y !== undefined) {
      node.y = Math.max(padding, Math.min(height - padding, node.y));
    }
  }
}
