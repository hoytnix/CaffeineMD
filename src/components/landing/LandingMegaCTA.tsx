'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Cpu, HardDrive } from 'lucide-react';
import { InstallButton } from './InstallButton';
import { PwaInstallState } from './hooks/usePwaInstall';

interface LandingMegaCTAProps {
  installState: PwaInstallState;
}

export const LandingMegaCTA: React.FC<LandingMegaCTAProps> = ({ installState }) => {
  return (
    <section className="relative py-24 px-4 text-center max-w-4xl mx-auto border-t border-white/5">
      {/* Background radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-72 bg-emerald-500/10 blur-[100px] pointer-events-none" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 text-xs font-mono uppercase tracking-wider mb-6">
          <span>☕</span>
          <span>Instant One-Click PWA Setup</span>
        </div>

        <h3 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-tight">
          Stop renting your mind.{' '}
          <span className="text-emerald-400">Start owning your thoughts.</span>
        </h3>

        <p className="text-base sm:text-lg text-[#94a39b] max-w-2xl mx-auto mb-10 leading-relaxed">
          Install CaffeineMD directly to your desktop or mobile home screen. No credit cards, no passwords, no cloud servers between you and your markdown files.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
          <InstallButton installState={installState} size="lg" />

          <Link
            href={installState.editorHref}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 hover:bg-white/5 text-white font-medium text-base transition-all duration-150"
          >
            <span>Launch Web App</span>
            <ArrowRight className="w-4 h-4 text-emerald-400" />
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-xs text-[#87968e]">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-4 h-4 text-emerald-400" />
            <span>Local IndexedDB</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>0ms Processing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>100% Data Sovereignty</span>
          </div>
        </div>
      </div>
    </section>
  );
};
