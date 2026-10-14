'use client';

import React, { useState, useEffect } from 'react';
import { Terminal, Shield, CheckCircle2, Download, Trash2, Loader2, Sparkles } from 'lucide-react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import {
  isRuntimeCached,
  preloadSandboxRuntimes,
  clearSandboxRuntimeCache,
  RUNTIME_ASSETS,
} from '@/src/lib/sandbox/runtimeCache';

export function CodeExecutionSandboxSection() {
  const codeExecutionSandboxEnabled = useWorkspaceStore((s) => s.codeExecutionSandboxEnabled);
  const setCodeExecutionSandboxEnabled = useWorkspaceStore((s) => s.setCodeExecutionSandboxEnabled);
  const showToast = useWorkspaceStore((s) => s.showToast);

  const [cached, setCached] = useState<boolean>(false);
  const [downloading, setDownloading] = useState<boolean>(false);
  const [progressText, setProgressText] = useState<string>('');

  useEffect(() => {
    isRuntimeCached().then(setCached);
  }, []);

  const handleToggle = async () => {
    const nextVal = !codeExecutionSandboxEnabled;
    setCodeExecutionSandboxEnabled(nextVal);

    if (nextVal) {
      showToast('Code Execution Sandbox enabled');
      // If toggled on and not already cached, kick off one-time background download and caching
      const isAlreadyCached = await isRuntimeCached();
      if (!isAlreadyCached) {
        setDownloading(true);
        setProgressText('Caching runtimes (0/5)...');
        preloadSandboxRuntimes(({ asset, loaded, total }) => {
          setProgressText(`Cached ${asset} (${loaded}/${total})`);
        })
          .then(() => {
            setCached(true);
            setDownloading(false);
            setProgressText('');
            showToast('Compiler runtimes cached for offline use');
          })
          .catch(() => {
            setDownloading(false);
            setProgressText('');
          });
      }
    } else {
      showToast('Code Execution Sandbox disabled');
    }
  };

  const handleManualCache = async () => {
    if (downloading) return;
    setDownloading(true);
    setProgressText('Caching runtimes (0/5)...');
    try {
      await preloadSandboxRuntimes(({ asset, loaded, total }) => {
        setProgressText(`Cached ${asset} (${loaded}/${total})`);
      });
      setCached(true);
      showToast('Compiler runtimes successfully cached');
    } catch {
      showToast('Failed to cache runtimes');
    } finally {
      setDownloading(false);
      setProgressText('');
    }
  };

  const handleClearCache = async () => {
    await clearSandboxRuntimeCache();
    setCached(false);
    showToast('Sandbox runtime cache cleared');
  };

  return (
    <div>
      <div className="px-3 mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
          Code Execution Sandbox
        </span>
        <span className="text-[11px] text-neutral-400 font-mono">
          {codeExecutionSandboxEnabled ? 'ENABLED' : 'OFF'}
        </span>
      </div>

      <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] overflow-hidden shadow-xs divide-y divide-[var(--border)] px-4 sm:px-5">
        {/* Main Toggle Row */}
        <div className="flex items-center justify-between py-4">
          <div className="space-y-1 pr-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-emerald-500" />
              <label className="text-sm font-semibold text-[var(--foreground)]">
                Enable WASM Sandbox &amp; Code Execution
              </label>
              <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                <Shield className="w-2.5 h-2.5" />
                Client-Side
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 max-w-xl leading-relaxed">
              Execute Python, JavaScript, TypeScript, SQLite, Lua, and Shell code directly inside your browser. Kept off by default so the application starts up instantly with zero asset downloading overhead.
            </p>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={codeExecutionSandboxEnabled}
            onClick={handleToggle}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
              codeExecutionSandboxEnabled ? 'bg-emerald-600' : 'bg-neutral-300 dark:bg-zinc-700'
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                codeExecutionSandboxEnabled ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Runtime Cache Management (when enabled) */}
        {codeExecutionSandboxEnabled && (
          <div className="py-4 space-y-3 bg-[var(--background)]/20 -mx-4 sm:-mx-5 px-4 sm:px-5 border-t border-[var(--border)]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-[var(--foreground)]">
                    Offline Compiler &amp; Runtime Cache
                  </span>
                  {cached ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-2.5 h-2.5" />
                      Cached
                    </span>
                  ) : downloading ? (
                    <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/20 animate-pulse">
                      <Loader2 className="w-2.5 h-2.5 animate-spin" />
                      Downloading...
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-500 font-medium">Not cached</span>
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 dark:text-neutral-400">
                  {progressText || 'Compiler and WASM runtimes are stored in the browser Cache API so they never re-download during execution.'}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleManualCache}
                  disabled={downloading}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-slate-200 text-xs font-medium border border-neutral-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {downloading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Downloading...</span>
                    </>
                  ) : (
                    <>
                      <Download className="w-3.5 h-3.5 text-emerald-400" />
                      <span>{cached ? 'Re-cache All' : 'Download & Cache'}</span>
                    </>
                  )}
                </button>

                {cached && (
                  <button
                    type="button"
                    onClick={handleClearCache}
                    disabled={downloading}
                    className="p-1.5 rounded-xl bg-neutral-800 hover:bg-rose-950/40 text-neutral-400 hover:text-rose-400 border border-neutral-700 transition-colors cursor-pointer"
                    title="Clear cached compiler binaries"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List of included runtimes */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
              {RUNTIME_ASSETS.map((asset) => (
                <div
                  key={asset.id}
                  className="p-2 rounded-xl bg-[var(--card)]/80 border border-[var(--border)] text-[11px]"
                >
                  <div className="font-medium text-[var(--foreground)] truncate">{asset.label}</div>
                  <div className="text-[10px] text-neutral-400 font-mono flex items-center justify-between mt-0.5">
                    <span>{asset.approxSize}</span>
                    <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
