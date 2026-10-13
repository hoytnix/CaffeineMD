'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { InstallButton } from './InstallButton';
import { PwaInstallState } from './hooks/usePwaInstall';
import { LandingHeroShowcase } from './LandingHeroShowcase';

interface LandingHeroProps {
  installState: PwaInstallState;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ installState }) => {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 flex flex-col items-center text-center max-w-5xl mx-auto">
      {/* Brand Badge */}
      <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-8 backdrop-blur-sm shadow-inner shadow-emerald-500/10">
        <span>⚡</span>
        <span>Next-Gen Markdown Canvas • In-Browser WASM Sandbox • 1-Click PWA Edge Drops</span>
      </div>

      {/* Primary Headline */}
      <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white mb-6 leading-[1.08]">
        Stop Taking Dead Notes. Run Living Code. Refactor Vaults.{' '}
        <span className="text-emerald-400">Ship Standalone PWAs in 1 Click.</span>
      </h1>

      {/* Subheading */}
      <p className="text-base sm:text-lg md:text-xl text-[#94a39b] max-w-3xl mb-10 leading-relaxed font-normal">
        The local-first Markdown workstation engineered for technical creators and deep thinkers.
        Execute Python and JavaScript inline via client-side WebAssembly, refactor entire repositories
        safely with atomic RegEx rollback, and publish production-ready PWAs directly to Netlify
        and GitHub Pages in seconds—with zero build tooling.
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

      {/* Interactive Window Showcase Component */}
      <LandingHeroShowcase />
    </section>
  );
};
