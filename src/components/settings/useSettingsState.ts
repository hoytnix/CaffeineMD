'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { db } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { getCurrentUser, initAuth } from '@/src/lib/firebase/client';
import { getGeminiApiKey } from '@/src/lib/export/geminiTemplateGenerator';
import { THEME_PRESETS } from '@/src/lib/themes/themeDefinitions';
import { SettingsScreen, GoogleDriveUserInfo } from './IosSettingsHome';

export function useSettingsState(onBack?: () => void) {
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState<SettingsScreen>('home');
  const hydrateThemeFromStorage = useWorkspaceStore((s) => s.hydrateThemeFromStorage);
  const store = useWorkspaceStore();

  useEffect(() => {
    hydrateThemeFromStorage();
  }, [hydrateThemeFromStorage]);

  const [googleDriveUser, setGoogleDriveUser] = useState<GoogleDriveUserInfo | null>(() => {
    const user = getCurrentUser();
    return user ? { displayName: user.displayName, email: user.email, photoUrl: user.photoURL } : null;
  });

  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        if (user) {
          setGoogleDriveUser({ displayName: user.displayName, email: user.email, photoUrl: user.photoURL });
        } else {
          setGoogleDriveUser(null);
        }
      },
      () => setGoogleDriveUser(null)
    );
    return () => unsubscribe();
  }, []);

  const [geminiApiKey, setGeminiApiKey] = useState(() => getGeminiApiKey());
  useEffect(() => {
    const handleKeyUpdate = () => setGeminiApiKey(getGeminiApiKey());
    window.addEventListener('caffeinemd-gemini-key-updated', handleKeyUpdate);
    window.addEventListener('storage', handleKeyUpdate);
    return () => {
      window.removeEventListener('caffeinemd-gemini-key-updated', handleKeyUpdate);
      window.removeEventListener('storage', handleKeyUpdate);
    };
  }, []);

  const handleBackToWorkspace = () => {
    if (store.activeView === 'settings') store.setActiveView('editor');
    if (onBack) {
      onBack();
      return;
    }
    router.push(`/w/${store.activeWorkspaceId || 'default-workspace'}`);
  };

  const rawFiles = useLiveQuery(() => db.files.toArray());
  const trashCount = rawFiles?.filter((f) => f.isTrash).length || 0;

  const [wizardOverride, setWizardOverride] = useState<boolean | null>(null);
  const showCustomWizard = wizardOverride !== null ? wizardOverride : store.themeId === 'custom';
  const setShowCustomWizard = (show: boolean | ((prev: boolean) => boolean)) => {
    setWizardOverride(typeof show === 'function' ? show(showCustomWizard) : show);
  };

  const activeThemePreset = THEME_PRESETS.find((t) => t.id === store.themeId);
  const themeName =
    activeThemePreset?.name ||
    (store.themeId === 'custom' ? store.customTheme?.name || 'Custom' : store.themeId);
  const bgImageUrl =
    (store.themeId === 'custom'
      ? store.customTheme?.backgroundImageUrl || store.customTheme?.bgImageUrl
      : activeThemePreset?.backgroundImageUrl || activeThemePreset?.bgImageUrl) || '';

  return {
    activeScreen,
    setActiveScreen,
    googleDriveUser,
    geminiApiKey,
    handleBackToWorkspace,
    trashCount,
    showCustomWizard,
    setShowCustomWizard,
    themeName,
    bgImageUrl,
    store,
  };
}
