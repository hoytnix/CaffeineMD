'use client';

import React from 'react';
import { CheckCircle2, X, Minus, ShieldCheck } from 'lucide-react';
import { InstallButton } from './InstallButton';
import { PwaInstallState } from './hooks/usePwaInstall';

interface LandingComparisonProps {
  installState: PwaInstallState;
}

interface ComparisonItem {
  feature: string;
  caffeine: string;
  obsidian: { text: string; status: 'partial' | 'bad' };
  notion: { text: string; status: 'partial' | 'bad' };
  bear: { text: string; status: 'partial' | 'bad' };
}

export const LandingComparison: React.FC<LandingComparisonProps> = ({ installState }) => {
  const comparisonRows: ComparisonItem[] = [
    {
      feature: 'Local-First & Offline Privacy',
      caffeine: '100% Client-Side IndexedDB',
      obsidian: { text: 'Local Vault Files', status: 'partial' },
      notion: { text: 'Cloud-Locked', status: 'bad' },
      bear: { text: 'Cloud Sync', status: 'partial' },
    },
    {
      feature: '1-Click Edge PWA Publishing',
      caffeine: 'Native (Netlify & GitHub)',
      obsidian: { text: 'Third-Party SSG Plugins', status: 'partial' },
      notion: { text: 'Proprietary Web Share', status: 'partial' },
      bear: { text: 'Read-Only Web Link', status: 'partial' },
    },
    {
      feature: 'Capacitor & Mobile Store Ready',
      caffeine: 'Built-in Configs & Manifest',
      obsidian: { text: 'Not Supported', status: 'bad' },
      notion: { text: 'Not Supported', status: 'bad' },
      bear: { text: 'Not Supported', status: 'bad' },
    },
    {
      feature: 'WASM In-Document Code Runner',
      caffeine: 'Python (Pyodide), JS, Math',
      obsidian: { text: 'Community Plugin Only', status: 'partial' },
      notion: { text: 'Not Supported', status: 'bad' },
      bear: { text: 'Not Supported', status: 'bad' },
    },
    {
      feature: 'Vault RegEx Replace + Snapshot Undo',
      caffeine: 'Built-in Atomic Engine',
      obsidian: { text: 'Third-Party RegEx', status: 'partial' },
      notion: { text: 'Manual Find/Replace', status: 'partial' },
      bear: { text: 'Not Supported', status: 'bad' },
    },
    {
      feature: 'Desktop Glassmorphic Context Menus',
      caffeine: 'Files, Tabs & Prose',
      obsidian: { text: 'Electron System Menus', status: 'partial' },
      notion: { text: 'Web Context Menus', status: 'partial' },
      bear: { text: 'Native Minimal', status: 'partial' },
    },
    {
      feature: 'Dual Split-Pane & Canvas Minimap',
      caffeine: 'Native Built-in',
      obsidian: { text: 'Split Panes Only', status: 'partial' },
      notion: { text: 'Not Supported', status: 'bad' },
      bear: { text: 'Not Supported', status: 'bad' },
    },
    {
      feature: 'Account Required / Paywall',
      caffeine: 'Zero Accounts, Free & Open',
      obsidian: { text: 'Paid Sync / Publish', status: 'partial' },
      notion: { text: 'Subscription Paywall', status: 'bad' },
      bear: { text: 'Subscription Tier', status: 'bad' },
    },
  ];

  const renderCompetitorCell = (cell: { text: string; status: 'partial' | 'bad' }) => {
    if (cell.status === 'bad') {
      return (
        <div className="flex items-center gap-1.5 text-rose-400/80">
          <X className="w-3.5 h-3.5 text-rose-500 shrink-0" />
          <span>{cell.text}</span>
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 text-[#87968e]">
        <Minus className="w-3.5 h-3.5 text-[#6e7e75] shrink-0" />
        <span>{cell.text}</span>
      </div>
    );
  };

  return (
    <section id="compare" className="py-20 px-4 max-w-6xl mx-auto border-t border-white/5">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-3">
          COMPETITIVE ARCHITECTURE MATRIX
        </h2>
        <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Why Technical Creators Choose CaffeineMD
        </h3>
        <p className="text-base text-[#94a39b]">
          Compare sovereign offline computing and instant edge distribution against the incumbents.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-zinc-900/40 backdrop-blur-xl mb-12 shadow-2xl">
        <table className="w-full text-left border-collapse text-xs sm:text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="py-4 px-5 font-semibold text-white w-1/4">Feature / Capability</th>
              <th className="py-4 px-5 font-semibold text-emerald-400 bg-emerald-950/30 border-x border-emerald-500/20 w-1/4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>CaffeineMD</span>
                </div>
              </th>
              <th className="py-4 px-5 font-semibold text-[#a1b0a8] w-1/6">Obsidian</th>
              <th className="py-4 px-5 font-semibold text-[#a1b0a8] w-1/6">Notion</th>
              <th className="py-4 px-5 font-semibold text-[#a1b0a8] w-1/6">Bear / Apple Notes</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-xs">
            {comparisonRows.map((row) => (
              <tr key={row.feature} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-3.5 px-5 font-sans font-medium text-white">
                  {row.feature}
                </td>
                <td className="py-3.5 px-5 bg-emerald-950/20 border-x border-emerald-500/20 text-emerald-300 font-semibold">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{row.caffeine}</span>
                  </div>
                </td>
                <td className="py-3.5 px-5">{renderCompetitorCell(row.obsidian)}</td>
                <td className="py-3.5 px-5">{renderCompetitorCell(row.notion)}</td>
                <td className="py-3.5 px-5">{renderCompetitorCell(row.bear)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center">
        <InstallButton installState={installState} size="md" />
      </div>
    </section>
  );
};
