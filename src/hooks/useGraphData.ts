'use client';

import { useMemo } from 'react';
import * as d3 from 'd3-force';
import { db, EisenhowerQuadrant } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';

export interface GraphNode extends d3.SimulationNodeDatum {
  id: string;
  title: string;
  path: string;
  tags: string[];
  linkCount: number;
  radius: number;
  eisenhower?: EisenhowerQuadrant;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

interface UseGraphDataOptions {
  filterTag: string;
  showOrphans: boolean;
}

export function useGraphData({ filterTag, showOrphans }: UseGraphDataOptions) {
  const rawFiles = useLiveQuery(() => db.files.filter((f) => !f.isBinary && !f.isTrash).toArray());
  const rawBacklinks = useLiveQuery(() => db.backlinks.toArray());

  const files = useMemo(() => rawFiles ?? [], [rawFiles]);
  const backlinks = useMemo(() => rawBacklinks ?? [], [rawBacklinks]);

  return useMemo(() => {
    // 1. Collect tags
    const tagSet = new Set<string>();
    files.forEach((f) => f.tags?.forEach((t) => tagSet.add(t)));
    const availableTags = Array.from(tagSet);

    // 2. Calculate link counts per node
    const linkCounts = new Map<string, number>();
    backlinks.forEach((bl) => {
      const targetTitle = bl.targetTitle.toLowerCase();
      linkCounts.set(targetTitle, (linkCounts.get(targetTitle) || 0) + 1);
      const sourcePath = bl.sourcePath.toLowerCase();
      linkCounts.set(sourcePath, (linkCounts.get(sourcePath) || 0) + 1);
    });

    // 3. Filter nodes
    let graphNodes: GraphNode[] = files.map((f) => {
      const title = f.title || f.name.replace(/\.[^/.]+$/, '');
      const count = linkCounts.get(title.toLowerCase()) || linkCounts.get(f.path.toLowerCase()) || 0;
      const eq = (f.eisenhower || f.frontmatter?.eisenhower) as EisenhowerQuadrant | undefined;
      return {
        id: f.path,
        title,
        path: f.path,
        tags: f.tags || [],
        linkCount: count,
        radius: Math.min(18, Math.max(5, 5 + count * 2.5)),
        eisenhower: eq,
      };
    });

    if (filterTag !== 'all') {
      graphNodes = graphNodes.filter((n) => n.tags.includes(filterTag));
    }

    // 4. Filter links
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

    // 5. Orphan filtering
    if (!showOrphans) {
      const connectedIds = new Set<string>();
      graphLinks.forEach((l) => {
        connectedIds.add(typeof l.source === 'string' ? l.source : (l.source as any).id);
        connectedIds.add(typeof l.target === 'string' ? l.target : (l.target as any).id);
      });
      graphNodes = graphNodes.filter((n) => connectedIds.has(n.id));
    }

    return {
      nodes: graphNodes,
      links: graphLinks,
      availableTags,
      nodeCount: graphNodes.length,
      edgeCount: graphLinks.length,
    };
  }, [files, backlinks, filterTag, showOrphans]);
}
