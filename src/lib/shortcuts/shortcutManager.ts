export type ShortcutActionId =
  | 'quickSwitcher'
  | 'quickSearch'
  | 'findReplace'
  | 'splitPane'
  | 'emojiDrawer'
  | 'newNote'
  | 'toggleSidebar'
  | 'openSettings';

export interface ShortcutDefinition {
  id: ShortcutActionId;
  label: string;
  description: string;
  defaultCombo: string;
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  { id: 'quickSwitcher', label: 'Quick Switcher', description: 'Jump to any document by title, tag, or path', defaultCombo: 'Mod+P' },
  { id: 'quickSearch', label: 'Vault Search', description: 'Full-text fuzzy search across all vault notes (also supports Mod+O)', defaultCombo: 'Mod+K' },
  { id: 'findReplace', label: 'Find & Replace', description: 'Vault-wide RegEx batch search and replace', defaultCombo: 'Mod+Shift+H' },
  { id: 'splitPane', label: 'Toggle Split Pane', description: 'Split the editor horizontally or vertically', defaultCombo: 'Mod+\\' },
  { id: 'emojiDrawer', label: 'Emoji Drawer', description: 'Universal emoji picker for note insertion', defaultCombo: 'Shift+Space' },
  { id: 'newNote', label: 'Create New Note', description: 'Quickly create a new untitled markdown note', defaultCombo: 'Mod+Alt+N' },
  { id: 'toggleSidebar', label: 'Toggle Sidebar', description: 'Collapse or expand the left file tree navigation', defaultCombo: 'Mod+B' },
  { id: 'openSettings', label: 'Open Settings', description: 'Open workspace settings and configuration view', defaultCombo: 'Mod+,' },
];

export const DEFAULT_SHORTCUTS: Record<ShortcutActionId, string> = {
  quickSwitcher: 'Mod+P',
  quickSearch: 'Mod+K',
  findReplace: 'Mod+Shift+H',
  splitPane: 'Mod+\\',
  emojiDrawer: 'Shift+Space',
  newNote: 'Mod+Alt+N',
  toggleSidebar: 'Mod+B',
  openSettings: 'Mod+,',
};

const MODIFIER_KEYS = new Set(['Meta', 'Control', 'Shift', 'Alt', 'CapsLock']);

/** Normalizes KeyboardEvent to combo string ('Mod+Shift+H'). Returns null if only modifiers pressed. */
export function eventToComboString(e: KeyboardEvent): string | null {
  if (MODIFIER_KEYS.has(e.key)) return null;

  const parts: string[] = [];
  if (e.metaKey || e.ctrlKey) parts.push('Mod');
  if (e.altKey) parts.push('Alt');
  if (e.shiftKey) parts.push('Shift');

  let key: string;
  if (e.code === 'Space') key = 'Space';
  else if (e.key === '\\') key = '\\';
  else if (e.key === ',') key = ',';
  else if (e.key.length === 1) key = e.key.toUpperCase();
  else key = e.key;

  parts.push(key);
  return parts.join('+');
}

/** Checks whether a KeyboardEvent matches a stored combo string across Mac and non-Mac. */
export function matchesShortcut(e: KeyboardEvent, combo: string): boolean {
  if (!combo) return false;

  const wantsMod = combo.includes('Mod');
  const wantsAlt = combo.includes('Alt');
  const wantsShift = combo.includes('Shift');

  if (wantsMod !== (e.metaKey || e.ctrlKey)) return false;
  if (wantsAlt !== e.altKey) return false;
  if (wantsShift !== e.shiftKey) return false;

  const baseKey = combo.replace(/^(Mod\+)?(Alt\+)?(Shift\+)?/, '');
  if (baseKey === 'Space') return e.code === 'Space' || e.key === ' ';
  if (baseKey === '\\') return e.key === '\\' || e.code === 'Backslash';
  if (baseKey === ',') return e.key === ',' || e.code === 'Comma';

  return (
    e.key.toLowerCase() === baseKey.toLowerCase() ||
    e.code.toLowerCase() === `key${baseKey.toLowerCase()}` ||
    e.code === baseKey
  );
}

/** Formats combo for display badges ('⌘⇧H' on Mac, 'Ctrl+Shift+H' on Windows/Linux). */
export function formatShortcutForDisplay(combo: string): string {
  if (!combo) return '';
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/i.test(navigator.userAgent || '');
  if (isMac) {
    return combo.replace(/Mod/g, '⌘').replace(/Shift/g, '⇧').replace(/Alt/g, '⌥').replace(/\+/g, '');
  }
  return combo.replace(/Mod/g, 'Ctrl');
}
