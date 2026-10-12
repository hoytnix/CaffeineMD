'use client';

import React from 'react';
import { Keyboard } from 'lucide-react';
import { InstallButton } from './InstallButton';
import { PwaInstallState } from './hooks/usePwaInstall';

interface LandingShortcutsProps {
  installState: PwaInstallState;
}

export const LandingShortcuts: React.FC<LandingShortcutsProps> = ({ installState }) => {
  const shortcuts = [
    { key: '⌘K / Ctrl+K', label: 'Quick Search', desc: 'Fuzzy file & heading palette' },
    { key: '/', label: 'Slash Commands', desc: 'Insert tables, code blocks, task lists' },
    { key: '[[', label: 'WikiLinks', desc: 'Bidirectional note mention suggest' },
    { key: 'Shift + Space', label: 'Emoji Drawer', desc: 'Universal Noto Color emoji picker' },
    { key: '⌘S / Ctrl+S', label: 'Force Save', desc: 'Immediate disk sync flush' },
    { key: '⌘B / ⌘I', label: 'Rich Styling', desc: 'Bold, italic, and underline toggles' },
  ];

  return (
    <section id="shortcuts" className="py-20 px-4 max-w-5xl mx-auto border-t border-white/5">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-950/30 text-emerald-400 text-xs font-mono uppercase mb-4">
          <Keyboard className="w-3.5 h-3.5" />
          <span>Frictionless Flow State</span>
        </div>
        <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Engineered for keyboard obsessives.
        </h3>
        <p className="text-base text-[#94a39b]">
          Never take your fingers off the home row. Every command is instantly accessible.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-12">
        {shortcuts.map((sc) => (
          <div
            key={sc.key}
            className="p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-colors"
          >
            <div className="inline-block px-2.5 py-1 rounded-md bg-black/60 border border-emerald-500/30 font-mono text-emerald-300 text-xs font-semibold mb-3">
              {sc.key}
            </div>
            <div className="text-white font-medium text-sm mb-1">{sc.label}</div>
            <div className="text-[#87968e] text-xs">{sc.desc}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <InstallButton installState={installState} size="md" />
      </div>
    </section>
  );
};
