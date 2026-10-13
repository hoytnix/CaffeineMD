'use client';

import React from 'react';
import {
  Rocket,
  Cpu,
  History,
  MousePointerClick,
  Sparkles,
} from 'lucide-react';
import { InstallButton } from './InstallButton';
import { PwaInstallState } from './hooks/usePwaInstall';

interface LandingFeaturesProps {
  installState: PwaInstallState;
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({ installState }) => {
  return (
    <section id="features" className="py-20 px-4 max-w-6xl mx-auto border-t border-white/5">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-3">
          NEXT-GEN CLIENT ARCHITECTURE
        </h2>
        <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Four Pillars of Computational Power
        </h3>
        <p className="text-base text-[#94a39b]">
          Zero remote servers. Zero build tooling. Experience a sovereign Markdown workstation engineered for raw client-side velocity.
        </p>
      </div>

      {/* 4-Pillar Asymmetric Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {/* Card 1: Vibe-Coded PWA Generator & 1-Click Edge Publishing (Span 2 Columns) */}
        <div className="md:col-span-2 bg-zinc-900/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all rounded-2xl p-8 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Sparkles className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-mono uppercase tracking-wide">
                AI Vibe Studio • Zero Build
              </span>
            </div>
            <h4 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Vibe-Coded PWA Generator &amp; 1-Click Edge Publishing
            </h4>
            <p className="text-sm sm:text-base text-[#94a39b] leading-relaxed mb-6">
              Package individual notes or entire vaults into offline-first standalone web apps styled with AI.
              Prompt Gemini via BYOK to vibe-code bespoke Jinja2 templates stored natively as editable <code className="text-emerald-300 font-mono text-xs">_template.html</code> files in your vault.
              Ship directly to Netlify edge CDNs or GitHub Pages with zero build steps, or export Capacitor and PWABuilder packages.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
            {['Gemini 3.8 BYOK', 'Client-Side Jinja Engine', 'Vault _template.html', 'Netlify Edge Stream', 'Capacitor-Ready'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-xs font-mono text-emerald-400/90"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card 2: Client-Side WASM Code Sandbox (Span 1 Column) */}
        <div className="md:col-span-1 bg-zinc-900/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all rounded-2xl p-8 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Cpu className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-mono uppercase tracking-wide">
                Living Documents
              </span>
            </div>
            <h4 className="text-xl sm:text-2xl font-bold text-white mb-3">
              In-Document Python &amp; JavaScript Execution
            </h4>
            <p className="text-sm text-[#94a39b] leading-relaxed mb-6">
              Execute data analysis, mathematical simulations, and scripts directly inside Markdown notes.
              Powered by in-browser Pyodide WebAssembly and isolated Web Workers with console interception
              and automatic 5-second infinite-loop protection.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
            {['Pyodide WASM', 'Zero Server Overhead', '1-Click Result Injection'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-xs font-mono text-emerald-400/90"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card 3: Vault-Wide RegEx Engine with Snapshot Undo (Span 1 Column) */}
        <div className="md:col-span-1 bg-zinc-900/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all rounded-2xl p-8 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <History className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-mono uppercase tracking-wide">
                Safe Vault Refactoring
              </span>
            </div>
            <h4 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Atomic Search &amp; Replace with Instant Rollback
            </h4>
            <p className="text-sm text-[#94a39b] leading-relaxed mb-6">
              Refactor tags, directory paths, and frontmatter across hundreds of IndexedDB documents in seconds.
              Review visual line diffs, select individual files to mutate, and rollback mistakes with one click using
              atomic transaction snapshots.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
            {['IndexedDB Atomic Commits', 'Per-File Checkboxes', 'Snapshot History'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-xs font-mono text-emerald-400/90"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        {/* Card 4: Native Desktop Ergonomics & Glassmorphic GUI (Span 2 Columns) */}
        <div className="md:col-span-2 bg-zinc-900/60 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all rounded-2xl p-8 flex flex-col justify-between group">
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <MousePointerClick className="w-6 h-6" />
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-emerald-300 text-xs font-mono uppercase tracking-wide">
                Desktop IDE Speed
              </span>
            </div>
            <h4 className="text-xl sm:text-2xl font-bold text-white mb-3">
              Glassmorphic Context Menus, Dual-Pane Split Views &amp; Minimap
            </h4>
            <p className="text-sm sm:text-base text-[#94a39b] leading-relaxed mb-6">
              Tailored right-click context menus for the file explorer, document tabs, and editor selections.
              Work across simultaneous documents with dual split panes, navigate long files using the Sublime-style
              code minimap, and track document structure with the ambient outline HUD.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
            {['Universal Context Menus', 'Multi-Pane Split', 'Canvas Minimap', 'Heading HUD'].map((tag) => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-md bg-white/[0.04] border border-white/10 text-xs font-mono text-emerald-400/90"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Interspersed CTA Banner */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-sm">
        <div className="text-left">
          <h4 className="text-xl font-bold text-white mb-1">Ready for a faster Markdown workflow?</h4>
          <p className="text-sm text-[#94a39b]">Install the standalone PWA in one click and keep your data 100% sovereign.</p>
        </div>
        <InstallButton installState={installState} size="md" />
      </div>
    </section>
  );
};
