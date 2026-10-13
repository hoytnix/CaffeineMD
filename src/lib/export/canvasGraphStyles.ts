export const CANVAS_GRAPH_MODAL_HTML = (nodeCount: number, edgeCount: number): string => `
<!-- Standalone 2D Canvas Knowledge Graph HUD -->
<div id="graph-hud-modal" class="graph-hud-overlay" style="display: none;" role="dialog" aria-modal="true" aria-label="Interactive Knowledge Graph">
  <div class="graph-hud-container">
    <div class="graph-hud-header">
      <div class="graph-hud-title">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
        <span>Interactive Vault Graph</span>
      </div>
      <div class="graph-hud-controls">
        <span class="graph-hud-badge">${nodeCount} nodes &bull; ${edgeCount} links</span>
        <button id="graph-hud-close" class="graph-close-btn" aria-label="Close Graph">&times;</button>
      </div>
    </div>
    <div class="graph-canvas-wrap">
      <canvas id="vault-graph-canvas"></canvas>
      <div id="graph-node-tooltip" class="graph-node-tooltip" style="display: none;"></div>
    </div>
  </div>
</div>
`;

export const CANVAS_GRAPH_STYLES = `
<style>
.graph-hud-overlay {
  position: fixed;
  inset: 0;
  z-index: 9998;
  background: rgba(0, 0, 0, 0.75);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.graph-hud-container {
  width: 100%;
  max-width: 960px;
  height: 80vh;
  background: var(--surface-glass, #12141c);
  border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.12));
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.7), 0 0 24px var(--border-glow, rgba(99, 102, 241, 0.2));
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.graph-hud-header {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--border-glass, rgba(255, 255, 255, 0.1));
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.graph-hud-title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--text-bright, #fff);
}
.graph-hud-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.graph-hud-badge {
  font-size: 0.75rem;
  color: var(--text-muted, #9ca3af);
  background: rgba(255, 255, 255, 0.06);
  padding: 0.25rem 0.65rem;
  border-radius: 9999px;
  border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.08));
}
.graph-close-btn {
  background: transparent;
  border: none;
  color: var(--text-muted, #9ca3af);
  font-size: 1.5rem;
  cursor: pointer;
  line-height: 1;
  transition: color 0.15s ease;
}
.graph-close-btn:hover { color: var(--text-bright, #fff); }
.graph-canvas-wrap {
  flex: 1;
  position: relative;
  overflow: hidden;
}
#vault-graph-canvas {
  width: 100%;
  height: 100%;
  display: block;
  cursor: grab;
}
#vault-graph-canvas:active { cursor: grabbing; }
.graph-node-tooltip {
  position: absolute;
  pointer-events: none;
  background: rgba(18, 20, 28, 0.95);
  border: 1px solid var(--border-glow, rgba(99, 102, 241, 0.4));
  border-radius: 8px;
  padding: 0.5rem 0.85rem;
  color: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.5);
  white-space: nowrap;
  transform: translate(-50%, -130%);
  z-index: 10;
}
.graph-hud-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: var(--surface-glass, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  color: var(--text-muted, #9ca3af);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.graph-hud-trigger-btn:hover { color: var(--accent-primary, #6366f1); border-color: var(--border-glow, rgba(99, 102, 241, 0.3)); }
</style>
`;
