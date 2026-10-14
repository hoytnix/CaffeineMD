'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { CreateWorkspaceModal } from '@/src/components/workspace/CreateWorkspaceModal';
import { db } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { THEME_PRESETS } from '@/src/lib/themes/themeDefinitions';
import { getCurrentUser, initAuth } from '@/src/lib/firebase/client';
import { getGeminiApiKey } from '@/src/lib/export/geminiTemplateGenerator';
import { IosSettingsHome, SettingsScreen, GoogleDriveUserInfo } from './IosSettingsHome';
import { SettingsHeader } from './SettingsHeader';
import { GoogleDriveSyncSection } from './sections/GoogleDriveSyncSection';
import { GeminiSettingsCard } from './sections/GeminiSettingsCard';
import { DeploymentSettingsCard } from './sections/DeploymentSettingsCard';
import { ThemeSettingsSection } from './sections/ThemeSettingsSection';
import { StorageSettingsSection } from './sections/StorageSettingsSection';
import { EditorSettingsSection } from './sections/EditorSettingsSection';
import { KeyboardShortcutsSection } from './sections/KeyboardShortcutsSection';

export function SettingsView({ onBack }: { onBack?: () => void }) {
  const router = useRouter();
  const [activeScreen, setActiveScreen] = useState<SettingsScreen>('home');
  const {
    activeWorkspaceId,
    activeView,
    setActiveView,
    themeId,
    setTheme,
    customTheme,
    updateCustomTheme,
    hydrateThemeFromStorage,
    toolboxPosition,
    setToolboxPosition,
    autosaveInterval,
    setAutosaveInterval,
    vaultName,
    trashRetentionDays,
    setTrashRetentionDays,
    emptyTrashAll,
    setActiveWorkspaceId,
    setMountedMode,
    showToast,
    setCreateWorkspaceModalOpen,
    editorFontSize,
  } = useWorkspaceStore();

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
    if (activeView === 'settings') setActiveView('editor');
    if (onBack) {
      onBack();
      return;
    }
    router.push(`/w/${activeWorkspaceId || 'default-workspace'}`);
  };

  const rawFiles = useLiveQuery(() => db.files.toArray());
  const trashCount = rawFiles?.filter((f) => f.isTrash).length || 0;
  const [wizardOverride, setWizardOverride] = useState<boolean | null>(null);
  const showCustomWizard = wizardOverride !== null ? wizardOverride : themeId === 'custom';
  const setShowCustomWizard = (show: boolean | ((prev: boolean) => boolean)) => {
    setWizardOverride(typeof show === 'function' ? show(showCustomWizard) : show);
  };

  const activeThemePreset = THEME_PRESETS.find((t) => t.id === themeId);
  const themeName = activeThemePreset?.name || (themeId === 'custom' ? customTheme?.name || 'Custom' : themeId);

  return (
    <div
      style={{ backgroundColor: 'var(--theme-bg-primary-glass, var(--theme-bg-primary))' }}
      className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col transition-colors duration-200"
    >
      <SettingsHeader
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        onBackToWorkspace={handleBackToWorkspace}
      />

      {/* Main Settings Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-20">
        {activeScreen === 'home' && (
          <IosSettingsHome
            onSelectScreen={setActiveScreen}
            googleDriveUser={googleDriveUser}
            themeName={themeName}
            editorFontSize={editorFontSize}
            hasGeminiKey={Boolean(geminiApiKey?.trim())}
          />
        )}
        {activeScreen === 'profile' && (
          <GoogleDriveSyncSection
            vaultName={vaultName}
            showToast={showToast}
            setActiveWorkspaceId={setActiveWorkspaceId}
            setMountedMode={setMountedMode}
            setCreateWorkspaceModalOpen={setCreateWorkspaceModalOpen}
          />
        )}
        {activeScreen === 'apiKeys' && (
          <div className="space-y-8">
            <GeminiSettingsCard />
            <DeploymentSettingsCard />
          </div>
        )}
        {activeScreen === 'themes' && (
          <ThemeSettingsSection
            themeId={themeId}
            setTheme={setTheme}
            customTheme={customTheme}
            updateCustomTheme={updateCustomTheme}
            showCustomWizard={showCustomWizard}
            setShowCustomWizard={setShowCustomWizard}
          />
        )}
        {activeScreen === 'editor' && (
          <EditorSettingsSection
            toolboxPosition={toolboxPosition}
            setToolboxPosition={setToolboxPosition}
            autosaveInterval={autosaveInterval}
            setAutosaveInterval={setAutosaveInterval}
            showToast={showToast}
          />
        )}
        {activeScreen === 'keyboard' && <KeyboardShortcutsSection />}
        {activeScreen === 'storage' && (
          <StorageSettingsSection
            trashRetentionDays={trashRetentionDays}
            setTrashRetentionDays={setTrashRetentionDays}
            emptyTrashAll={emptyTrashAll}
            trashCount={trashCount}
          />
        )}
      </main>

      {/* Footer Branding */}
      <footer className="text-center py-4 text-xs text-neutral-400 dark:text-neutral-500">
        <a
          href="https://tehwiz.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-indigo-400 underline underline-offset-2 transition-colors cursor-pointer"
        >
          A TehWiz Production.
        </a>
      </footer>

      <CreateWorkspaceModal />
    </div>
  );
}
