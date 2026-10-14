# Maintainer Playbook & Troubleshooting Guide

This document provides step-by-step developer recipes for common maintenance tasks, along with strict architectural guardrails to prevent regressions.

---

## 1. Common Maintenance Workflows

### 1.1 Adding a New Settings Section
Settings views live in [`src/components/settings/`](file:///home/oloty/Dev/CaffeineMD/src/components/settings/):

1. **Create the Section Component**:
   Create a new file in `src/components/settings/sections/MyNewSection.tsx` (keep under 250 LOC).
2. **Register in `SettingsView.tsx`**:
   - Add the category ID to the active settings tab type in `SettingsView.tsx`.
   - Add the corresponding category switch case rendering `<MyNewSection />`.
3. **Register in `IosSettingsHome.tsx`**:
   - Add a navigation squircle item to the settings home grid with icon, badge, and description.

---

### 1.2 Adding a New Global Keyboard Shortcut
Shortcuts are centralized in [`src/lib/shortcuts/shortcutManager.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/shortcuts/shortcutManager.ts):

1. **Add to `ShortcutActionId`**:
   ```ts
   export type ShortcutActionId =
     | 'quickSwitcher'
     | 'quickSearch'
     | 'myNewAction'; // Add new ID
   ```
2. **Define Metadata & Default Key Combination**:
   ```ts
   export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
     // ...
     {
       id: 'myNewAction',
       label: 'My New Action',
       description: 'Toggles my new productivity feature',
       defaultCombo: 'Mod+Shift+K',
     },
   ];
   ```
3. **Bind Execution Handler**:
   In `useGlobalShortcuts.ts` or the relevant workspace component, bind the shortcut ID to the target action handler.

---

### 1.3 Adding a New Theme Preset
Themes are defined in [`src/lib/themes/presets/`](file:///home/oloty/Dev/CaffeineMD/src/lib/themes/presets/):

1. Open `baseThemes.ts` (or `seasonalThemes.ts`).
2. Add a new `ThemeDefinition` entry:
   ```ts
   export const myNewTheme: ThemeDefinition = {
     id: 'my-new-theme',
     name: 'My Custom Theme',
     category: 'base',
     colors: {
       background: '#0f172a',
       foreground: '#f8fafc',
       card: '#1e293b',
       border: '#334155',
       primary: '#38bdf8',
       accent: '#818cf8',
       isDark: true,
       fontFamily: 'Inter',
       bgOpacity: 0.90,
     },
   };
   ```
3. Export it in the theme array. It will automatically populate the theme selector grid in Settings and Theme Studio.

---

### 1.4 Adding a New Tiptap Slash Command
Slash commands are defined in [`src/components/editor/extensions/SlashCommand.ts`](file:///home/oloty/Dev/CaffeineMD/src/components/editor/extensions/SlashCommand.ts):

1. Add a new command item to `getSlashCommands()`:
   ```ts
   {
     title: 'Callout Box',
     description: 'Insert an emphasized callout quote',
     icon: MessageSquareQuote,
     command: ({ editor, range }) => {
       editor.chain().focus().deleteRange(range).setBlockquote().run();
     },
   }
   ```
2. The item will automatically appear in `FloatingSlashMenu.tsx` with keyboard navigation and fuzzy search.

---

### 1.5 Safely Migrating the Dexie IndexedDB Schema
CaffeineMD's schema lives in [`src/lib/storage/schema.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/schema.ts):

> [!CAUTION]
> Never modify past schema versions (`version(1)` or `version(2)`). Doing so corrupts existing users' databases upon upgrade.

To add a new table or index:
1. Increment the database version number in `KiteVaultDatabase`:
   ```ts
   // In KiteVaultDatabase constructor:
   this.version(3).stores({
     files: 'id, path, name, title, extension, isBinary, *tags, vaultId, updatedAt, newField',
     newTable: 'id, createdAt',
   }).upgrade(tx => {
     // Optional data migration logic:
     return tx.table('files').toCollection().modify(file => {
       file.newField = file.newField || 'default';
     });
   });
   ```

---

## 2. Known Pitfalls & Regression Prevention

Review these architectural guardrails to prevent regressions during PR reviews and feature development:

### 2.1 Mobile Link Taps & iOS Native Navigation
- **The Issue**: On iOS Safari and WebKit, tapping an `<a href="..." target="_blank">` inside `contenteditable` triggers native browser tab navigation before JavaScript click listeners can run.
- **The Rule**:
  - Never add `target="_blank"` to editor link marks in `editorExtensions.ts`. Set `target: null`.
  - Always register click and touchend listeners in the **capture phase** (`{ capture: true }`) in `IosLinkPreviewCard.tsx`.
  - Always verify that the touch did not scroll or drag (`dx <= 10 && dy <= 10`) before opening the preview.
  - The "Open" link button inside `ExternalCardContent.tsx` is rendered in a fixed portal outside ProseMirror and correctly retains `target="_blank"`.

---

### 2.2 Theme Background Opacity vs. Surface Solidity
- **The Issue**: Applying opacity or `color-mix(..., transparent)` directly to `--bg-primary` or `--bg-secondary` turns all UI cards, dropdown menus, and settings sections transparent, making text unreadable over wallpaper images.
- **The Rule**:
  - Keep `--bg-primary`, `--bg-secondary`, `--theme-bg-sidebar`, and `--card` strictly solid hex/RGB colors at all times in `globals.css` and `colorUtils.ts`.
  - Bind `workspaceStore.themeOpacity` strictly to the dedicated fixed background image layer (`z-0`) in `page.tsx` and `SettingsView.tsx`.
  - Set `bg-transparent` only on editor and page canvas wrappers to let the wallpaper show through behind text.

---

### 2.3 Autosave Baseline False-Dirtiness
- **The Issue**: When a note is opened, slight formatting or AST serialization differences can make the editor think the note was modified immediately upon opening, triggering unwanted auto-saves and continuous Google Drive sync cycles.
- **The Rule**:
  - In `useEditorAutosave.ts`, initialize `baselineContent` with the normalized markdown body on note load.
  - Only mark the file as dirty and dispatch saves if `currentMarkdown !== baselineContent`.

---

### 2.4 Strict 250-Line Limit Per File
- **The Issue**: Large "God files" create merge conflicts, make testing difficult, and break mental models.
- **The Rule**:
  - Every `.ts` and `.tsx` file must remain under 250 lines.
  - When a file nears 200 lines, proactively extract sub-components (e.g., `ExternalCardContent.tsx` extracted from `IosLinkPreviewCard.tsx`) or custom hooks (e.g., `useKeyboardOffset.ts`).

---

### 2.5 Verification Checklist Before Commits
Always execute the following two commands locally before committing or pushing changes:
```bash
# 1. Strict lint check (must pass with 0 errors and 0 warnings)
pnpm run lint

# 2. Standalone type check (must pass with 0 errors)
pnpm exec tsc --noEmit
```
