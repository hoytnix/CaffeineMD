import {
  ThemeDefinition,
  DEFAULT_CUSTOM_THEME,
  applyThemeId,
} from '../../lib/themes/themeDefinitions';
import {
  ShortcutActionId,
  DEFAULT_SHORTCUTS,
} from '../../lib/shortcuts/shortcutManager';
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
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('caffeinemd-theme-opacity', String(clamped));
        localStorage.setItem('kite-theme-opacity', String(clamped));
      } catch {}
      document.documentElement.style.setProperty('--theme-opacity', String(clamped));
      document.documentElement.style.setProperty('--bg-image-opacity', String(clamped));
    }
    const currentCustom = get().customThemeColors || get().customTheme;
    const currentThemeId = get().themeId;
    applyThemeId(currentThemeId, { ...currentCustom, bgOpacity: clamped });
  },

  setTheme: (themeId) => {
    set({ themeId, theme: themeId });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('caffeinemd-theme', themeId);
        localStorage.setItem('kite-theme-id', themeId);
      } catch {}
    }
    const currentCustom = get().customThemeColors || get().customTheme;
    applyThemeId(themeId, { ...currentCustom, bgOpacity: get().themeOpacity });
  },

  setCustomThemeColors: (colors) => {
    const updated: ThemeDefinition = { ...get().customTheme, ...colors, id: 'custom' };
    set({ customTheme: updated, customThemeColors: updated, themeId: 'custom', theme: 'custom' });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('caffeinemd-custom-theme-colors', JSON.stringify(updated));
        localStorage.setItem('kite-custom-theme', JSON.stringify(updated));
        localStorage.setItem('caffeinemd-theme', 'custom');
        localStorage.setItem('kite-theme-id', 'custom');
      } catch {}
    }
    applyThemeId('custom', updated);
  },

  updateCustomTheme: (tokens) => {
    get().setCustomThemeColors(tokens);
  },

  hydrateThemeFromStorage: () => {
    if (typeof window === 'undefined') return;
    try {
      const savedTheme = localStorage.getItem('caffeinemd-theme') || localStorage.getItem('kite-theme-id') || 'dark';
      let savedCustomColors = get().customTheme;
      const rawCustom = localStorage.getItem('caffeinemd-custom-theme-colors') || localStorage.getItem('kite-custom-theme');
      if (rawCustom) {
        try { savedCustomColors = { ...DEFAULT_CUSTOM_THEME, ...JSON.parse(rawCustom), id: 'custom' }; } catch {}
      }
      const rawFont = localStorage.getItem('caffeinemd-editor-font') || localStorage.getItem('caffeinemd-editor-font-family') || 'sans';
      const savedFont: EditorFontFamily = ['sans', 'mono', 'serif'].includes(rawFont) ? (rawFont as EditorFontFamily) : 'sans';

      const rawShortcuts = localStorage.getItem('caffeinemd-keyboard-shortcuts');
      let savedShortcuts = get().keyboardShortcuts;
      if (rawShortcuts) {
        try { savedShortcuts = { ...DEFAULT_SHORTCUTS, ...JSON.parse(rawShortcuts) }; } catch {}
      }

      const rawOpacity = localStorage.getItem('caffeinemd-theme-opacity') || localStorage.getItem('kite-theme-opacity');
      let savedOpacity = get().themeOpacity;
      if (rawOpacity !== null) {
        const parsed = parseFloat(rawOpacity);
        if (!isNaN(parsed) && parsed >= 0.05 && parsed <= 1.0) savedOpacity = parsed;
      }

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
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('caffeinemd-keyboard-shortcuts', JSON.stringify(updated)); } catch {}
    }
  },
  resetKeyboardShortcuts: () => {
    set({ keyboardShortcuts: DEFAULT_SHORTCUTS });
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('caffeinemd-keyboard-shortcuts'); } catch {}
    }
  },

  editorFontFamily: getInitialStoredEditorFont(),
  setEditorFontFamily: (font: EditorFontFamily) => {
    set({ editorFontFamily: font });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('caffeinemd-editor-font', font);
        localStorage.setItem('caffeinemd-editor-font-family', font);
      } catch {}
    }
  },

  editorFontSize: getInitialStoredEditorFontSize(),
  setEditorFontSize: (size: number) => {
    set({ editorFontSize: size });
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('caffeinemd-editor-font-size', String(size)); } catch {}
    }
  },
  spellcheck: getInitialStoredSpellcheck(),
  setSpellcheck: (val: boolean) => {
    set({ spellcheck: val });
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('caffeinemd-spellcheck', String(val)); } catch {}
    }
  },
  toggleSpellcheck: () => get().setSpellcheck(!get().spellcheck),

  codeExecutionSandboxEnabled: getInitialStoredSandboxEnabled(),
  setCodeExecutionSandboxEnabled: (enabled: boolean) => {
    set({ codeExecutionSandboxEnabled: enabled });
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('caffeinemd-code-execution-sandbox', String(enabled)); } catch {}
    }
  },
  toggleCodeExecutionSandbox: () => get().setCodeExecutionSandboxEnabled(!get().codeExecutionSandboxEnabled),

  toolboxPosition:
    typeof window !== 'undefined' && ['left', 'right', 'bottom', 'top'].includes(localStorage.getItem('kite-toolbox-position') || '')
      ? (localStorage.getItem('kite-toolbox-position') as ToolboxPosition)
      : 'bottom',
  setToolboxPosition: (position: ToolboxPosition) => {
    set({ toolboxPosition: position });
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('kite-toolbox-position', position); } catch {}
    }
  },

  autosaveInterval:
    typeof window !== 'undefined'
      ? (() => {
          const stored = localStorage.getItem('caffeinemd-autosave-interval') || localStorage.getItem('kite-autosave-interval');
          const parsed = stored ? parseInt(stored, 10) : NaN;
          return !isNaN(parsed) ? parsed : DEFAULT_AUTOSAVE_INTERVAL;
        })()
      : DEFAULT_AUTOSAVE_INTERVAL,
  setAutosaveInterval: (interval: number) => {
    set({ autosaveInterval: interval });
    if (typeof window !== 'undefined') {
      try { localStorage.setItem('caffeinemd-autosave-interval', String(interval)); } catch {}
    }
  },
});
