'use client';

import React from 'react';
import Image from 'next/image';
import { Cloud, RefreshCw, LogOut } from 'lucide-react';
import { RemoteWorkspacesList } from './RemoteWorkspacesList';
import { useGoogleDriveSyncSettings } from './useGoogleDriveSyncSettings';

export interface GoogleDriveSyncSectionProps {
  vaultName: string;
  showToast: (msg: string) => void;
  setActiveWorkspaceId: (id: string, name: string) => void;
  setMountedMode: (mode: 'indexeddb' | 'filesystem', name: string) => void;
  setCreateWorkspaceModalOpen: (open: boolean) => void;
}

export function GoogleDriveSyncSection({
  vaultName,
  showToast,
  setActiveWorkspaceId,
  setMountedMode,
  setCreateWorkspaceModalOpen,
}: GoogleDriveSyncSectionProps) {
  const {
    user,
    isAuthenticating,
    isSyncing,
    syncProgressText,
    syncStatus,
    remoteWorkspaces,
    isLoadingRemoteWorkspaces,
    isDownloadingWorkspace,
    fetchRemoteWorkspaces,
    handleGoogleLogin,
    handleGoogleLogout,
    handleSyncNow,
    handleSelectRemoteWorkspace,
  } = useGoogleDriveSyncSettings({
    vaultName,
    showToast,
    setActiveWorkspaceId,
    setMountedMode,
  });

  return (
    <div>
      <div className="px-3 mb-2 flex items-center justify-between">
        <div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
            Cloud Sync &amp; Google Drive
          </span>
          <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
            Sync CaffeineMD notes across devices with Google Drive
          </p>
        </div>
        {user && (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Connected
          </span>
        )}
      </div>

      <div className="rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 divide-y divide-neutral-100 dark:divide-neutral-800/60 overflow-hidden shadow-xs">
        <div className="p-4 flex items-center justify-between flex-wrap gap-4">
          {user ? (
            <div className="flex items-center gap-3">
              {user.photoURL ? (
                <Image
                  src={user.photoURL}
                  alt={user.displayName || 'Google User'}
                  width={44}
                  height={44}
                  unoptimized
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-indigo-500/20"
                />
              ) : (
                <div className="w-11 h-11 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold text-sm">
                  {user.displayName?.[0] || user.email?.[0] || 'G'}
                </div>
              )}
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  {user.displayName || 'Google User'}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">{user.email}</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-400">
                <Cloud className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                  Sign in with Google
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Sync CaffeineMD notes across devices with Google Drive
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  onClick={handleSyncNow}
                  disabled={isSyncing}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium transition-colors shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? (syncProgressText || 'Syncing...') : 'Sync Now'}</span>
                </button>
                <button
                  onClick={handleGoogleLogout}
                  className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors cursor-pointer"
                  title="Log Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </>
            ) : (
              <button
                onClick={handleGoogleLogin}
                disabled={isAuthenticating}
                className="flex items-center gap-2 px-4 py-2 rounded-xl border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-xs font-semibold text-neutral-800 dark:text-neutral-200 transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </svg>
                <span>{isAuthenticating ? 'Connecting...' : 'Sign in with Google'}</span>
              </button>
            )}
          </div>
        </div>

        {syncStatus.lastError && (
          <div className="px-4 py-2.5 bg-red-50 dark:bg-red-950/40 border-t border-red-200/60 dark:border-red-900/60 text-xs text-red-600 dark:text-red-400 flex items-center justify-between gap-2">
            <span className="truncate">{syncStatus.lastError}</span>
            <button
              onClick={handleGoogleLogin}
              className="shrink-0 font-medium underline hover:text-red-700 dark:hover:text-red-300 cursor-pointer"
            >
              Reconnect
            </button>
          </div>
        )}

        {user && (
          <div className="px-4 py-3 bg-neutral-50/50 dark:bg-neutral-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="space-y-0.5">
              <span className="text-neutral-500 dark:text-neutral-400">Workspace Root Folder:</span>
              <p className="font-mono text-neutral-800 dark:text-neutral-200">
                {syncStatus.folderName || 'CaffeineMD Vault'}
              </p>
            </div>

            <div className="text-left sm:text-right space-y-0.5">
              <div className="flex items-center sm:justify-end gap-1.5">
                <span className="text-neutral-500 dark:text-neutral-400">Last Synced:</span>
                {syncStatus.stats && syncStatus.lastSyncedAt && !syncStatus.lastError && (
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-1.5 py-0.5 rounded">
                    +{syncStatus.stats.uploaded} / -{syncStatus.stats.downloaded}
                  </span>
                )}
              </div>
              <p className="text-neutral-800 dark:text-neutral-200">
                {syncStatus.lastSyncedAt
                  ? new Date(syncStatus.lastSyncedAt).toLocaleTimeString()
                  : 'Never'}
              </p>
            </div>
          </div>
        )}

        {user && (
          <RemoteWorkspacesList
            remoteWorkspaces={remoteWorkspaces}
            isLoadingRemoteWorkspaces={isLoadingRemoteWorkspaces}
            fetchRemoteWorkspaces={fetchRemoteWorkspaces}
            setCreateWorkspaceModalOpen={setCreateWorkspaceModalOpen}
            syncStatus={syncStatus}
            vaultName={vaultName}
            handleSyncNow={handleSyncNow}
            isSyncing={isSyncing}
            handleSelectRemoteWorkspace={handleSelectRemoteWorkspace}
            isDownloadingWorkspace={isDownloadingWorkspace}
          />
        )}
      </div>
    </div>
  );
}
