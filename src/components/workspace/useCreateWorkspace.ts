'use client';

import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { WorkspaceManager } from '@/src/lib/workspaces/workspaceManager';
import { googleSignIn, getAccessToken, initAuth } from '@/src/lib/firebase/client';

export type WorkspaceType = 'google' | 'local';
export type LocalSubtype = 'indexeddb' | 'disk';

export function useCreateWorkspace() {
  const {
    isCreateWorkspaceModalOpen,
    setCreateWorkspaceModalOpen,
    setActiveWorkspaceId,
    setMountedMode,
    showToast,
    setImportProgress,
  } = useWorkspaceStore();

  const [workspaceName, setWorkspaceName] = useState('');
  const [workspaceType, setWorkspaceType] = useState<WorkspaceType>('google');
  const [localSubtype, setLocalSubtype] = useState<LocalSubtype>('indexeddb');
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
        if (localSubtype === 'disk') {
          setCreateWorkspaceModalOpen(false);
          const ws = await WorkspaceManager.mountDiskFolderAsWorkspace((p) => {
            setImportProgress(p);
          });
          setActiveWorkspaceId(ws.id, ws.name);
          setMountedMode('filesystem', ws.name);
          showToast(`Mounted disk workspace "${ws.name}"`);
        } else {
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

  return {
    isOpen: isCreateWorkspaceModalOpen,
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
  };
}
