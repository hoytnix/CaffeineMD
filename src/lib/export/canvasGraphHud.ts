export interface GraphNode {
  id: string;
  title: string;
  slug: string;
  tags: string[];
}

export interface GraphEdge {
  source: string;
  target: string;
}

export interface VaultGraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export function buildVaultGraphData(
  notes: Array<{
    id: string;
    title: string;
    slug: string;
    content: string;
    tags?: string[];
    frontmatter?: Record<string, any>;
  }>
): VaultGraphData {
  const nodes: GraphNode[] = notes.map((n) => {
    const tags = Array.isArray(n.tags) && n.tags.length > 0
      ? n.tags
      : (Array.isArray(n.frontmatter?.tags) ? n.frontmatter!.tags : []);
    return {
      id: `note-${n.slug}`,
      title: n.title,
      slug: n.slug,
      tags: tags.map(String),
    };
  });

  const nodeMap = new Map<string, string>();
  notes.forEach((n) => {
    nodeMap.set(n.title.toLowerCase().trim(), `note-${n.slug}`);
    nodeMap.set(n.slug.toLowerCase().trim(), `note-${n.slug}`);
  });

  const edges: GraphEdge[] = [];
  const edgeSet = new Set<string>();

  notes.forEach((n) => {
    const sourceId = `note-${n.slug}`;
    const rawContent = n.content || '';
    const wikiRegex = /\[\[(.*?)\]\]/g;
    let match: RegExpExecArray | null;

    while ((match = wikiRegex.exec(rawContent)) !== null) {
      const rawTarget = (match[1] || '').split('|')[0].trim();
      if (!rawTarget) continue;
      const targetClean = rawTarget.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const targetId = nodeMap.get(rawTarget.toLowerCase()) || nodeMap.get(targetClean);

      if (targetId && targetId !== sourceId) {
        const edgeKey = `${sourceId}->${targetId}`;
        if (!edgeSet.has(edgeKey)) {
          edgeSet.add(edgeKey);
          edges.push({ source: sourceId, target: targetId });
        }
      }
    }
  });

  return { nodes, edges };
}

import { CANVAS_GRAPH_MODAL_HTML, CANVAS_GRAPH_STYLES } from './canvasGraphStyles';

