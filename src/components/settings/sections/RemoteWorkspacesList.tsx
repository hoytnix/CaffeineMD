'use client';

import React from 'react';
import { FolderOpen, Plus, RefreshCw, Download } from 'lucide-react';
import { RemoteWorkspace, DriveSyncStatus } from '@/src/lib/sync/googleDriveSync';

export interface RemoteWorkspacesListProps {
  remoteWorkspaces: RemoteWorkspace[];
  isLoadingRemoteWorkspaces: boolean;
  fetchRemoteWorkspaces: () => void;
  setCreateWorkspaceModalOpen: (open: boolean) => void;
  syncStatus: DriveSyncStatus;
  vaultName: string;
  handleSyncNow: () => void;
  isSyncing: boolean;
  handleSelectRemoteWorkspace: (remote: RemoteWorkspace) => void;
  isDownloadingWorkspace: boolean;
}

export function RemoteWorkspacesList({
  remoteWorkspaces,
  isLoadingRemoteWorkspaces,
  fetchRemoteWorkspaces,
  setCreateWorkspaceModalOpen,
  syncStatus,
  vaultName,
  handleSyncNow,
  isSyncing,
  handleSelectRemoteWorkspace,
  isDownloadingWorkspace,
}: RemoteWorkspacesListProps) {
  return (
    <div className="p-4 bg-neutral-50/40 dark:bg-neutral-900/40 border-t border-neutral-100 dark:border-neutral-800/60 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            <FolderOpen className="w-3.5 h-3.5 text-indigo-500" />
            <span>Workspaces in Google Drive</span>
          </h4>
          <p className="text-[11px] text-neutral-500 dark:text-neutral-400 mt-0.5">
            Select an existing Google Drive workspace folder to download and begin syncing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setCreateWorkspaceModalOpen(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            <Plus className="w-3 h-3" />
            <span>New Workspace</span>
          </button>
          <button
            type="button"
            onClick={fetchRemoteWorkspaces}
            disabled={isLoadingRemoteWorkspaces}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh remote workspaces"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingRemoteWorkspaces ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {isLoadingRemoteWorkspaces ? (
        <div className="py-4 text-center text-xs text-neutral-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-500" />
          <span>Scanning Google Drive for workspaces...</span>
        </div>
      ) : remoteWorkspaces.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {remoteWorkspaces.map((remote) => {
            const isCurrentActive =
              (syncStatus.folderId && syncStatus.folderId === remote.id) ||
              syncStatus.folderName === remote.folderName ||
              vaultName.toLowerCase() === remote.name.toLowerCase();

            return (
              <div
                key={remote.id}
                className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                  isCurrentActive
                    ? 'border-indigo-500/80 bg-indigo-50/50 dark:bg-indigo-950/20 ring-1 ring-indigo-500/20'
                    : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700'
                }`}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-neutral-900 dark:text-neutral-100 truncate">
                      {remote.name}
                    </span>
                    {isCurrentActive && (
                      <span className="shrink-0 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 truncate mt-0.5">
                    {remote.folderName}
                  </p>
                </div>

                <div>
                  {isCurrentActive ? (
                    <button
                      type="button"
                      onClick={handleSyncNow}
                      disabled={isSyncing}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-medium shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                      <span>Sync</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSelectRemoteWorkspace(remote)}
                      disabled={isDownloadingWorkspace || isSyncing}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-800 dark:text-neutral-200 text-[11px] font-medium shadow-xs cursor-pointer transition-colors disabled:opacity-50"
                    >
                      <Download className="w-3 h-3 text-indigo-500" />
                      <span>Download &amp; Sync</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-3 px-3.5 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 text-center">
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            No existing CaffeineMD workspaces found in Google Drive yet.
          </p>
          <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
            Click &ldquo;Sync Now&rdquo; above to upload your current workspace to Google Drive.
          </p>
        </div>
      )}
    </div>
  );
}
