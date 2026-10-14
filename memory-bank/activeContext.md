# Active Context: CaffeineMD

## Current Focus
- **External Link Preview on Tap/Click**: Configured `@tiptap/extension-link` with `openOnClick: false`, intercepted external link clicks/taps via `handleExternalLinkDomClick()`, and wired `IosLinkPreviewCard` to anchor to the tapped link, dismiss on outside clicks or Escape, and provided an explicit "Open" button navigating in a new tab (`target="_blank"`).
- **Theme Background Visibility & Opacity Slider**: Exposed `themeOpacity` (0.1–1.0) and `setThemeOpacity` in `workspaceStore.ts`, persisted under `caffeinemd-theme-opacity`, added Background / Theme Opacity slider in `ThemeSettingsSection`, revealed theme ambient backdrops in `WorkspacePage`, `SettingsView`, `SplitPaneContainer`, `TiptapEditor`, `DiffViewer`, and `PlaintextMarkdownEditor`, and ensured safe mobile rendering with `background-attachment: scroll`.
- **Strict LOC Enforcement**: All modified settings and editor components kept strictly under LOC limits.

## Architecture & Recent Changes
1. **Link Preview & Click/Tap Interception**:
   - [editorExtensions.ts](file:///home/oloty/Dev/CaffeineMD/src/components/editor/config/editorExtensions.ts): Configured `@tiptap/extension-link` with `openOnClick: false` and `defaultProtocol: 'https'`.
   - [editorDomHandlers.ts](file:///home/oloty/Dev/CaffeineMD/src/components/editor/config/editorDomHandlers.ts) & [useTiptapInit.ts](file:///home/oloty/Dev/CaffeineMD/src/components/editor/hooks/useTiptapInit.ts): Implemented `handleExternalLinkDomClick()` to prevent default browser navigation and open the card.
   - [IosLinkPreviewCard.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/components/IosLinkPreviewCard.tsx): Added click/tap interception on `.ProseMirror` external links, outside pointerdown dismissal, Escape key closing, and prominent "Open" button in a new tab.
2. **Theme Opacity & Background Visibility**:
   - [workspaceStore.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/workspaceStore.ts): Added `themeOpacity` state (defaulting to 0.85) and `setThemeOpacity()` persisted to `caffeinemd-theme-opacity`, hydrating CSS properties `--theme-opacity` and `--bg-image-opacity`.
   - [colorUtils.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/themes/colorUtils.ts): Updated `applyThemeToDocument()` to set `--theme-opacity`, `--bg-image-opacity`, and dynamic translucent glass variables.
   - [ThemeSettingsSection.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/ThemeSettingsSection.tsx): Added Background / Theme Opacity slider (`10%` to `100%`, step `5%`) with percentage badge.
   - [page.tsx](file:///home/oloty/Dev/CaffeineMD/app/w/%5BworkspaceId%5D/page.tsx) & [SettingsView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/SettingsView.tsx): Rendered ambient theme background image layers with opacity controlled by `themeOpacity`.
   - [SplitPaneContainer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/SplitPaneContainer.tsx), [TiptapEditor.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/TiptapEditor.tsx), [DiffViewer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/modes/DiffViewer.tsx), and [PlaintextMarkdownEditor.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/modes/PlaintextMarkdownEditor.tsx): Swapped solid backgrounds for translucent glass variables.
   - [globals.css](file:///home/oloty/Dev/CaffeineMD/app/globals.css): Enforced `background-attachment: scroll !important` on mobile viewports for smooth iOS Safari rendering.
   - [workspaceStore.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/workspaceStore.ts): Added `codeExecutionSandboxEnabled` state, `setCodeExecutionSandboxEnabled()`, and `toggleCodeExecutionSandbox()`, defaulting to `false` and persisted via `caffeinemd-code-execution-sandbox`.
   - [runtimeCache.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/runtimeCache.ts): Created Cache API manager providing `fetchWithRuntimeCache()`, `preloadSandboxRuntimes()`, `isRuntimeCached()`, and `clearSandboxRuntimeCache()`.
   - [CodeExecutionSandboxSection.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/CodeExecutionSandboxSection.tsx): Implemented dedicated setting card with toggle, one-time runtime download progress indicator, and manual cache management.
   - [EditorSettingsSection.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/sections/EditorSettingsSection.tsx): Positioned `CodeExecutionSandboxSection` immediately after `EditorDisplayBehaviorGroup`.
   - [wasmSandbox.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/wasmSandbox.ts) & [CodeBlockOutputDrawer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/extensions/CodeBlockOutputDrawer.tsx): Fixed persistent "compiler is downloading" messages by cleaning transient status messages on completion and hiding stale downloading statuses when subsequent results are rendered.
   - [jsTsRunner.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/runners/jsTsRunner.ts), [sqlRunner.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/runners/sqlRunner.ts), [luaRunner.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/runners/luaRunner.ts): Routed runtime script and WASM binary fetches through `fetchWithRuntimeCache()`.
   - [CodeBlockView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/extensions/CodeBlockView.tsx), [EditorContextMenu.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/EditorContextMenu.tsx), [PlaintextContextMenu.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/modes/PlaintextContextMenu.tsx): Conditioned sandbox execution actions and Run buttons on `codeExecutionSandboxEnabled`.
1. **Comprehensive CRUD Auto-Sync**:
   - [syncAutoTrigger.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/syncAutoTrigger.ts): Created dynamic asynchronous trigger helper to dispatch `triggerAutoSync()` safely from lower-level storage repositories without circular imports.
   - [useNotePersistence.ts](file:///home/oloty/Dev/CaffeineMD/src/hooks/useNotePersistence.ts): Dispatches silent `triggerAutoSync()` on editor saves as well as initial frontmatter migration.
   - [useFileTreeActions.ts](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/useFileTreeActions.ts): Wired immediate background `triggerAutoSync()` across duplicate note, rename (file & folder), move (file & folder), and trash/delete (file & folder).
   - [noteRepository.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/repositories/noteRepository.ts): Wired `triggerBackgroundAutoSync()` on `createNote()`, `updateNote()`, and `moveToTrash()`.
   - [fileOperations.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/repositories/fileOperations.ts): Wired `triggerBackgroundAutoSync()` on `renameVaultFile()`, `duplicateVaultFile()`, `moveVaultFile()`, `renameFolder()`, and `moveFolder()`.
   - [NewNoteModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/sidebar/NewNoteModal.tsx) & [DatabaseView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/database/DatabaseView.tsx): Wired `triggerAutoSync()` upon note creation.
   - [workspaceStore.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/workspaceStore.ts): Wired `triggerBackgroundAutoSync()` on `moveToTrash()` and `deleteNote()`.

2. **Google Drive Token Lifetime & Persistence**:
   - [client.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/firebase/client.ts): Added `access_type: 'offline'` and `prompt: 'consent'` to GoogleAuthProvider parameters. Enhanced `setAccessToken` and `getAccessToken` to persist and rehydrate tokens and expiration metadata via `localStorage` alongside `sessionStorage`.
   - [driveAuthService.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/google/driveAuthService.ts): Linked `setTokenExpiry` to update persistent access token metadata.

2. **Automatic Vault Sync on Note Save**:
   - [googleDriveSync.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/sync/googleDriveSync.ts): Added debounced `GoogleDriveSyncService.triggerAutoSync()` method with active token checking and concurrency guard.
   - [useNotePersistence.ts](file:///home/oloty/Dev/CaffeineMD/src/hooks/useNotePersistence.ts): Dispatches silent `triggerAutoSync()` whenever a note is persisted to IndexedDB and local filesystem.

3. **Settings Footer Deduplication**:
   - [IosSettingsHome.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/IosSettingsHome.tsx): Removed the duplicate branding footer block, leaving the unified footer link in [SettingsView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/SettingsView.tsx).

4. **Database Spoilable Filters & Streamlined Toolbar**:
   - [IosSettingsHome.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/IosSettingsHome.tsx): Dynamic profile card resolving `googleDriveUser?.displayName` (with fallback to "User" instead of hardcoded author name), real email, and dynamic initials avatar.
   - [SettingsView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/SettingsView.tsx): External link footer to `https://tehwiz.com` ("A TehWiz Production.").

3. **Mobile File Tab Closing**:
   - [DocumentTabBar.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/DocumentTabBar.tsx): File tab close (`X`) buttons are always visible on mobile/touch viewports (`opacity-100 md:opacity-0 md:group-hover:opacity-100`).

4. **Root Seed Note Normalization**:
   - [seedData.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/seedData.ts): Set explicit `folder: ''` and `path: '/Welcome to CaffeineMD ☕.md'` to seed directly at vault root.

5. **Integrated Platform Capabilities**:
   - **Multi-Language WASM Sandbox**: Warm worker singleton executing Python (Pyodide), TS/JS, SQLite (`sql.js`), Lua (Fengari), POSIX Shell, JSON/HTML preview, Godbolt compiler (Rust/Go/C/C++).
   - **Exporter & Deployer**: Production PWA / Standalone HTML export, 1-click Netlify & GitHub Pages deployments, sandboxed live preview drawer, AI app synthesis.
   - **Editor UX Suite**: Outline TOC HUD, Minimap, Table GUI, Smart Paste engine, Multi-pane split view, Focus mode, Typewriter scrolling, `⌘P` Quick-Switcher.
   - **Storage & Cloud Sync**: Dexie IndexedDB with Google Drive anti-resurrection deletion reconciliation and 5MB chunking.

## Next Steps
- Maintain strict <200 LOC per file across all modules.
- Verification: Run `pnpm run lint` on every prompt cycle.
