'use client';

import React from 'react';

export interface PwaConfigSectionProps {
  appName: string;
  setAppName: (name: string) => void;
  appId: string;
  setAppId: (id: string) => void;
}

/**
 * Renders PWABuilder & Capacitor manifest configuration inputs when PWA output is selected.
 */
export function PwaConfigSection({
  appName,
  setAppName,
  appId,
  setAppId,
}: PwaConfigSectionProps) {
  return (
    <div className="p-3 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-2 text-xs">
      <div className="font-semibold text-neutral-300 text-[11px] uppercase tracking-wider">
        PWABuilder & Capacitor Settings
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <span className="text-[10px] text-neutral-400">App Name</span>
          <input
            type="text"
            value={appName}
            onChange={(e) => setAppName(e.target.value)}
            className="w-full px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs outline-none focus:border-[var(--accent)]"
          />
        </div>
        <div>
          <span className="text-[10px] text-neutral-400">Capacitor App ID</span>
          <input
            type="text"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            className="w-full px-2 py-1 rounded bg-[var(--card)] border border-[var(--border)] text-xs outline-none focus:border-[var(--accent)] font-mono"
          />
        </div>
      </div>
    </div>
  );
}
