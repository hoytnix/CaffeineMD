# Active Context: CaffeineMD

## Current Focus
- **iOS Settings Experience**: Native iOS Settings navigation architecture, sticky quick-tab switcher, Account Card ("Michael Hoyt"), 5 squircle category rows, and Themes tab ordering.
- **Editor Settings Streamline**: Removed redundant editor font dropdown (inherited from Themes); maintained Base Font Size slider, Minimap toggle, Typewriter mode toggle, and Spellcheck toggle.
- **Strict LOC Enforcement**: All settings and editor subcomponents decomposed under the strict 200 LOC limit.

## Architecture & Recent Changes
1. **iOS Settings Layout & Navigation**:
   - `SettingsScreen = 'home' | 'profile' | 'apiKeys' | 'themes' | 'editor' | 'keyboard' | 'storage'`.
   - [SettingsHeader.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/SettingsHeader.tsx): Icon-only `<ChevronLeft />` on home returning to workspace; `<button><ChevronLeft /> Settings</button>` with active title on sub-screens.
   - [IosSettingsHome.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/IosSettingsHome.tsx): Large iOS header, Account Card ("Michael Hoyt" with Google Drive photo/gradient fallback, status badge, Cloud Sync link), and grouped table with 5 rows:
     - **API Keys** (`bg-orange-500`, Key icon, summary: `Configured` / `Gemini & Cloud`)
     - **Themes** (`bg-blue-500`, Palette icon, summary: active theme name)
     - **Editor** (`bg-sky-500`, Sliders icon, summary: `${editorFontSize}px`)
     - **Keyboard** (`bg-emerald-500`, Keyboard icon, summary: "Shortcuts")
     - **Storage** (`bg-green-500`, Database icon, summary: "IndexedDB & Trash")
   - Sticky horizontal pill tab strip for 1-tap jumping between sub-screens.

2. **Themes Tab Ordering & Modularization**:
   - Ordered strictly in [ThemeSettingsSection.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/ThemeSettingsSection.tsx):
     1. **AI Theme Studio** ([AiThemeStudioCard.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/AiThemeStudioCard.tsx), visible when Gemini BYOK key is set)
     2. **Custom Theme Palette & Backdrop Wizard** ([CustomThemeWizard.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/CustomThemeWizard.tsx), visible when `theme === 'custom'` or toggled)
     3. **Theme Presets & Customization** ([ThemePresetGrid.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/ThemePresetGrid.tsx), 14 presets + pinned Custom card)

3. **Editor Settings & State Persistence**:
   - Typography managed in Theme settings; removed redundant font dropdown from [EditorSettingsSection.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/EditorSettingsSection.tsx).
   - Base Font Size (12–24px) slider & Spellcheck toggle wired to [workspaceStore.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/workspaceStore.ts) with `localStorage` backing.
   - Subcomponents: [EditorDisplayBehaviorGroup.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/EditorDisplayBehaviorGroup.tsx) and [ToolboxPlacementCards.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/ToolboxPlacementCards.tsx).

4. **Integrated Platform Capabilities**:
   - **Multi-Language WASM Sandbox**: Warm worker singleton executing Python (Pyodide), TS/JS, SQLite (`sql.js`), Lua (Fengari), POSIX Shell, JSON/HTML preview, Godbolt compiler (Rust/Go/C/C++).
   - **Exporter & Deployer**: Production PWA / Standalone HTML export, 1-click Netlify & GitHub Pages deployments, sandboxed live preview drawer, AI app synthesis.
   - **Editor UX Suite**: Outline TOC HUD, Minimap, Table GUI, Smart Paste engine, Multi-pane split view, Focus mode, Typewriter scrolling, `⌘P` Quick-Switcher.
   - **Storage & Cloud Sync**: Dexie IndexedDB with Google Drive anti-resurrection deletion reconciliation and 5MB chunking.

## Next Steps
- Maintain strict <200 LOC per file across all modules.
- Verification: Run `pnpm run lint` on every prompt cycle.
