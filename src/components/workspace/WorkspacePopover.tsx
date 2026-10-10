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
  ExternalLink,
  Layers,
} from 'lucide-react';

export function KiteLogoMark({ size = 22, className = '' }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
    >
      <defs>
        <linearGradient id="kite-grad-1" x1="16" y1="2" x2="6" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#6366f1" />
          <stop offset="1" stopColor="#4f46e5" />
        </linearGradient>
        <linearGradient id="kite-grad-2" x1="16" y1="2" x2="26" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#818cf8" />
          <stop offset="1" stopColor="#6366f1" />
        </linearGradient>
        <linearGradient id="kite-grad-3" x1="16" y1="18" x2="6" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4338ca" />
          <stop offset="1" stopColor="#3730a3" />
        </linearGradient>
        <linearGradient id="kite-grad-4" x1="16" y1="18" x2="26" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#4f46e5" />
          <stop offset="1" stopColor="#4338ca" />
        </linearGradient>
      </defs>
      {/* Top Left Facet */}
      <path d="M16 2L6 18H16V2Z" fill="url(#kite-grad-1)" />
      {/* Top Right Facet */}
      <path d="M16 2L26 18H16V2Z" fill="url(#kite-grad-2)" />
      {/* Bottom Left Facet */}
      <path d="M16 30L6 18H16V30Z" fill="url(#kite-grad-3)" />
      {/* Bottom Right Facet */}
      <path d="M16 30L26 18H16V30Z" fill="url(#kite-grad-4)" />
      {/* Structural Cross Spine */}
      <path d="M16 2V30M6 18H26" stroke="rgba(255,255,255,0.3)" strokeWidth="0.75" />
    </svg>
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
    if (confirm('Disconnect this workspace? (Files stored on disk will not be deleted)')) {
      await WorkspaceManager.disconnectWorkspace(wsId);
      if (activeWorkspaceId === wsId) {
        setActiveWorkspaceId('default-vault', 'Local Vault');
        setMountedMode('indexeddb');
      }
    }
  };

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* 1:1 Crisp SVG Kite Logo Mark Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group flex items-center justify-center p-1.5 rounded-lg hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition-colors cursor-pointer select-none"
        title="Kite Workspaces"
      >
        <KiteLogoMark size={22} />
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-2xl z-50 p-2 flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-2">
          {/* Active Workspace Header */}
          <div className="px-2.5 py-2 border-b border-neutral-100 dark:border-neutral-800/80">
            <span className="text-[10px] uppercase tracking-wider font-semibold text-neutral-400">
              Active Workspace
            </span>
            <div className="flex items-center justify-between mt-1">
              <div className="flex items-center gap-2 truncate">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span className="text-xs font-bold text-neutral-900 dark:text-neutral-100 truncate">
                  {vaultName}
                </span>
              </div>
              <span className="text-[10px] font-mono text-neutral-400 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                {activeWorkspaceId.startsWith('disk-') ? 'Live Disk' : 'IndexedDB'}
              </span>
            </div>
          </div>

          {/* Connected Workspaces List */}
          <div className="max-h-48 overflow-y-auto py-1 space-y-0.5">
            <span className="px-2.5 text-[10px] font-medium text-neutral-400">
              Connected Folders
            </span>

            {workspaces.length === 0 ? (
              <div
                onClick={() =>
                  handleSelectWorkspace({
                    id: 'default-vault',
                    name: 'Local Vault',
                    mode: 'indexeddb',
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                  })
                }
                className="flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs hover:bg-neutral-100 dark:hover:bg-neutral-800 cursor-pointer"
              >
                <div className="flex items-center gap-2 truncate">
                  <Database className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="truncate">Local Vault</span>
                </div>
                <Check className="w-3.5 h-3.5 text-indigo-600" />
              </div>
            ) : (
              workspaces.map((ws) => {
                const isActive = ws.id === activeWorkspaceId;
                return (
                  <div
                    key={ws.id}
                    onClick={() => handleSelectWorkspace(ws)}
                    className={`group flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-neutral-100 dark:bg-neutral-800/90 font-semibold text-neutral-900 dark:text-neutral-100'
                        : 'text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/70 dark:hover:bg-neutral-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {ws.mode === 'filesystem' ? (
                        <HardDrive className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      ) : (
                        <Database className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      )}
                      <span className="truncate">{ws.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isActive && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                      {ws.id !== 'default-vault' && (
                        <button
                          onClick={(e) => handleDisconnect(e, ws.id)}
                          className="opacity-0 group-hover:opacity-100 p-0.5 rounded text-neutral-400 hover:text-red-500 transition-opacity"
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

          {/* Action: Mount New Disk Folder */}
          <div className="pt-1 border-t border-neutral-100 dark:border-neutral-800/80">
            <button
              onClick={handleMountNewWorkspace}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 text-xs font-medium transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <FolderPlus className="w-3.5 h-3.5" />
                <span>Mount Disk Folder</span>
              </div>
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
