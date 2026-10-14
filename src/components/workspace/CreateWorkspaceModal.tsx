'use client';

import React from 'react';
import {
  FolderPlus,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCreateWorkspace } from './useCreateWorkspace';
import { WorkspaceStorageSelector } from './WorkspaceStorageSelector';

export function CreateWorkspaceModal() {
  const {
    isOpen,
    workspaceName,
    setWorkspaceName,
    workspaceType,
    setWorkspaceType,
    localSubtype,
    setLocalSubtype,
    isSubmitting,
    errorMessage,
    user,
    isAuthenticating,
    handleClose,
    handleGoogleLogin,
    handleCreate,
  } = useCreateWorkspace();

  if (!isOpen) return null;

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
          <WorkspaceStorageSelector
            workspaceType={workspaceType}
            setWorkspaceType={setWorkspaceType}
            localSubtype={localSubtype}
            setLocalSubtype={setLocalSubtype}
            user={user}
            isAuthenticating={isAuthenticating}
            onGoogleLogin={handleGoogleLogin}
          />

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