export function generateCanvasGraphSnippet(graphData: VaultGraphData): string {
  const graphJson = JSON.stringify(graphData);

  return `
${CANVAS_GRAPH_MODAL_HTML(graphData.nodes.length, graphData.edges.length)}
${CANVAS_GRAPH_STYLES}
<script>
window.__VAULT_GRAPH_DATA__ = ${graphJson};
(function() {
  var modal = document.getElementById('graph-hud-modal');
  var closeBtn = document.getElementById('graph-hud-close');
  var canvas = document.getElementById('vault-graph-canvas');
  var tooltip = document.getElementById('graph-node-tooltip');
  var rawData = window.__VAULT_GRAPH_DATA__ || { nodes: [], edges: [] };
  var animFrameId = null;
  var nodes = [];
  var edges = [];
  var hoveredNode = null;
  var draggedNode = null;
  var isInitialized = false;

  function initGraphData() {
    var width = canvas.clientWidth || 800;
    var height = canvas.clientHeight || 500;
    nodes = rawData.nodes.map(function(n, i) {
      var angle = (i / Math.max(1, rawData.nodes.length)) * 2 * Math.PI;
      var radius = 120 + Math.random() * 80;
      return {
        id: n.id,
        title: n.title,
        slug: n.slug,
        tags: n.tags || [],
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
        radius: 6,
      };
    });

    var nodeIndexMap = {};
    nodes.forEach(function(n, i) { nodeIndexMap[n.id] = i; });

    edges = rawData.edges.map(function(e) {
      return {
        source: nodeIndexMap[e.source],
        target: nodeIndexMap[e.target],
      };
    }).filter(function(e) { return e.source !== undefined && e.target !== undefined; });
  }

  function simulatePhysics(width, height) {
    var k = 75; // ideal spring length
    var repStrength = 1800;
    var centerGravity = 0.02;

    for (var i = 0; i < nodes.length; i++) {
      for (var j = i + 1; j < nodes.length; j++) {
        var dx = nodes[j].x - nodes[i].x;
        var dy = nodes[j].y - nodes[i].y;
        var dist = Math.sqrt(dx * dx + dy * dy) || 1;
        var f = repStrength / (dist * dist);
        var fx = (dx / dist) * f;
        var fy = (dy / dist) * f;
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }

    for (var e = 0; e < edges.length; e++) {
      var s = nodes[edges[e].source];
      var t = nodes[edges[e].target];
      var edx = t.x - s.x;
      var edy = t.y - s.y;
      var edist = Math.sqrt(edx * edx + edy * edy) || 1;
      var ef = (edist - k) * 0.05;
      var efx = (edx / edist) * ef;
      var efy = (edy / edist) * ef;
      s.vx += efx;
      s.vy += efy;
      t.vx -= efx;
      t.vy -= efy;
    }

    for (var n = 0; n < nodes.length; n++) {
      var node = nodes[n];
      if (node === draggedNode) continue;
      node.vx += (width / 2 - node.x) * centerGravity;
      node.vy += (height / 2 - node.y) * centerGravity;
      node.vx *= 0.85;
      node.vy *= 0.85;
      node.x += node.vx;
      node.y += node.vy;
      node.x = Math.max(20, Math.min(width - 20, node.x));
      node.y = Math.max(20, Math.min(height - 20, node.y));
    }
  }

  function renderGraph() {
    if (!canvas || !modal || modal.style.display !== 'flex') return;
    var ctx = canvas.getContext('2d');
    var dpr = window.devicePixelRatio || 1;
    var width = canvas.clientWidth;
    var height = canvas.clientHeight;

    if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
      canvas.width = width * dpr;
      canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    simulatePhysics(width, height);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 1.2;
    for (var e = 0; e < edges.length; e++) {
      var s = nodes[edges[e].source];
      var t = nodes[edges[e].target];
      ctx.beginPath();
      ctx.moveTo(s.x, s.y);
      ctx.lineTo(t.x, t.y);
      ctx.stroke();
    }

    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      var isHover = (n === hoveredNode);
      ctx.beginPath();
      ctx.arc(n.x, n.y, isHover ? 8 : 6, 0, 2 * Math.PI);
      ctx.fillStyle = isHover ? '#818cf8' : '#6366f1';
      ctx.shadowColor = isHover ? 'rgba(129, 140, 248, 0.8)' : 'rgba(99, 102, 241, 0.3)';
      ctx.shadowBlur = isHover ? 12 : 6;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.fillStyle = isHover ? '#ffffff' : '#9ca3af';
      ctx.font = (isHover ? 'bold ' : '') + '11px system-ui, sans-serif';
      ctx.fillText(n.title, n.x + 10, n.y + 4);
    }

    ctx.restore();
    animFrameId = requestAnimationFrame(renderGraph);
  }

  function openGraphModal() {
    if (!modal) return;
    modal.style.display = 'flex';
    if (!isInitialized) {
      initGraphData();
      isInitialized = true;
    }
    cancelAnimationFrame(animFrameId);
    animFrameId = requestAnimationFrame(renderGraph);
  }

  function closeGraphModal() {
    if (!modal) return;
    modal.style.display = 'none';
    cancelAnimationFrame(animFrameId);
  }

  function findNodeUnder(x, y) {
    for (var i = nodes.length - 1; i >= 0; i--) {
      var dx = nodes[i].x - x;
      var dy = nodes[i].y - y;
      if (Math.sqrt(dx * dx + dy * dy) <= 12) return nodes[i];
    }
    return null;
  }

  if (canvas) {
    canvas.addEventListener('mousemove', function(e) {
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      if (draggedNode) {
        draggedNode.x = x;
        draggedNode.y = y;
        return;
      }
      hoveredNode = findNodeUnder(x, y);
      if (hoveredNode && tooltip) {
        tooltip.style.display = 'block';
        tooltip.style.left = x + 'px';
        tooltip.style.top = y + 'px';
        tooltip.textContent = hoveredNode.title;
      } else if (tooltip) {
        tooltip.style.display = 'none';
      }
    });

    canvas.addEventListener('mousedown', function(e) {
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      draggedNode = findNodeUnder(x, y);
    });

    window.addEventListener('mouseup', function() {
      draggedNode = null;
    });

    canvas.addEventListener('click', function(e) {
      var rect = canvas.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;
      var target = findNodeUnder(x, y);
      if (target) {
        closeGraphModal();
        window.location.hash = target.id;
        if (typeof window.switchVaultNote === 'function') {
          window.switchVaultNote(target.id);
        }
      }
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeGraphModal);
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeGraphModal();
    });
  }

  window.openVaultGraph = openGraphModal;
})();
</script>`;
}
