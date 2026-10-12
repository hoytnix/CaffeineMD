'use client';

import { useState, useEffect } from 'react';
import { db } from '@/src/lib/storage/db';
import {
  initAuth,
  googleSignIn,
  logoutGoogle,
  getAccessToken,
  setAccessToken,
} from '@/src/lib/firebase/client';
import {
  GoogleDriveSyncService,
  DriveSyncStatus,
  RemoteWorkspace,
} from '@/src/lib/sync/googleDriveSync';
import { User } from 'firebase/auth';

export interface UseGoogleDriveSyncSettingsProps {
  vaultName: string;
  showToast: (msg: string) => void;
  setActiveWorkspaceId: (id: string, name: string) => void;
  setMountedMode: (mode: 'indexeddb' | 'filesystem', name: string) => void;
}

export function useGoogleDriveSyncSettings({
  vaultName,
  showToast,
  setActiveWorkspaceId,
  setMountedMode,
}: UseGoogleDriveSyncSettingsProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgressText, setSyncProgressText] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<DriveSyncStatus>({
    isConnected: false,
    isSyncing: false,
    folderId: null,
    folderName: null,
    lastSyncedAt: null,
    lastError: null,
    stats: { uploaded: 0, downloaded: 0, skipped: 0 },
  });

  const [remoteWorkspaces, setRemoteWorkspaces] = useState<RemoteWorkspace[]>([]);
  const [isLoadingRemoteWorkspaces, setIsLoadingRemoteWorkspaces] = useState(false);
  const [isDownloadingWorkspace, setIsDownloadingWorkspace] = useState(false);

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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      alert(`Sign in failed: ${msg}`);
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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Login failed';
        setSyncStatus((prev) => ({
          ...prev,
          lastError: `Google authentication required: ${msg}`,
        }));
        return;
      } finally {
        setIsAuthenticating(false);
      }
    }

    setIsSyncing(true);
    setSyncProgressText('Starting sync...');
    try {
      const result = await GoogleDriveSyncService.syncNow(
        vaultName,
        undefined,
        undefined,
        (progress) => setSyncProgressText(progress)
      );
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sync failed';
      setSyncStatus((prev) => ({ ...prev, lastError: msg }));
    } finally {
      setIsSyncing(false);
      setSyncProgressText(null);
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
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Login failed';
        setSyncStatus((prev) => ({
          ...prev,
          lastError: `Google authentication required: ${msg}`,
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
        cleanName === 'Local Vault' || cleanName === 'CaffeineMD Vault'
          ? 'default-vault'
          : `drive-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

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

      setActiveWorkspaceId(wsId, cleanName);
      setMountedMode('indexeddb', cleanName);

      const result = await GoogleDriveSyncService.syncNow(
        cleanName,
        remote.id,
        wsId,
        (progress) => setSyncProgressText(progress)
      );
      setSyncStatus(result);
      fetchRemoteWorkspaces();
      showToast(`Switched and synced workspace "${cleanName}" from Google Drive`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to sync workspace';
      setSyncStatus((prev) => ({ ...prev, lastError: msg }));
    } finally {
      setIsDownloadingWorkspace(false);
      setIsSyncing(false);
    }
  };

  return {
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
  };
}
