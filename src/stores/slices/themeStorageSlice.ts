import {
  ThemeDefinition,
  applyThemeId,
} from '../../lib/themes/themeDefinitions';
import {
  ShortcutActionId,
  DEFAULT_SHORTCUTS,
} from '../../lib/shortcuts/shortcutManager';
import { storageRegistry, STORAGE_KEYS } from '../../lib/config/storageRegistry';
import {
  ToolboxPosition,
  EditorFontFamily,
  DEFAULT_AUTOSAVE_INTERVAL,
  getInitialStoredTheme,
  getInitialStoredThemeOpacity,
  getInitialStoredCustomColors,
  getInitialStoredEditorFont,
  getInitialStoredEditorFontSize,
  getInitialStoredSpellcheck,
  getInitialStoredSandboxEnabled,
  getInitialStoredShortcuts,
} from './themeStorageUtils';

export type { ToolboxPosition, EditorFontFamily };
export { DEFAULT_AUTOSAVE_INTERVAL };

export interface ThemeSlice {
  themeId: string;
  theme: string;
  customTheme: ThemeDefinition;
  customThemeColors: Partial<ThemeDefinition>;
  themeOpacity: number;
  setThemeOpacity: (opacity: number) => void;
  setTheme: (themeId: string) => void;
  setCustomThemeColors: (colors: Partial<ThemeDefinition>) => void;
  updateCustomTheme: (tokens: Partial<ThemeDefinition>) => void;
  hydrateThemeFromStorage: () => void;
  editorFontFamily: EditorFontFamily;
  setEditorFontFamily: (font: EditorFontFamily) => void;
  editorFontSize: number;
  setEditorFontSize: (size: number) => void;
  spellcheck: boolean;
  setSpellcheck: (val: boolean) => void;
  toggleSpellcheck: () => void;
  codeExecutionSandboxEnabled: boolean;
  setCodeExecutionSandboxEnabled: (enabled: boolean) => void;
  toggleCodeExecutionSandbox: () => void;
  toolboxPosition: ToolboxPosition;
  setToolboxPosition: (position: ToolboxPosition) => void;
  autosaveInterval: number;
  setAutosaveInterval: (interval: number) => void;
  keyboardShortcuts: Record<ShortcutActionId, string>;
  setKeyboardShortcut: (actionId: ShortcutActionId, combo: string) => void;
  resetKeyboardShortcuts: () => void;
}

