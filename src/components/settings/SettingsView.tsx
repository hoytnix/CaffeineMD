'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import { CreateWorkspaceModal } from '@/src/components/workspace/CreateWorkspaceModal';
import { db } from '@/src/lib/storage/db';
import { useLiveQuery } from 'dexie-react-hooks';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { GoogleDriveSyncSection } from './sections/GoogleDriveSyncSection';
import { ThemeSettingsSection } from './sections/ThemeSettingsSection';
import { CustomThemeBuilder } from './sections/CustomThemeBuilder';
import { StorageSettingsSection } from './sections/StorageSettingsSection';

export function SettingsView({ onBack }: { onBack?: () => void }) {
  const {
    themeId,
    setTheme,
    customTheme,
    updateCustomTheme,
    vaultName,
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
  const [showCustomWizard, setShowCustomWizard] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans transition-colors duration-200">
      {/* iOS Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[var(--card)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 select-none">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 -ml-1 transition-transform group-hover:-translate-x-0.5" />
              <span>Workspace</span>
            </button>
          ) : (
            <Link
              href="/"
              className="flex items-center gap-1 text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors group cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 -ml-1 transition-transform group-hover:-translate-x-0.5" />
              <span>Workspace</span>
            </Link>
          )}

          <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100">
            Settings
          </h1>

          <div className="w-16" />
        </div>
      </header>

      {/* Main Settings Body */}
      <main className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-8 pb-20">
        {/* Google SSO & Google Drive Cloud Sync */}
        <GoogleDriveSyncSection
          vaultName={vaultName}
          showToast={showToast}
          setActiveWorkspaceId={setActiveWorkspaceId}
          setMountedMode={setMountedMode}
          setCreateWorkspaceModalOpen={setCreateWorkspaceModalOpen}
        />

        {/* AI Theme Generator & Inline Custom Theme Wizard */}
        <CustomThemeBuilder
          customTheme={customTheme}
          updateCustomTheme={updateCustomTheme}
          setTheme={setTheme}
          showCustomWizard={showCustomWizard}
          setShowCustomWizard={setShowCustomWizard}
        />

        {/* Theme Presets Grid */}
        <ThemeSettingsSection
          themeId={themeId}
          setTheme={setTheme}
          customTheme={customTheme}
          showCustomWizard={showCustomWizard}
          setShowCustomWizard={setShowCustomWizard}
        />

        {/* Storage, Ephemeral Retention & Keyboard Shortcuts */}
        <StorageSettingsSection
          trashRetentionDays={trashRetentionDays}
          setTrashRetentionDays={setTrashRetentionDays}
          emptyTrashAll={emptyTrashAll}
          trashCount={trashCount}
        />
      </main>

      {/* Create Workspace Modal */}
      <CreateWorkspaceModal />
    </div>
  );
}
