'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Terminal } from 'lucide-react';
import { InstallButton } from './InstallButton';
import { PwaInstallState } from './hooks/usePwaInstall';

interface LandingHeroProps {
  installState: PwaInstallState;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ installState }) => {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 flex flex-col items-center text-center max-w-5xl mx-auto">
      {/* Brand Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-8 backdrop-blur-sm shadow-inner shadow-emerald-500/10">
        <span className="animate-pulse">☕</span>
        <span>Local-First Personal Knowledge Base</span>
      </div>

      {/* Primary Headline */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]">
        Your thoughts at the speed of <span className="text-emerald-400">CaffeineMD</span>.
      </h1>

      {/* Subheading */}
      <p className="text-base sm:text-lg md:text-xl text-[#94a39b] max-w-2xl mb-10 leading-relaxed font-normal">
        Zero cloud latency. Zero subscription lock-in. A keyboard-driven Markdown wiki powered by IndexedDB and the Native File System Access API. Run it as a high-performance native desktop app.
      </p>

      {/* Action CTAs */}
      <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto mb-16">
        <InstallButton installState={installState} size="lg" />

        <Link
          href={installState.editorHref}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-white font-medium text-base transition-all duration-150"
        >
          <span>Launch Web App</span>
          <ArrowRight className="w-4 h-4 text-emerald-400" />
        </Link>
      </div>

      {/* Badass Live Editor Window Mockup */}
      <div className="w-full max-w-4xl rounded-2xl border border-white/10 bg-[#0d1310]/90 backdrop-blur-xl shadow-2xl overflow-hidden text-left">
        {/* Window Chrome Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <div className="ml-4 flex items-center gap-2 px-3 py-1 rounded-md bg-white/[0.04] text-xs font-mono text-emerald-400 border border-white/5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Welcome to CaffeineMD.md</span>
            </div>
          </div>
          <div className="text-[11px] font-mono text-[#6e7e75] hidden sm:block">
            100% LOCAL • INDEXEDDB SYNCED
          </div>
        </div>

        {/* Mock Editor Canvas Body */}
        <div className="p-6 sm:p-8 font-mono text-xs sm:text-sm text-[#c8d4ce] space-y-4">
          <div className="p-3.5 rounded-lg bg-black/40 border border-emerald-500/20 text-[#87968e]">
            <span className="text-emerald-500 font-bold">---</span><br />
            <span className="text-emerald-300">title:</span> Sovereign Knowledge Architecture<br />
            <span className="text-emerald-300">tags:</span> [local-first, markdown, tiptap, d3-graph]<br />
            <span className="text-emerald-300">status:</span> active<br />
            <span className="text-emerald-500 font-bold">---</span>
          </div>

          <p className="text-white text-base sm:text-lg font-sans font-semibold pt-2">
            # The Local-First Personal Wiki
          </p>
          <p className="font-sans text-[#94a39b] leading-relaxed">
            Your notes reside directly on your hardware. Fast offline execution with bi-directional{' '}
            <span className="text-emerald-400 font-mono underline underline-offset-4 decoration-emerald-500/40">
              [[Knowledge Graph]]
            </span>{' '}
            linking and frictionless Markdown export.
          </p>

          <div className="flex flex-wrap items-center justify-between pt-4 border-t border-white/5 text-[11px] text-[#6e7e75]">
            <div className="flex items-center gap-4">
              <span>⚡ 0ms Input Latency</span>
              <span>💾 File System Mounted</span>
              <span>🔗 24 Backlinks</span>
            </div>
            <span className="text-emerald-400">● Auto-Saved</span>
          </div>
        </div>
      </div>
    </section>
  );
};
