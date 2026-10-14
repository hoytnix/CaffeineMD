'use client';

import React from 'react';
import { Cloud, HardDrive, Check, Loader2 } from 'lucide-react';
import { WorkspaceType, LocalSubtype } from './useCreateWorkspace';

export interface WorkspaceStorageSelectorProps {
  workspaceType: WorkspaceType;
  setWorkspaceType: (type: WorkspaceType) => void;
  localSubtype: LocalSubtype;
  setLocalSubtype: (subtype: LocalSubtype) => void;
  user: any;
  isAuthenticating: boolean;
  onGoogleLogin: () => void;
}

export function WorkspaceStorageSelector({
  workspaceType,
  setWorkspaceType,
  localSubtype,
  setLocalSubtype,
  user,
  isAuthenticating,
  onGoogleLogin,
}: WorkspaceStorageSelectorProps) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-semibold text-neutral-300">
        Storage &amp; Sync Provider
      </label>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {/* Google Drive Option */}
        <div
          onClick={() => setWorkspaceType('google')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
            workspaceType === 'google'
              ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
              : 'border-[var(--border)] bg-[var(--background)] hover:border-neutral-700'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                <Cloud className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">Google Drive</span>
            </div>
            {workspaceType === 'google' && (
              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Automatic bidirectional cloud sync across devices with zero lock-in.
          </p>
          {workspaceType === 'google' && (
            <div className="pt-2 border-t border-[var(--border)]">
              {user ? (
                <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="truncate">{user.email || user.displayName || 'Google Account'}</span>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onGoogleLogin();
                  }}
                  disabled={isAuthenticating}
                  className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAuthenticating ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <span>Connect Google</span>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Local Drive Option */}
        <div
          onClick={() => setWorkspaceType('local')}
          className={`p-3.5 rounded-xl border cursor-pointer transition-all flex flex-col justify-between gap-3 ${
            workspaceType === 'local'
              ? 'border-indigo-500 bg-indigo-500/10 ring-1 ring-indigo-500/30'
              : 'border-[var(--border)] bg-[var(--background)] hover:border-neutral-700'
          }`}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-neutral-500/20 text-neutral-300">
                <HardDrive className="w-4 h-4" />
              </div>
              <span className="text-sm font-semibold">Local Drive</span>
            </div>
            {workspaceType === 'local' && (
              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
            )}
          </div>
          <p className="text-[11px] text-neutral-400 leading-relaxed">
            Local-first storage stored on this device. Fully offline and private.
          </p>
          {workspaceType === 'local' && (
            <div className="pt-2 border-t border-[var(--border)] flex gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalSubtype('indexeddb');
                }}
                className={`flex-1 py-1 px-2 rounded-md text-[10px] font-medium transition-colors ${
                  localSubtype === 'indexeddb'
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Browser Vault
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setLocalSubtype('disk');
                }}
                className={`flex-1 py-1 px-2 rounded-md text-[10px] font-medium transition-colors ${
                  localSubtype === 'disk'
                    ? 'bg-neutral-800 text-white font-semibold'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                Disk Folder
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
