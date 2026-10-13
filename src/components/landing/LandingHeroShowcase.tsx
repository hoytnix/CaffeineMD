'use client';

import React, { useState } from 'react';
import {
  Terminal,
  Play,
  Rocket,
  Search,
  RotateCcw,
  ExternalLink,
  CheckCircle2,
  FileCode2,
  Sparkles,
} from 'lucide-react';

export type ShowcaseTab = 'sandbox' | 'deploy' | 'refactor';

export const LandingHeroShowcase: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ShowcaseTab>('sandbox');

  return (
    <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0d1310]/95 backdrop-blur-xl shadow-2xl overflow-hidden text-left">
      {/* Window Chrome Header with Tabs */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 border-b border-white/10 bg-white/[0.02] gap-3">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500/80" />
          <span className="w-3 h-3 rounded-full bg-amber-500/80" />
          <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
        </div>

        {/* Interactive Showcase Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-lg bg-black/40 border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('sandbox')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              activeTab === 'sandbox'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-[#87968e] hover:text-white hover:bg-white/5'
            }`}
          >
            <Play className="w-3 h-3 text-emerald-400" />
            <span>Live WASM Code Runner</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deploy')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              activeTab === 'deploy'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-[#87968e] hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Vibe PWA &amp; Deploy</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('refactor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all ${
              activeTab === 'refactor'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shadow-sm'
                : 'text-[#87968e] hover:text-white hover:bg-white/5'
            }`}
          >
            <Search className="w-3 h-3 text-emerald-400" />
            <span>Vault-Wide RegEx</span>
          </button>
        </div>

        <div className="text-[11px] font-mono text-[#6e7e75] hidden sm:block">
          100% CLIENT-SIDE • 0ms SERVER
        </div>
      </div>

      {/* Dynamic Interactive Tab Content */}
      <div className="p-5 sm:p-7 font-mono text-xs sm:text-sm text-[#c8d4ce] min-h-[310px] flex flex-col justify-between">
        {activeTab === 'sandbox' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1 border-b border-white/5 text-xs text-[#87968e]">
              <div className="flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white font-medium">analysis.py</span>
                <span className="text-[11px] text-[#6e7e75]">Pyodide WASM Runtime • Web Worker Isolated</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30">
                42ms execution
              </span>
            </div>

            {/* Python Code Block */}
            <div className="p-4 rounded-xl bg-black/60 border border-white/10 font-mono text-xs sm:text-sm text-[#e1e7e4] leading-relaxed shadow-inner">
              <span className="text-purple-400 font-semibold">import</span> numpy{' '}
              <span className="text-purple-400 font-semibold">as</span> np<br />
              data = [<span className="text-amber-400">12.4</span>,{' '}
              <span className="text-amber-400">18.9</span>,{' '}
              <span className="text-amber-400">24.1</span>,{' '}
              <span className="text-amber-400">31.7</span>,{' '}
              <span className="text-amber-400">45.2</span>]<br />
              <span className="text-blue-400">print</span>(
              <span className="text-emerald-300">f&quot;Mean: &#123;np.mean(data):.2f&#125; | StdDev: &#123;np.std(data):.2f&#125;&quot;</span>
              )
            </div>

            {/* Standard Output Terminal */}
            <div className="p-3.5 rounded-xl bg-[#080d0a] border border-emerald-500/20 text-emerald-300 font-mono text-xs space-y-1">
              <div className="flex items-center justify-between text-[11px] text-[#87968e] border-b border-emerald-950 pb-1">
                <span>TERMINAL OUTPUT (STDOUT)</span>
                <span className="text-emerald-400">Thread #1 Clean Exit (code 0)</span>
              </div>
              <div className="pt-1 text-emerald-200">
                <span className="text-[#6e7e75] select-none">&gt; </span>
                Mean: 26.46 | StdDev: 11.45
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deploy' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1 border-b border-white/5 text-xs text-[#87968e]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white font-medium">Vibe PWA Studio • Gemini BYOK</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[11px] font-semibold border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live • 200 OK
              </span>
            </div>

            {/* Packaging HUD */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div className="p-3 rounded-lg bg-black/50 border border-white/5 flex items-start gap-2.5">
                <FileCode2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white text-xs font-semibold">_template.html</div>
                  <div className="text-[11px] text-[#87968e]">Jinja2 Vibe Theme</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/50 border border-white/5 flex items-start gap-2.5">
                <FileCode2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white text-xs font-semibold">manifest.webmanifest</div>
                  <div className="text-[11px] text-[#87968e]">Standalone PWA Bundle</div>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-black/50 border border-white/5 flex items-start gap-2.5">
                <FileCode2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="text-white text-xs font-semibold">sw.js</div>
                  <div className="text-[11px] text-[#87968e]">Cache-First Worker</div>
                </div>
              </div>
            </div>

            {/* Deployment Stream Banner */}
            <div className="p-3.5 rounded-xl bg-[#080d0a] border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-[#c8d4ce]">
                  Vibe: &quot;Cyberpunk Glass&quot; compiled to vault &amp; shipped in 1.4s
                </span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 font-mono text-xs">
                <span>https://notes.netlify.app</span>
                <ExternalLink className="w-3 h-3 text-emerald-400" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'refactor' && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-1 border-b border-white/5 text-xs text-[#87968e]">
              <div className="flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-white font-medium">Vault-Wide RegEx Engine</span>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 text-[11px] font-semibold border border-amber-500/30">
                <RotateCcw className="w-3 h-3" />
                <span>Undo Batch Replace (Snapshot #1042)</span>
              </div>
            </div>

            {/* RegEx Pattern Query Box */}
            <div className="p-3 rounded-xl bg-black/60 border border-white/10 flex flex-wrap items-center gap-2 text-xs">
              <span className="text-[#87968e]">Query:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-mono">
                /TODO:\s*(.*)/g
              </span>
              <span className="text-[#87968e]">→ Replace:</span>
              <span className="px-2 py-0.5 rounded bg-blue-950/80 border border-blue-500/40 text-blue-300 font-mono">
                DONE: $1
              </span>
              <span className="text-[11px] text-[#6e7e75] ml-auto">2 files matched in 12ms</span>
            </div>

            {/* Line Diff Highlights */}
            <div className="p-3 rounded-xl bg-[#080d0a] border border-white/10 space-y-2 text-xs font-mono">
              <div className="text-[11px] text-[#87968e] flex items-center justify-between">
                <span>notes/roadmap.md:14</span>
                <span className="text-emerald-400 text-[10px]">Atomic Transaction Committed</span>
              </div>
              <div className="space-y-1 bg-black/40 p-2 rounded border border-white/5">
                <div className="text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded">
                  - TODO: Deploy edge PWA
                </div>
                <div className="text-emerald-300 bg-emerald-950/30 px-2 py-0.5 rounded">
                  + DONE: Deploy edge PWA
                </div>
              </div>

              <div className="text-[11px] text-[#87968e] pt-1">
                notes/research.md:28
              </div>
              <div className="space-y-1 bg-black/40 p-2 rounded border border-white/5">
                <div className="text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded">
                  - TODO: Benchmark Pyodide cold start
                </div>
                <div className="text-emerald-300 bg-emerald-950/30 px-2 py-0.5 rounded">
                  + DONE: Benchmark Pyodide cold start
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer Metrics Row */}
        <div className="flex flex-wrap items-center justify-between pt-4 border-t border-white/5 text-[11px] text-[#6e7e75]">
          <div className="flex items-center gap-4">
            <span>⚡ 0ms Network Latency</span>
            <span>💾 Client IndexedDB</span>
            <span>🔒 Zero Cloud Telemetry</span>
          </div>
          <span className="text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Living Workstation Ready
          </span>
        </div>
      </div>
    </div>
  );
};
