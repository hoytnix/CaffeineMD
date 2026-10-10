'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  Palette,
  Sparkles,
  Cloud,
  Check,
  RefreshCw,
  FolderOpen,
  HardDrive,
  ExternalLink,
  Laptop,
  Type,
  Image as ImageIcon,
  Sliders,
  LogOut,
  Info,
  ShieldCheck,
  Zap,
  Trash2,
  Download,
  Plus,
} from 'lucide-react';
import { CreateWorkspaceModal } from '@/src/components/workspace/CreateWorkspaceModal';
import { db } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import {
  THEME_PRESETS,
  ThemeDefinition,
  DEFAULT_CUSTOM_THEME,
} from '@/src/lib/themes/themeDefinitions';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getCurrentUser,
  getAccessToken,
  setAccessToken,
} from '@/src/lib/firebase/client';
import {
  GoogleDriveSyncService,
  DriveSyncStatus,
  RemoteWorkspace,
} from '@/src/lib/sync/googleDriveSync';
import { User } from 'firebase/auth';

export default function SettingsPage() {
  const router = useRouter();
  const {
    themeId,
    setTheme,
    customTheme,
    updateCustomTheme,
    vaultName,
    mountedMode,
    trashRetentionDays,
    setTrashRetentionDays,
    emptyTrashAll,
    setActiveWorkspaceId,
    setMountedMode,
    showToast,
    setCreateWorkspaceModalOpen,
  } = useWorkspaceStore();

  const rawFiles = useLiveQuery(() => db.files.toArray());
  const trashCount = rawFiles?.filter((f) => f.isTrash).length || 0;

  // AI Theme Generation state
  const [vibePrompt, setVibePrompt] = useState('');
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [aiThemeError, setAiThemeError] = useState<string | null>(null);

  // Google SSO & Sync State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<DriveSyncStatus>({
    isConnected: false,
    isSyncing: false,
    folderId: null,
    folderName: null,
    lastSyncedAt: null,
    lastError: null,
    stats: { uploaded: 0, downloaded: 0, skipped: 0 },
  });

  // Remote Google Drive Workspaces
  const [remoteWorkspaces, setRemoteWorkspaces] = useState<RemoteWorkspace[]>([]);
  const [isLoadingRemoteWorkspaces, setIsLoadingRemoteWorkspaces] = useState(false);
  const [isDownloadingWorkspace, setIsDownloadingWorkspace] = useState(false);

  // Custom theme editor toggle
  const [showCustomWizard, setShowCustomWizard] = useState(false);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);

  // Fetch workspaces already in Google Drive
  const fetchRemoteWorkspaces = async () => {
    const token = await getAccessToken();
    if (!token) return;
    setIsLoadingRemoteWorkspaces(true);
    try {
      const list = await GoogleDriveSyncService.listRemoteWorkspaces();
      setRemoteWorkspaces(list);
    } catch (err) {
      console.error('Failed to list remote workspaces:', err);
    } finally {
      setIsLoadingRemoteWorkspaces(false);
    }
  };

  // Initialize auth state
  useEffect(() => {
    const unsubscribe = initAuth(
      (authedUser) => {
        setUser(authedUser);
        setSyncStatus((prev) => ({ ...prev, isConnected: true }));
        fetchRemoteWorkspaces();
      },
      () => {
        setUser(null);
        setSyncStatus((prev) => ({ ...prev, isConnected: false }));
        setRemoteWorkspaces([]);
      }
    );
    return () => unsubscribe();
  }, []);

  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setSyncStatus((prev) => ({ ...prev, isConnected: true }));
      }
    } catch (err: any) {
      alert(`Sign in failed: ${err.message}`);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleGoogleLogout = async () => {
    await logoutGoogle();
    setUser(null);
    setSyncStatus((prev) => ({ ...prev, isConnected: false }));
  };

  const handleSyncNow = async () => {
    let token = await getAccessToken();
    if (!user || !token) {
      setIsAuthenticating(true);
      try {
        const res = await googleSignIn();
        if (res) {
          setUser(res.user);
          token = res.accessToken;
          setSyncStatus((prev) => ({ ...prev, isConnected: true, lastError: null }));
        } else {
          return;
        }
      } catch (err: any) {
        setSyncStatus((prev) => ({
          ...prev,
          lastError: `Google authentication required: ${err?.message || 'Login failed'}`,
        }));
        return;
      } finally {
        setIsAuthenticating(false);
      }
    }

    setIsSyncing(true);
    try {
      const result = await GoogleDriveSyncService.syncNow(vaultName);
      setSyncStatus(result);
      if (result.lastError) {
        if (
          result.lastError.includes('access token') ||
          result.lastError.includes('401') ||
          result.lastError.includes('sign in')
        ) {
          setAccessToken(null);
        }
      } else {
        fetchRemoteWorkspaces();
      }
    } catch (err: any) {
      setSyncStatus((prev) => ({ ...prev, lastError: err?.message || 'Sync failed' }));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSelectRemoteWorkspace = async (remote: RemoteWorkspace) => {
    let token = await getAccessToken();
    if (!user || !token) {
      setIsAuthenticating(true);
      try {
        const res = await googleSignIn();
        if (res) {
          setUser(res.user);
          token = res.accessToken;
          setSyncStatus((prev) => ({ ...prev, isConnected: true, lastError: null }));
        } else {
          return;
        }
      } catch (err: any) {
        setSyncStatus((prev) => ({
          ...prev,
          lastError: `Google authentication required: ${err?.message || 'Login failed'}`,
        }));
        return;
      } finally {
        setIsAuthenticating(false);
      }
    }

    setIsDownloadingWorkspace(true);
    setIsSyncing(true);
    try {
      const cleanName = remote.name;
      const wsId =
        cleanName === 'Local Vault'
          ? 'default-vault'
          : `drive-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

      // Register or ensure workspace in local db
      const existing = await db.workspaces.get(wsId);
      if (!existing) {
        await db.workspaces.put({
          id: wsId,
          name: cleanName,
          mode: 'indexeddb',
          createdAt: Date.now(),
          updatedAt: Date.now(),
        });
      }

      // Switch active workspace in local state
      setActiveWorkspaceId(wsId, cleanName);
      setMountedMode('indexeddb', cleanName);

      // Perform sync to download files from that Google Drive folder
      const result = await GoogleDriveSyncService.syncNow(cleanName, remote.id, wsId);
      setSyncStatus(result);
      fetchRemoteWorkspaces();
      showToast(`Switched and synced workspace "${cleanName}" from Google Drive`);
    } catch (err: any) {
      setSyncStatus((prev) => ({
        ...prev,
        lastError: err?.message || 'Failed to sync workspace from Google Drive',
      }));
    } finally {
      setIsDownloadingWorkspace(false);
      setIsSyncing(false);
    }
  };

  // Generate Theme with Gemini
  const handleGenerateAiTheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vibePrompt.trim()) return;

    setIsGeneratingTheme(true);
    setAiThemeError(null);

    try {
      const res = await fetch('/app/api/theme/generate'.replace('/app', ''), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: vibePrompt }),
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || 'Failed to generate theme');
      }

      const generated = await res.json();
      const newCustom: Partial<ThemeDefinition> = {
        name: generated.name || 'AI Generated Theme',
        description: `Theme generated for vibe: "${vibePrompt}"`,
        background: generated.background,
        foreground: generated.foreground,
        card: generated.card,
        border: generated.border,
        accent: generated.accent,
        primary: generated.primary || generated.accent,
        fontFamily: generated.fontFamily || 'system-ui, sans-serif',
        fontFamilyGoogleUrl: generated.fontFamilyGoogleUrl,
        backgroundImageUrl: generated.backgroundImageUrl || '',
        isDark: true, // or compute luminance
        syntaxBg: generated.card || '#1c1c26',
        syntaxKeyword: generated.accent || '#c084fc',
        syntaxString: '#a7f3d0',
        syntaxFunction: generated.primary || '#60a5fa',
        syntaxComment: '#71717a',
        syntaxVariable: generated.foreground || '#f472b6',
        syntaxNumber: '#fb923c',
        syntaxOperator: generated.accent || '#818cf8',
      };

      updateCustomTheme(newCustom);
      setTheme('custom');
      setShowCustomWizard(true);
    } catch (err: any) {
      setAiThemeError(err.message || 'Theme generation failed');
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  // Ensure "Custom" is always pinned as the last item in the grid
  const nonCustomPresets = THEME_PRESETS.filter((t) => t.id !== 'custom');
  const customPreset = THEME_PRESETS.find((t) => t.id === 'custom') || DEFAULT_CUSTOM_THEME;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans transition-colors duration-200">
      {/* iOS Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[var(--card)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 select-none">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 -ml-1 transition-transform group-hover:-translate-x-0.5" />
            <span>Workspace</span>
          </Link>

          <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Settings
          </h1>

          <div className="w-16" />
        </div>
      </header>

      {/* Main Settings Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-8 pb-20">
        {/* Section 1: Google SSO & Google Drive Cloud Sync */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Cloud Sync &amp; Google Drive
              </span>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                Authenticate with Google to backup and synchronize Markdown notes
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
            {/* Account Card Row */}
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
                      Sync your notes across devices with Google Drive
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
                      <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
                    </button>
                    <button
                      onClick={handleGoogleLogout}
                      className="p-2 rounded-xl text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
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

            {/* Sync Error Banner */}
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

            {/* Sync Metadata Row */}
            {user && (
              <div className="px-4 py-3 bg-neutral-50/50 dark:bg-neutral-900/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <span className="text-neutral-500 dark:text-neutral-400">Workspace Root Folder:</span>
                  <p className="font-mono text-neutral-800 dark:text-neutral-200">
                    {syncStatus.folderName || `Kite-${vaultName}`}
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

            {/* Workspaces Available in Google Drive */}
            {user && (
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
                      No existing Kite workspaces found in Google Drive yet.
                    </p>
                    <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-0.5">
                      Click &ldquo;Sync Now&rdquo; above to upload your current workspace to Google Drive.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Section 2: AI Theme Generator */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                AI Theme Studio
              </span>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                Generate tailored high-contrast color palettes powered by Gemini 3.5 Flash-Lite
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/50 px-2 py-0.5 rounded-full">
              <Sparkles className="w-3 h-3" />
              Gemini 3.5 Flash-Lite
            </span>
          </div>

          <form
            onSubmit={handleGenerateAiTheme}
            className="rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 p-4 shadow-xs space-y-3"
          >
            <div className="relative">
              <input
                type="text"
                placeholder="Describe your theme vibe (e.g. 'Cyberpunk neon rain', 'Cozy 80s parchment library', 'Tokyo midnight synthwave')..."
                value={vibePrompt}
                onChange={(e) => setVibePrompt(e.target.value)}
                disabled={isGeneratingTheme}
                className="w-full px-3.5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700/80 text-xs text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 outline-none focus:ring-2 focus:ring-indigo-500 transition-all pr-32"
              />
              <button
                type="submit"
                disabled={isGeneratingTheme || !vibePrompt.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingTheme ? 'animate-spin' : ''}`} />
                <span>{isGeneratingTheme ? 'Designing...' : 'Generate'}</span>
              </button>
            </div>

            {aiThemeError && (
              <p className="text-xs text-red-500 dark:text-red-400">{aiThemeError}</p>
            )}
          </form>
        </div>

        {/* Section 3: Comprehensive Theme Presets (2 to 4 Column Grid) */}
        <div>
          <div className="px-3 mb-2 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
                Theme Presets &amp; Customization
              </span>
              <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                Select from 14 handcrafted presets or personalize your custom theme
              </p>
            </div>
            <button
              onClick={() => setShowCustomWizard(!showCustomWizard)}
              className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>{showCustomWizard ? 'Hide Wizard' : 'Custom Wizard'}</span>
            </button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {nonCustomPresets.map((t) => {
              const isSelected = themeId === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`group relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                    isSelected
                      ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md scale-[1.01]'
                      : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                  style={{ backgroundColor: t.card }}
                >
                  <div className="space-y-2">
                    {/* Header: Name and Active Check */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-xs font-bold tracking-tight truncate"
                        style={{ color: t.foreground }}
                      >
                        {t.name}
                      </span>
                      {isSelected && (
                        <div
                          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                          style={{ backgroundColor: t.accent }}
                        >
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Preview Swatches */}
                    <div
                      className="p-2.5 rounded-xl border flex flex-col gap-1.5"
                      style={{
                        backgroundColor: t.background,
                        borderColor: t.border,
                      }}
                    >
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: t.accent }}
                        />
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: t.primary }}
                        />
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: t.foreground }}
                        />
                      </div>
                      <div
                        className="text-[10px] truncate font-medium opacity-80"
                        style={{ color: t.foreground, fontFamily: t.fontFamily }}
                      >
                        The quick brown fox
                      </div>
                    </div>
                  </div>

                  {/* Caption */}
                  <p
                    className="text-[10px] mt-2 line-clamp-1 opacity-70"
                    style={{ color: t.foreground }}
                  >
                    {t.description}
                  </p>
                </div>
              );
            })}

            {/* Custom Theme Card Pinned as Final Card in Grid */}
            <div
              key="custom"
              onClick={() => {
                setTheme('custom');
                setShowCustomWizard(true);
              }}
              className={`group relative rounded-2xl p-3 border transition-all cursor-pointer flex flex-col justify-between overflow-hidden ${
                themeId === 'custom'
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 shadow-md scale-[1.01]'
                  : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
              }`}
              style={{ backgroundColor: customTheme.card }}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate">
                    <Sliders className="w-3.5 h-3.5 text-purple-500" />
                    <span
                      className="text-xs font-bold tracking-tight truncate"
                      style={{ color: customTheme.foreground }}
                    >
                      {customTheme.name || 'Custom Theme'}
                    </span>
                  </div>
                  {themeId === 'custom' && (
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: customTheme.accent }}
                    >
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>

                <div
                  className="p-2.5 rounded-xl border flex flex-col gap-1.5 relative overflow-hidden"
                  style={{
                    backgroundColor: customTheme.background,
                    borderColor: customTheme.border,
                  }}
                >
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: customTheme.accent }}
                    />
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: customTheme.primary }}
                    />
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: customTheme.foreground }}
                    />
                  </div>
                  <div
                    className="text-[10px] truncate font-medium opacity-80"
                    style={{
                      color: customTheme.foreground,
                      fontFamily: customTheme.fontFamily,
                    }}
                  >
                    Custom typography &amp; background
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-purple-400 font-semibold uppercase tracking-wider">
                  Pinned Custom Slot
                </span>
                <span className="text-[10px] text-indigo-500 hover:underline">
                  Configure
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 4: Custom Theme Wizard (Inline Builder) */}
        {showCustomWizard && (
          <div className="rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 p-5 shadow-xs space-y-4 animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-500" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-800 dark:text-neutral-200">
                  Custom Theme Palette &amp; Backdrop Wizard
                </h3>
              </div>
              <button
                onClick={() => setShowCustomWizard(false)}
                className="text-xs text-neutral-400 hover:text-neutral-600"
              >
                Close
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                  Background Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customTheme.background}
                    onChange={(e) => updateCustomTheme({ background: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 bg-transparent"
                  />
                  <input
                    type="text"
                    value={customTheme.background}
                    onChange={(e) => updateCustomTheme({ background: e.target.value })}
                    className="w-full text-xs font-mono px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                  Card Container Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customTheme.card}
                    onChange={(e) => updateCustomTheme({ card: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 bg-transparent"
                  />
                  <input
                    type="text"
                    value={customTheme.card}
                    onChange={(e) => updateCustomTheme({ card: e.target.value })}
                    className="w-full text-xs font-mono px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                  Accent Color
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customTheme.accent}
                    onChange={(e) => updateCustomTheme({ accent: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 bg-transparent"
                  />
                  <input
                    type="text"
                    value={customTheme.accent}
                    onChange={(e) => updateCustomTheme({ accent: e.target.value })}
                    className="w-full text-xs font-mono px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                  Text / Foreground
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={customTheme.foreground}
                    onChange={(e) => updateCustomTheme({ foreground: e.target.value })}
                    className="w-8 h-8 rounded-lg cursor-pointer border border-neutral-300 dark:border-neutral-700 bg-transparent"
                  />
                  <input
                    type="text"
                    value={customTheme.foreground}
                    onChange={(e) => updateCustomTheme({ foreground: e.target.value })}
                    className="w-full text-xs font-mono px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
                  />
                </div>
              </div>
            </div>

            {/* Typography Selector & Background Image */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                  Font Family
                </label>
                <select
                  value={customTheme.fontFamily}
                  onChange={(e) => updateCustomTheme({ fontFamily: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                >
                  <option value="system-ui, -apple-system, sans-serif">System Default</option>
                  <option value="'Inter', sans-serif">Inter</option>
                  <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
                  <option value="'Fira Code', monospace">Fira Code</option>
                  <option value="'Outfit', sans-serif">Outfit</option>
                  <option value="'Plus Jakarta Sans', sans-serif">Plus Jakarta Sans</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 block mb-1">
                  Custom Ambient Backdrop Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={customTheme.backgroundImageUrl || ''}
                  onChange={(e) => updateCustomTheme({ backgroundImageUrl: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* Section 5: Trash & Ephemeral Retention Settings */}
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
                onClick={() => {
                  if (confirm(`Permanently delete all ${trashCount} notes in the Trash?`)) {
                    emptyTrashAll();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-rose-500 hover:text-white bg-rose-500/10 hover:bg-rose-600 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Empty Trash Now</span>
              </button>
            </div>
          </div>
        </div>

        {/* Section 6: Universal Shortcuts & About */}
        <div>
          <div className="px-3 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">
              Shortcuts &amp; Controls
            </span>
          </div>

          <div className="rounded-2xl bg-white dark:bg-neutral-900/80 border border-neutral-200/80 dark:border-neutral-800/80 divide-y divide-neutral-100 dark:divide-neutral-800/60 overflow-hidden shadow-xs">
            <div className="p-3.5 flex items-center justify-between text-xs">
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                Universal Emoji Drawer
              </span>
              <kbd className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[11px] text-neutral-500">
                Shift + Space
              </kbd>
            </div>
            <div className="p-3.5 flex items-center justify-between text-xs">
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                Quick Search &amp; Jump
              </span>
              <kbd className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[11px] text-neutral-500">
                ⌘K / Ctrl+K
              </kbd>
            </div>
            <div className="p-3.5 flex items-center justify-between text-xs">
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                Bidirectional WikiLink Autocomplete
              </span>
              <kbd className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[11px] text-neutral-500">
                [[
              </kbd>
            </div>
            <div className="p-3.5 flex items-center justify-between text-xs">
              <span className="text-neutral-700 dark:text-neutral-300 font-medium">
                Block Slash Command Menu
              </span>
              <kbd className="px-2 py-1 rounded bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 font-mono text-[11px] text-neutral-500">
                /
              </kbd>
            </div>
          </div>
        </div>
      </main>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal />
    </div>
  );
}
