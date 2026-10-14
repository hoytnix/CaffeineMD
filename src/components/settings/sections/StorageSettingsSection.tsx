'use client';

import React, { useState, useEffect } from 'react';
import { Trash2, HardDrive } from 'lucide-react';
import { DeploymentSettingsCard } from './DeploymentSettingsCard';

export interface StorageSettingsSectionProps {
  trashRetentionDays: number;
  setTrashRetentionDays: (days: number) => void;
  emptyTrashAll: () => void;
  trashCount: number;
}

export function StorageSettingsSection({
  trashRetentionDays,
  setTrashRetentionDays,
  emptyTrashAll,
  trashCount,
}: StorageSettingsSectionProps) {
  const [storageEstimate, setStorageEstimate] = useState<{
    usage: number;
    quota: number;
  } | null>(null);

  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.estimate) {
      navigator.storage.estimate().then((est) => {
        if (est.usage !== undefined && est.quota !== undefined) {
          setStorageEstimate({ usage: est.usage, quota: est.quota });
        }
      });
    }
  }, [trashCount]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  const handleEmptyTrash = () => {
    if (confirm(`Permanently delete all ${trashCount} notes in the Trash?`)) {
      emptyTrashAll();
    }
  };

  return (
    <div className="space-y-6">
      {/* Storage & Usage Indicator */}
      <div>
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Local Storage &amp; IndexedDB
          </span>
        </div>

        <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden shadow-xs">
          <div className="p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                <HardDrive className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[var(--foreground)] font-medium block">
                  Local IndexedDB Footprint
                </span>
                <span className="text-neutral-400 text-[11px]">
                  {storageEstimate
                    ? `${formatBytes(storageEstimate.usage)} used of ${formatBytes(storageEstimate.quota)} quota`
                    : 'Encrypted client-side storage active'}
                </span>
              </div>
            </div>

            {storageEstimate && (
              <span className="text-[11px] font-mono text-neutral-500">
                {((storageEstimate.usage / storageEstimate.quota) * 100).toFixed(2)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 1-Click Cloud Deployment Integrations */}
      <DeploymentSettingsCard />



      {/* Trash & Ephemeral Retention Settings */}
      <div>
        <div className="px-3 mb-2 flex items-center justify-between">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Trash &amp; Ephemeral Retention
          </span>
        </div>

        <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden shadow-xs">
          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="text-[var(--foreground)] font-medium block">
                Automatic Trash Purge Retention
              </span>
              <span className="text-neutral-400 text-[11px]">
                Files in the trash will be automatically purged permanently after this period.
              </span>
            </div>
            <select
              value={trashRetentionDays}
              onChange={(e) => setTrashRetentionDays(parseInt(e.target.value, 10))}
              className="px-3 py-1.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none cursor-pointer"
            >
              <option value={7}>7 Days</option>
              <option value={14}>14 Days</option>
              <option value={30}>30 Days (Default)</option>
              <option value={60}>60 Days</option>
              <option value={90}>90 Days</option>
            </select>
          </div>

          <div className="p-4 flex items-center justify-between text-xs">
            <div>
              <span className="text-[var(--foreground)] font-medium block">
                Items in Ephemeral Trash
              </span>
              <span className="text-neutral-400 text-[11px]">
                Currently holding {trashCount} deleted note{trashCount === 1 ? '' : 's'}.
              </span>
            </div>
            <button
              disabled={trashCount === 0}
              onClick={handleEmptyTrash}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-600 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Empty Trash Now</span>
            </button>
          </div>
        </div>
      </div>


    </div>
  );
}
