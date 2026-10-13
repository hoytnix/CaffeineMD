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
    {
      keys: ['Cmd', 'Shift', 'H'],
      label: 'Vault-Wide RegEx Batch Find-and-Replace',
      desc: 'Multi-file pattern matcher with atomic commit & snapshot rollback',
    },
    {
      keys: ['Shift', 'Enter'],
      label: 'Execute Active Code Block in WASM Sandbox',
      desc: 'Client-side Pyodide Python & isolated JS Worker runner',
    },
    {
      keys: ['Cmd', '\\'],
      label: 'Toggle Dual-Pane Split View',
      desc: 'Independent scroll, notes, and dual editors side-by-side',
    },
    {
      keys: ['Cmd', 'E'],
      label: 'Quick-Export PWA & Edge Deployment Drawer',
      desc: '1-click Netlify zip drop, GitHub Pages, and PWA manifest packaging',
    },
    {
      keys: ['Cmd', 'P'],
      label: 'Instant Document Quick-Switcher',
      desc: 'Fuzzy jump across vault titles, tags, and YAML aliases',
    },
    {
      keys: ['Right Click'],
      label: 'Context-Aware Glassmorphic Command Menu',
      desc: 'Prose formatting, file actions, and instant math evaluation',
    },
  ];

  return (
    <section id="shortcuts" className="py-20 px-4 max-w-6xl mx-auto border-t border-white/5">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-950/30 text-emerald-400 text-xs font-mono uppercase mb-4">
          <Keyboard className="w-3.5 h-3.5" />
          <span>Frictionless Flow State</span>
        </div>
        <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Engineered for keyboard obsessives.
        </h3>
        <p className="text-base text-[#94a39b]">
          Never take your fingers off the home row. Every next-gen tool is mapped to instant hardware triggers.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 mb-12">
        {shortcuts.map((sc) => (
          <div
            key={sc.label}
            className="p-5 rounded-2xl bg-zinc-900/60 backdrop-blur-xl border border-white/10 hover:border-emerald-500/30 transition-all flex flex-col justify-between group"
          >
            <div>
              <div className="flex items-center gap-1.5 flex-wrap mb-4">
                {sc.keys.map((k, idx) => (
                  <React.Fragment key={k}>
                    <kbd className="px-2.5 py-1 rounded-md bg-black/70 border border-emerald-500/30 font-mono text-emerald-300 text-xs font-semibold shadow-inner group-hover:border-emerald-400/50 transition-colors">
                      {k}
                    </kbd>
                    {idx < sc.keys.length - 1 && (
                      <span className="text-[#6e7e75] text-xs font-mono select-none">+</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <h4 className="text-white font-semibold text-sm mb-1.5 leading-snug">
                {sc.label}
              </h4>
              <p className="text-[#87968e] text-xs leading-relaxed">
                {sc.desc}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
        <InstallButton installState={installState} size="md" />
      </div>
    </section>
  );
};
