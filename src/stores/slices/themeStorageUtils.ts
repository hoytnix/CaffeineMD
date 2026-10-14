import {
  ThemeDefinition,
  DEFAULT_CUSTOM_THEME,
} from '../../lib/themes/themeDefinitions';
import {
  ShortcutActionId,
  DEFAULT_SHORTCUTS,
} from '../../lib/shortcuts/shortcutManager';
import { storageRegistry, STORAGE_KEYS } from '../../lib/config/storageRegistry';

export type ToolboxPosition = 'left' | 'right' | 'bottom' | 'top';
export type EditorFontFamily = 'sans' | 'mono' | 'serif';

export const DEFAULT_AUTOSAVE_INTERVAL = 300000;

export const getInitialStoredTheme = (): string => {
  return (
    storageRegistry.getItem(STORAGE_KEYS.ACTIVE_THEME) ||
    storageRegistry.getItem(STORAGE_KEYS.LEGACY_THEME) ||
    'dark'
  );
};

export const getInitialStoredThemeOpacity = (): number => {
  const raw =
    storageRegistry.getItem(STORAGE_KEYS.THEME_OPACITY) ||
    storageRegistry.getItem(STORAGE_KEYS.LEGACY_THEME_OPACITY);
  if (raw) {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0.05 && parsed <= 1.0) {
      return parsed;
    }
  }
  return 0.85;
};

export const getInitialStoredCustomColors = (): ThemeDefinition => {
  const stored =
    storageRegistry.getJson<Partial<ThemeDefinition> | null>(
      STORAGE_KEYS.CUSTOM_THEME_COLORS,
      null
    ) ||
    storageRegistry.getJson<Partial<ThemeDefinition> | null>(
      STORAGE_KEYS.LEGACY_CUSTOM_THEME,
      null
    );

  if (stored) {
    return { ...DEFAULT_CUSTOM_THEME, ...stored, id: 'custom' };
  }
  return DEFAULT_CUSTOM_THEME;
};

export const getInitialStoredEditorFont = (): EditorFontFamily => {
  const val =
    storageRegistry.getItem(STORAGE_KEYS.EDITOR_FONT) ||
    storageRegistry.getItem(STORAGE_KEYS.EDITOR_FONT_FAMILY);
  return ['sans', 'mono', 'serif'].includes(val) ? (val as EditorFontFamily) : 'sans';
};

export const getInitialStoredEditorFontSize = (): number => {
  const raw = storageRegistry.getItem(STORAGE_KEYS.EDITOR_FONT_SIZE, '16');
  const val = parseInt(raw, 10);
  return isNaN(val) || val < 12 || val > 24 ? 16 : val;
};

export const getInitialStoredSpellcheck = (): boolean => {
  const raw = storageRegistry.getItem(STORAGE_KEYS.SPELLCHECK, 'true');
  return raw !== 'false';
};

export const getInitialStoredSandboxEnabled = (): boolean => {
  return storageRegistry.getItem(STORAGE_KEYS.SANDBOX_ENABLED) === 'true';
};

export const getInitialStoredShortcuts = (): Record<ShortcutActionId, string> => {
  const parsed = storageRegistry.getJson<Record<ShortcutActionId, string> | null>(
    STORAGE_KEYS.SHORTCUTS,
    null
  );
  if (parsed) {
    return { ...DEFAULT_SHORTCUTS, ...parsed };
  }
  return DEFAULT_SHORTCUTS;
};
