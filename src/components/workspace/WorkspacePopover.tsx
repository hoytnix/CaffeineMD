'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { WorkspaceManager } from '@/src/lib/workspaces/workspaceManager';
import { WorkspaceRecord, db } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  FolderPlus,
  Check,
  HardDrive,
  Database,
  Trash2,
  ChevronRight,
  Cloud,
  Plus,
} from 'lucide-react';
import { CreateWorkspaceModal } from './CreateWorkspaceModal';
import { useSyncProgress } from '@/src/lib/sync/syncProgress';

export function KiteLogoMark({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-label="Kite"
      style={{ fontSize: `${size}px`, lineHeight: 1 }}
      className={`inline-flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110 select-none ${className}`}
    >
      🪁
    </span>
  );
}

export function WorkspacePopover() {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  const {
    activeWorkspaceId,
    setActiveWorkspaceId,
    setMountedMode,
    vaultName,
    setImportProgress,
    setCreateWorkspaceModalOpen,
  } = useWorkspaceStore();

  const rawWorkspaces = useLiveQuery(() => db.workspaces?.toArray() ?? []);
  const workspaces: WorkspaceRecord[] = rawWorkspaces ?? [];

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const syncState = useSyncProgress();

  const handleMountNewWorkspace = async () => {
    try {
      const ws = await WorkspaceManager.mountDiskFolderAsWorkspace((p) => {
        setImportProgress(p);
      });
      setActiveWorkspaceId(ws.id, ws.name);
      setMountedMode('filesystem', ws.name);
      setIsOpen(false);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        alert(err.message || 'Failed to mount folder');
      }
    }
  };

  const handleSelectWorkspace = async (ws: WorkspaceRecord) => {
    await WorkspaceManager.switchWorkspace(ws.id);
    setActiveWorkspaceId(ws.id, ws.name);
    setMountedMode(ws.mode, ws.name);
    setIsOpen(false);
  };

  const handleDisconnect = async (e: React.MouseEvent, wsId: string) => {
    e.stopPropagation();
    if (confirm('Disconnect this workspace? (Files stored on disk or Google Drive will not be deleted)')) {
      await WorkspaceManager.disconnectWorkspace(wsId);
      if (activeWorkspaceId === wsId) {
        setActiveWorkspaceId('default-vault', 'Local Vault');
        setMountedMode('indexeddb');
      }
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <div className="relative inline-block" ref={popoverRef}>
          {/* Kite Emoji Logo Mark Trigger */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="group flex items-center justify-center p-1.5 rounded-lg hover:bg-[var(--foreground)]/10 transition-colors cursor-pointer select-none relative"
            title="Kite Workspaces"
          >
            <KiteLogoMark size={22} />
            {syncState.status === 'syncing' && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
            )}
          </button>

          {/* Popover Menu */}
          {isOpen && (
            <div className="absolute left-0 mt-2 w-72 bg-[var(--card)] border border-[var(--border)] rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2 text-[var(--foreground)]">
              {/* Active Workspace Header */}
              <div className="px-2.5 py-2 border-b border-[var(--border)]">
                <span className="text-[10px] uppercase tracking-wider font-semibold text-[var(--foreground)]/50">
                  Active Workspace
                </span>
                <div className="flex items-center justify-between mt-1">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span className="text-xs font-bold text-[var(--foreground)] truncate">{vaultName}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[var(--foreground)]/60 bg-[var(--background)] border border-[var(--border)] px-1.5 py-0.5 rounded">
                    {activeWorkspaceId.startsWith('drive-') ? 'Google Drive' : activeWorkspaceId.startsWith('disk-') ? 'Live Disk' : 'Local Vault'}
                  </span>
                </div>
              </div>

              {/* Sync Progress Bar */}
              {syncState.status === 'syncing' && (
                <div className="w-full px-3 py-2 space-y-1 bg-[var(--background)]/80 rounded-lg border border-[var(--border)]">
                  <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-neutral-400">
                    <span className="truncate max-w-[150px]">
                      {syncState.currentAction === 'uploading' ? 'Uploading' : 'Downloading'} {syncState.currentFileName || ''}...
                    </span>
                    <span className="font-mono text-[10px]">
                      {syncState.processedFiles}/{syncState.totalFiles} ({Math.round(syncState.progressPercentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${syncState.progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Connected Workspaces List */}
              <div className="max-h-48 overflow-y-auto py-1 space-y-0.5">
                <span className="px-2.5 text-[10px] font-medium text-[var(--foreground)]/50">Workspaces</span>
                {workspaces.length === 0 ? (
                  <div
                    onClick={() => handleSelectWorkspace({ id: 'default-vault', name: 'Local Vault', mode: 'indexeddb', createdAt: Date.now(), updatedAt: Date.now() })}
                    className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-[var(--foreground)]/10 cursor-pointer"
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Database className="w-3.5 h-3.5 text-[var(--accent)]" />
                      <span className="truncate">Local Vault</span>
                    </div>
                    <Check className="w-3.5 h-3.5 text-[var(--accent)]" />
                  </div>
                ) : (
                  workspaces.map((ws) => {
                    const isActive = ws.id === activeWorkspaceId;
                    const isGoogleDrive = Boolean(ws.driveFolderId || ws.id.startsWith('drive-'));
                    const isDisk = ws.mode === 'filesystem';

                    return (
                      <div
                        key={ws.id}
                        onClick={() => handleSelectWorkspace(ws)}
                        className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                          isActive
                            ? 'bg-[var(--background)] font-semibold text-[var(--foreground)] border border-[var(--border)]'
                            : 'text-[var(--foreground)]/70 hover:bg-[var(--foreground)]/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {isGoogleDrive ? (
                            <Cloud className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                          ) : isDisk ? (
                            <HardDrive className="w-3.5 h-3.5 text-[var(--accent)] shrink-0" />
                          ) : (
                            <Database className="w-3.5 h-3.5 text-[var(--foreground)]/50 shrink-0" />
                          )}
                          <span className="truncate">{ws.name}</span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {isActive && <Check className="w-3.5 h-3.5 text-[var(--accent)]" />}
                          {ws.id !== 'default-vault' && (
                            <button
                              onClick={(e) => handleDisconnect(e, ws.id)}
                              className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-[var(--foreground)]/40 hover:text-red-500 transition-opacity"
                              title="Disconnect workspace"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Actions: Create Workspace & Mount Disk Folder */}
              <div className="pt-1.5 border-t border-[var(--border)] space-y-1">
                <button
                  onClick={() => {
                    setIsOpen(false);
                    setCreateWorkspaceModalOpen(true);
                  }}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Plus className="w-3.5 h-3.5 text-white" />
                    <span>Create Workspace</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-white/70" />
                </button>

                <button
                  onClick={handleMountNewWorkspace}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[var(--background)] hover:bg-[var(--foreground)]/10 text-[var(--foreground)] border border-[var(--border)] text-xs font-medium transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <FolderPlus className="w-3.5 h-3.5 text-[var(--accent)]" />
                    <span>Mount Disk Folder</span>
                  </div>
                  <ChevronRight className="w-3 h-3 text-[var(--foreground)]/50" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <CreateWorkspaceModal />
    </>
  );
}
