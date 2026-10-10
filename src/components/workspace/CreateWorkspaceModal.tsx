'use client';

import React, { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { WorkspaceManager } from '@/src/lib/workspaces/workspaceManager';
import { googleSignIn, getAccessToken, initAuth } from '@/src/lib/firebase/client';
import {
  FolderPlus,
  Cloud,
  HardDrive,
  Database,
  X,
  Loader2,
  Check,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';

export function CreateWorkspaceModal() {
  const {
    isCreateWorkspaceModalOpen,
    setCreateWorkspaceModalOpen,
    setActiveWorkspaceId,
    setMountedMode,
    showToast,
    setImportProgress,
  } = useWorkspaceStore();

  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceType, setWorkspaceType] = useState<'google' | 'local'>('google');
  const [localSubtype, setLocalSubtype] = useState<'indexeddb' | 'disk'>('indexeddb');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Google Auth state
  const [user, setUser] = useState<any>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const handleClose = () => {
    if (isSubmitting) return;
    setWorkspaceName('');
    setErrorMessage(null);
    setIsSubmitting(false);
    setCreateWorkspaceModalOpen(false);
  };

  useEffect(() => {
    if (!isCreateWorkspaceModalOpen) return;

    const unsubscribe = initAuth(
      (authedUser) => setUser(authedUser),
      () => setUser(null)
    );
    return () => unsubscribe();
  }, [isCreateWorkspaceModalOpen]);

  if (!isCreateWorkspaceModalOpen) return null;

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setErrorMessage(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
      }
    } catch (err: any) {
      setErrorMessage(`Google sign in failed: ${err.message || 'Unknown error'}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const name = workspaceName.trim();
    if (!name) {
      setErrorMessage('Please enter a workspace name');
      return;
    }

    setIsSubmitting(true);

    try {
      if (workspaceType === 'google') {
        // Ensure user is authenticated
        let token = await getAccessToken();
        if (!user || !token) {
          const authRes = await googleSignIn();
          if (!authRes) {
            setErrorMessage('Google authentication is required to create a Google Drive workspace');
            setIsSubmitting(false);
            return;
          }
          setUser(authRes.user);
          token = authRes.accessToken;
        }

        const ws = await WorkspaceManager.createGoogleDriveWorkspace(name);
        setActiveWorkspaceId(ws.id, ws.name);
        setMountedMode('indexeddb', ws.name);
        showToast(`Created Google Drive workspace "${ws.name}"`);
        setCreateWorkspaceModalOpen(false);
      } else {
        // Local Drive
        if (localSubtype === 'disk') {
          setCreateWorkspaceModalOpen(false);
          const ws = await WorkspaceManager.mountDiskFolderAsWorkspace((p) => {
            setImportProgress(p);
          });
          setActiveWorkspaceId(ws.id, ws.name);
          setMountedMode('filesystem', ws.name);
          showToast(`Mounted disk workspace "${ws.name}"`);
        } else {
          // IndexedDB Vault
          const ws = await WorkspaceManager.createLocalWorkspace(name);
          setActiveWorkspaceId(ws.id, ws.name);
          setMountedMode('indexeddb', ws.name);
          showToast(`Created local workspace "${ws.name}"`);
          setCreateWorkspaceModalOpen(false);
        }
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErrorMessage(err.message || 'Failed to create workspace');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-workspace-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting) {
          handleClose();
        }
      }}
    >
      <div className="w-full max-w-lg rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-6 text-[var(--foreground)] space-y-5 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 id="create-workspace-title" className="text-base font-semibold leading-tight">
                Create New Workspace
              </h2>
              <p className="text-xs text-neutral-400 mt-0.5">
                Choose where you want to store and sync your notes
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-1 rounded-lg text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-800/40 transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span className="flex-1">{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleCreate} className="space-y-4">
          {/* Workspace Name Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-neutral-300">
              Workspace Name
            </label>
            <input
              type="text"
              required
              disabled={isSubmitting}
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="e.g. Personal Vault, Work, Research 2026"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[var(--background)] border border-[var(--border)] text-sm text-[var(--foreground)] placeholder-neutral-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/40 transition-all"
              autoFocus
            />
          </div>

          {/* Storage Destination Radio Grid */}
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
                          handleGoogleLogin();
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

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-2 border-t border-[var(--border)]">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-neutral-400 hover:text-[var(--foreground)] hover:bg-neutral-800/40 transition-colors cursor-pointer disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !workspaceName.trim()}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating &amp; Initializing...</span>
                </>
              ) : (
                <span>
                  {workspaceType === 'google'
                    ? 'Create Google Drive Workspace'
                    : localSubtype === 'disk'
                    ? 'Mount Disk Folder'
                    : 'Create Local Workspace'}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
