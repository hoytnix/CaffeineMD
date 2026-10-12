'use client';

import React from 'react';
import { Check, X, ShieldAlert, ShieldCheck } from 'lucide-react';
import { InstallButton } from './InstallButton';
import { PwaInstallState } from './hooks/usePwaInstall';

interface LandingComparisonProps {
  installState: PwaInstallState;
}

export const LandingComparison: React.FC<LandingComparisonProps> = ({ installState }) => {
  const comparisonRows = [
    { label: 'Data Storage', legacy: 'Proprietary Cloud Database', caffeine: 'Local SSD + Dexie IndexedDB' },
    { label: 'File Format', legacy: 'Vendor-Locked JSON / Binary', caffeine: 'Human-Readable Plain Markdown (.md)' },
    { label: 'Offline Execution', legacy: 'Degraded / Requires Internet', caffeine: '100% Fully Functional Offline' },
    { label: 'Monthly Subscriptions', legacy: '$10 - $20 / month', caffeine: '100% Free Sovereign Software' },
    { label: 'Telemetry & Tracking', legacy: 'User behavioral analytics', caffeine: 'Zero Analytics • Zero Tracking' },
    { label: 'App Installation', legacy: 'Heavy 200MB+ Electron installer', caffeine: '1-Click Lightweight Native PWA' },
  ];

  return (
    <section id="compare" className="py-20 px-4 max-w-5xl mx-auto border-t border-white/5">
      <div className="text-center max-w-2xl mx-auto mb-16">
        <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-3">
          SOVEREIGN OWNERSHIP
        </h2>
        <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          CaffeineMD vs. Cloud Silos
        </h3>
        <p className="text-base text-[#94a39b]">
          Stop renting your thoughts from centralized tech corporations.
        </p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.01] mb-12">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-white/10 bg-white/[0.02]">
              <th className="py-4 px-6 font-semibold text-white">Dimension</th>
              <th className="py-4 px-6 font-semibold text-[#87968e]">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Legacy Note Apps</span>
                </div>
              </th>
              <th className="py-4 px-6 font-semibold text-emerald-400">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>CaffeineMD</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-mono text-xs sm:text-sm">
            {comparisonRows.map((row) => (
              <tr key={row.label} className="hover:bg-white/[0.02] transition-colors">
                <td className="py-4 px-6 font-sans font-medium text-white">{row.label}</td>
                <td className="py-4 px-6 text-rose-300/80">
                  <div className="flex items-center gap-2">
                    <X className="w-4 h-4 text-rose-500 shrink-0" />
                    <span>{row.legacy}</span>
                  </div>
                </td>
                <td className="py-4 px-6 text-emerald-300 font-semibold">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{row.caffeine}</span>
                  </div>
                </td>
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
