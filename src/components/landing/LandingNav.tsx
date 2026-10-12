'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { InstallButton } from './InstallButton';
import { PwaInstallState } from './hooks/usePwaInstall';

interface LandingNavProps {
  installState: PwaInstallState;
}

export const LandingNav: React.FC<LandingNavProps> = ({ installState }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-[#090d0b]/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-white text-lg tracking-tight">
          <span className="text-xl">☕</span>
          <span className="bg-gradient-to-r from-white via-emerald-100 to-emerald-400 bg-clip-text text-transparent">
            CaffeineMD
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-[#94a39b]">
          <a href="#features" className="hover:text-emerald-400 transition-colors">Features</a>
          <a href="#compare" className="hover:text-emerald-400 transition-colors">Why Local-First</a>
          <a href="#shortcuts" className="hover:text-emerald-400 transition-colors">Shortcuts</a>
          <a href="#architecture" className="hover:text-emerald-400 transition-colors">Stack</a>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={installState.editorHref}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-medium text-[#c8d4ce] hover:text-white px-3 py-1.5 rounded-lg border border-white/10 hover:border-white/20 transition-colors"
          >
            <span>Launch Web</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-400" />
          </Link>
          <InstallButton installState={installState} size="sm" label="Install" />
        </div>
      </div>
    </header>
  );
};
