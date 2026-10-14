import { z } from 'zod';

export const STORAGE_KEYS = {
  ACTIVE_THEME: 'caffeinemd-theme',
  LEGACY_THEME: 'kite-theme-id',
  THEME_OPACITY: 'caffeinemd-theme-opacity',
  LEGACY_THEME_OPACITY: 'kite-theme-opacity',
  CUSTOM_THEME_COLORS: 'caffeinemd-custom-theme-colors',
  LEGACY_CUSTOM_THEME: 'kite-custom-theme',
  EDITOR_FONT: 'caffeinemd-editor-font',
  EDITOR_FONT_FAMILY: 'caffeinemd-editor-font-family',
  EDITOR_FONT_SIZE: 'caffeinemd-editor-font-size',
  SPELLCHECK: 'caffeinemd-spellcheck',
  SANDBOX_ENABLED: 'caffeinemd-code-execution-sandbox',
  SHORTCUTS: 'caffeinemd-keyboard-shortcuts',
  TOOLBOX_POSITION: 'kite-toolbox-position',
  AUTOSAVE_INTERVAL: 'caffeinemd-autosave-interval',
  LEGACY_AUTOSAVE_INTERVAL: 'kite-autosave-interval',
  TRASH_RETENTION_DAYS: 'kite-trash-retention-days',
  TYPEWRITER_MODE: 'caffeinemd-typewriter-mode',
  SHOW_MINIMAP: 'caffeinemd-show-minimap',
  SIDEBAR_WIDTH: 'kite_sidebar_width',
  GEMINI_API_KEY: 'caffeinemd-gemini-api-key',
  NETLIFY_TOKEN: 'caffeinemd-netlify-token',
  GITHUB_TOKEN: 'caffeinemd-github-token',
  GITHUB_DEFAULT_REPO: 'caffeinemd-default-github-repo',
  GDRIVE_ACCESS_TOKEN: 'kite_gdrive_access_token',
  GDRIVE_TOKEN_META: 'kite_gdrive_token_meta',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS] | (string & {});

export const storageRegistry = {
  getItem(key: StorageKey, fallback = ''): string {
    if (typeof window === 'undefined') return fallback;
    try {
      const val = window.localStorage.getItem(key);
      return val !== null ? val : fallback;
    } catch {
      return fallback;
    }
  },

  setItem(key: StorageKey, value: string): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, value);
    } catch (err) {
      console.warn(`[storageRegistry] Failed writing key "${key}":`, err);
    }
  },

  getJson<T>(key: StorageKey, fallback: T, schema?: z.ZodType<T>): T {
    if (typeof window === 'undefined') return fallback;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = JSON.parse(raw);
      if (schema) {
        const result = schema.safeParse(parsed);
        return result.success ? result.data : fallback;
      }
      return parsed as T;
    } catch {
      return fallback;
    }
  },

  setJson<T>(key: StorageKey, value: T): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (err) {
      console.warn(`[storageRegistry] Failed writing JSON for key "${key}":`, err);
    }
  },

  removeItem(key: StorageKey): void {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.removeItem(key);
    } catch (err) {
      console.warn(`[storageRegistry] Failed removing key "${key}":`, err);
    }
  },
};