export const createThemeStorageSlice = (set: any, get: any): ThemeSlice => ({
  themeId: getInitialStoredTheme(),
  theme: getInitialStoredTheme(),
  customTheme: getInitialStoredCustomColors(),
  customThemeColors: getInitialStoredCustomColors(),
  themeOpacity: getInitialStoredThemeOpacity(),

  setThemeOpacity: (opacity: number) => {
    const clamped = Math.max(0.1, Math.min(1.0, Number(opacity.toFixed(2))));
    set({ themeOpacity: clamped });
    storageRegistry.setItem(STORAGE_KEYS.THEME_OPACITY, String(clamped));
    if (typeof window !== 'undefined') {
      document.documentElement.style.setProperty('--theme-opacity', String(clamped));
      document.documentElement.style.setProperty('--bg-image-opacity', String(clamped));
    }
    const currentCustom = get().customThemeColors || get().customTheme;
    const currentThemeId = get().themeId;
    applyThemeId(currentThemeId, { ...currentCustom, bgOpacity: clamped });
  },

  setTheme: (themeId) => {
    set({ themeId, theme: themeId });
    storageRegistry.setItem(STORAGE_KEYS.ACTIVE_THEME, themeId);
    const currentCustom = get().customThemeColors || get().customTheme;
    applyThemeId(themeId, { ...currentCustom, bgOpacity: get().themeOpacity });
  },

  setCustomThemeColors: (colors) => {
    const updated: ThemeDefinition = { ...get().customTheme, ...colors, id: 'custom' };
    set({ customTheme: updated, customThemeColors: updated, themeId: 'custom', theme: 'custom' });
    storageRegistry.setJson(STORAGE_KEYS.CUSTOM_THEME_COLORS, updated);
    storageRegistry.setItem(STORAGE_KEYS.ACTIVE_THEME, 'custom');
    applyThemeId('custom', updated);
  },

  updateCustomTheme: (tokens) => {
    get().setCustomThemeColors(tokens);
  },

  hydrateThemeFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const savedTheme = getInitialStoredTheme();
      const savedCustomColors = getInitialStoredCustomColors();
      const savedFont = getInitialStoredEditorFont();
      const savedShortcuts = getInitialStoredShortcuts();
      const savedOpacity = getInitialStoredThemeOpacity();

      set({
        themeId: savedTheme,
        theme: savedTheme,
        customTheme: savedCustomColors,
        customThemeColors: savedCustomColors,
        themeOpacity: savedOpacity,
        editorFontFamily: savedFont,
        keyboardShortcuts: savedShortcuts,
      });

      document.documentElement.style.setProperty('--theme-opacity', String(savedOpacity));
      document.documentElement.style.setProperty('--bg-image-opacity', String(savedOpacity));
      applyThemeId(savedTheme, { ...savedCustomColors, bgOpacity: savedOpacity });
    } catch (err) {
      console.warn('Theme hydration error:', err);
    }
  },

  keyboardShortcuts: getInitialStoredShortcuts(),
  setKeyboardShortcut: (actionId: ShortcutActionId, combo: string) => {
    const updated = { ...get().keyboardShortcuts, [actionId]: combo };
    set({ keyboardShortcuts: updated });
    storageRegistry.setJson(STORAGE_KEYS.SHORTCUTS, updated);
  },
  resetKeyboardShortcuts: () => {
    set({ keyboardShortcuts: DEFAULT_SHORTCUTS });
    storageRegistry.removeItem(STORAGE_KEYS.SHORTCUTS);
  },

  editorFontFamily: getInitialStoredEditorFont(),
  setEditorFontFamily: (font: EditorFontFamily) => {
    set({ editorFontFamily: font });
    storageRegistry.setItem(STORAGE_KEYS.EDITOR_FONT, font);
    storageRegistry.setItem(STORAGE_KEYS.EDITOR_FONT_FAMILY, font);
  },

  editorFontSize: getInitialStoredEditorFontSize(),
  setEditorFontSize: (size: number) => {
    set({ editorFontSize: size });
    storageRegistry.setItem(STORAGE_KEYS.EDITOR_FONT_SIZE, String(size));
  },
  spellcheck: getInitialStoredSpellcheck(),
  setSpellcheck: (val: boolean) => {
    set({ spellcheck: val });
    storageRegistry.setItem(STORAGE_KEYS.SPELLCHECK, String(val));
  },
  toggleSpellcheck: () => get().setSpellcheck(!get().spellcheck),

  codeExecutionSandboxEnabled: getInitialStoredSandboxEnabled(),
  setCodeExecutionSandboxEnabled: (enabled: boolean) => {
    set({ codeExecutionSandboxEnabled: enabled });
    storageRegistry.setItem(STORAGE_KEYS.SANDBOX_ENABLED, String(enabled));
  },
  toggleCodeExecutionSandbox: () => get().setCodeExecutionSandboxEnabled(!get().codeExecutionSandboxEnabled),

  toolboxPosition: (() => {
    const pos = storageRegistry.getItem(STORAGE_KEYS.TOOLBOX_POSITION, 'bottom');
    return ['left', 'right', 'bottom', 'top'].includes(pos) ? (pos as ToolboxPosition) : 'bottom';
  })(),
  setToolboxPosition: (position: ToolboxPosition) => {
    set({ toolboxPosition: position });
    storageRegistry.setItem(STORAGE_KEYS.TOOLBOX_POSITION, position);
  },

  autosaveInterval: (() => {
    const stored =
      storageRegistry.getItem(STORAGE_KEYS.AUTOSAVE_INTERVAL) ||
      storageRegistry.getItem(STORAGE_KEYS.LEGACY_AUTOSAVE_INTERVAL);
    const parsed = stored ? parseInt(stored, 10) : NaN;
    return !isNaN(parsed) ? parsed : DEFAULT_AUTOSAVE_INTERVAL;
  })(),
  setAutosaveInterval: (interval: number) => {
    set({ autosaveInterval: interval });
    storageRegistry.setItem(STORAGE_KEYS.AUTOSAVE_INTERVAL, String(interval));
  },
});
