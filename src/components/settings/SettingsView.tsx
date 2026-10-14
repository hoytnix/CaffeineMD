'use client';

import React from 'react';
import { CreateWorkspaceModal } from '@/src/components/workspace/CreateWorkspaceModal';
import { IosSettingsHome } from './IosSettingsHome';
import { SettingsHeader } from './SettingsHeader';
import { GoogleDriveSyncSection } from './sections/GoogleDriveSyncSection';
import { GeminiSettingsCard } from './sections/GeminiSettingsCard';
import { DeploymentSettingsCard } from './sections/DeploymentSettingsCard';
import { ThemeSettingsSection } from './sections/ThemeSettingsSection';
import { StorageSettingsSection } from './sections/StorageSettingsSection';
import { EditorSettingsSection } from './sections/EditorSettingsSection';
import { KeyboardShortcutsSection } from './sections/KeyboardShortcutsSection';
import { useSettingsState } from './useSettingsState';

export function SettingsView({ onBack }: { onBack?: () => void }) {
  const {
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
  } = useSettingsState(onBack);

  return (
    <div
      style={{ backgroundColor: 'var(--bg-primary, var(--theme-bg-primary))' }}
      className="min-h-screen bg-[var(--bg-primary)] text-[var(--foreground)] flex flex-col transition-colors duration-200 relative"
    >
      {/* Ambient Theme Background Image Layer (Adjustable Opacity) */}
      {bgImageUrl && (
        <div
          aria-hidden="true"
          style={{
            backgroundImage: `url("${bgImageUrl}")`,
            opacity: store.themeOpacity,
          }}
          className="fixed inset-0 pointer-events-none bg-cover bg-center bg-no-repeat z-0"
        />
      )}

      <SettingsHeader
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        onBackToWorkspace={handleBackToWorkspace}
      />

      {/* Main Settings Content */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 pb-20 relative z-10 bg-transparent">
        {activeScreen === 'home' && (
          <IosSettingsHome
            onSelectScreen={setActiveScreen}
            googleDriveUser={googleDriveUser}
            themeName={themeName}
            editorFontSize={store.editorFontSize}
            hasGeminiKey={Boolean(geminiApiKey?.trim())}
          />
        )}
        {activeScreen === 'profile' && (
          <GoogleDriveSyncSection
            vaultName={store.vaultName}
            showToast={store.showToast}
            setActiveWorkspaceId={store.setActiveWorkspaceId}
            setMountedMode={store.setMountedMode}
            setCreateWorkspaceModalOpen={store.setCreateWorkspaceModalOpen}
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
            themeId={store.themeId}
            setTheme={store.setTheme}
            customTheme={store.customTheme}
            updateCustomTheme={store.updateCustomTheme}
            showCustomWizard={showCustomWizard}
            setShowCustomWizard={setShowCustomWizard}
          />
        )}
        {activeScreen === 'editor' && (
          <EditorSettingsSection
            toolboxPosition={store.toolboxPosition}
            setToolboxPosition={store.setToolboxPosition}
            autosaveInterval={store.autosaveInterval}
            setAutosaveInterval={store.setAutosaveInterval}
            showToast={store.showToast}
          />
        )}
        {activeScreen === 'keyboard' && <KeyboardShortcutsSection />}
        {activeScreen === 'storage' && (
          <StorageSettingsSection
            trashRetentionDays={store.trashRetentionDays}
            setTrashRetentionDays={store.setTrashRetentionDays}
            emptyTrashAll={store.emptyTrashAll}
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
