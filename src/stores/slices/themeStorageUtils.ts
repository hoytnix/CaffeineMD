import {
  ThemeDefinition,
  DEFAULT_CUSTOM_THEME,
} from '../../lib/themes/themeDefinitions';
import {
  ShortcutActionId,
  DEFAULT_SHORTCUTS,
} from '../../lib/shortcuts/shortcutManager';

export type ToolboxPosition = 'left' | 'right' | 'bottom' | 'top';
export type EditorFontFamily = 'sans' | 'mono' | 'serif';

export const DEFAULT_AUTOSAVE_INTERVAL = 300000;

export const getInitialStoredTheme = (): string => {
  if (typeof window === 'undefined') return 'dark';
  return (
    localStorage.getItem('caffeinemd-theme') ||
    localStorage.getItem('kite-theme-id') ||
    'dark'
  );
};

export const getInitialStoredThemeOpacity = (): number => {
  if (typeof window === 'undefined') return 0.85;
  const raw =
    localStorage.getItem('caffeinemd-theme-opacity') ||
    localStorage.getItem('kite-theme-opacity');
  if (raw !== null) {
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed >= 0.05 && parsed <= 1.0) {
      return parsed;
    }
  }
  return 0.85;
};

export const getInitialStoredCustomColors = (): ThemeDefinition => {
  if (typeof window === 'undefined') return DEFAULT_CUSTOM_THEME;
  try {
    const raw =
      localStorage.getItem('caffeinemd-custom-theme-colors') ||
      localStorage.getItem('kite-custom-theme');
    if (raw) {
      return { ...DEFAULT_CUSTOM_THEME, ...JSON.parse(raw), id: 'custom' };
    }
  } catch {}
  return DEFAULT_CUSTOM_THEME;
};

export const getInitialStoredEditorFont = (): EditorFontFamily => {
  if (typeof window === 'undefined') return 'sans';
  const val =
    localStorage.getItem('caffeinemd-editor-font') ||
    localStorage.getItem('caffeinemd-editor-font-family') ||
    '';
  return ['sans', 'mono', 'serif'].includes(val) ? (val as EditorFontFamily) : 'sans';
};

export const getInitialStoredEditorFontSize = (): number => {
  if (typeof window === 'undefined') return 16;
  const val = parseInt(localStorage.getItem('caffeinemd-editor-font-size') || '16', 10);
  return isNaN(val) || val < 12 || val > 24 ? 16 : val;
};

export const getInitialStoredSpellcheck = (): boolean => {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('caffeinemd-spellcheck') !== 'false';
};

export const getInitialStoredSandboxEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('caffeinemd-code-execution-sandbox') === 'true';
};

export const getInitialStoredShortcuts = (): Record<ShortcutActionId, string> => {
  if (typeof window === 'undefined') return DEFAULT_SHORTCUTS;
  try {
    const raw = localStorage.getItem('caffeinemd-keyboard-shortcuts');
    if (raw) {
      return { ...DEFAULT_SHORTCUTS, ...JSON.parse(raw) };
    }
  } catch {}
  return DEFAULT_SHORTCUTS;
};
