'use client';

import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { THEME_PRESETS } from '@/src/lib/themes/themeDefinitions';
import { seedInitialVaultIfEmpty } from '@/src/lib/storage/db';

/**
 * Resolves the active ambient theme background image URL, opacity,
 * and triggers initial vault seeding + theme rehydration on mount.
 */
export function useWorkspaceThemeBackdrop() {
  const {
    themeId,
    customTheme,
    themeOpacity,
    hydrateThemeFromStorage,
  } = useWorkspaceStore();

  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    seedInitialVaultIfEmpty().then(() => {
      setHasInitialized(true);
    });

    hydrateThemeFromStorage();
  }, [hydrateThemeFromStorage]);

  const activeThemePreset = THEME_PRESETS.find((t) => t.id === themeId);
  const bgImageUrl =
    (themeId === 'custom'
      ? customTheme?.backgroundImageUrl || customTheme?.bgImageUrl
      : activeThemePreset?.backgroundImageUrl || activeThemePreset?.bgImageUrl) || '';

  return {
    bgImageUrl,
    themeOpacity,
    hasInitialized,
  };
}
