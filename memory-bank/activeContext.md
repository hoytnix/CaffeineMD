# Active Context: CaffeineMD

## Current Focus
- **Production-Grade Maintainer Documentation Suite (`/docs`)**:
  - Authored a comprehensive 8-document technical documentation suite covering architecture, state, storage, indexing, Tiptap extensions, WASM sandbox, themes, databases, 2D force graph, and maintainer playbooks.
  - Linked documentation suite in [docs/README.md](file:///home/oloty/Dev/CaffeineMD/docs/README.md).
- **External Link Preview on Tap/Click (iOS/Mobile & Desktop)**:
  - Eliminated native browser link navigation on iOS Safari and desktop within `contenteditable` by setting `target: null` in `@tiptap/extension-link`.
  - Registered `click` and `touchend` listeners in the capture phase (`{ capture: true }`) on the editor container in [IosLinkPreviewCard.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/components/IosLinkPreviewCard.tsx) to intercept taps before ProseMirror or native navigation.
  - Added drag/scroll guards on mobile `touchend` (<10px displacement) to distinguish taps from scrolls, calling `preventDefault()`, `stopPropagation()`, and `stopImmediatePropagation()`.
  - Pinned previews opened via click/tap against mouseout dismissal until clicking outside, pressing Escape, or hovering out of the card.
  - Retained desktop hover preview with 280ms delay.
  - Added `mousedown` and `touchstart` handling in ProseMirror's `handleDOMEvents` dispatching `caffeinemd:preview-link` to ensure links never navigate directly on tap or click.
  - Decomposed `ExternalCardContent` into [ExternalCardContent.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/components/ExternalCardContent.tsx) with explicit "Open" link button in a new tab (`target="_blank"`), keeping all files strictly <250 LOC.
- **Theme Background Image Layer & Opacity Slider Isolation**:
  - Ensured only the background image layer is affected by the opacity slider (cards, buttons, inputs, modals, and toolbars remain 100% solid and crisp).
  - Maintained solid `--bg-primary` and `--bg-secondary` colors across all states in `globals.css` and `colorUtils.ts`.
  - Configured global `body::before` in `globals.css` with `opacity: var(--theme-opacity, 0.15)` and mobile scroll attachment.
  - Retained fixed background image layer (`fixed inset-0 pointer-events-none z-0` with `opacity: themeOpacity`) in `SettingsView.tsx` and `page.tsx`.
  - Set `bg-transparent` on `<main>`, canvas wrappers in `SplitPaneContainer`, `TiptapEditor`, `DiffViewer`, `PlaintextMarkdownEditor`, `DatabaseView`, `GraphView`, and `TagCloudView`.
  - Styled secondary bars (Plaintext line gutter, Diff split headers, SplitPane headers, Tag Cloud sticky bar) with `bg-[var(--bg-secondary)]/80 backdrop-blur-sm`.
- **Strict LOC Enforcement**: All modified settings, database, graph, tags, and editor components kept strictly under tiered LOC limits.

## Architecture & Recent Changes
1. **Theme Background Image & Opacity Layer Isolation**:
   - [globals.css](file:///home/oloty/Dev/CaffeineMD/app/globals.css): Kept `--bg-primary` and `--bg-secondary` as solid colors (`var(--theme-bg-primary)` and `var(--theme-bg-sidebar)`), defined `body::before` pseudo-element with `opacity: var(--theme-opacity, 0.15)`, and eliminated glassmorphic slate background overrides so UI surfaces never turn transparent.
   - [colorUtils.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/themes/colorUtils.ts): Updated `applyThemeToDocument()` to keep `--bg-primary`, `--bg-secondary`, and legacy glass variables solid while driving `--theme-opacity` and `--bg-image-opacity`.
   - [page.tsx](file:///home/oloty/Dev/CaffeineMD/app/w/%5BworkspaceId%5D/page.tsx) & [SettingsView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/SettingsView.tsx): Retained root `bg-[var(--bg-primary)]` with dedicated `fixed inset-0 pointer-events-none z-0` background image layer governed directly by `style={{ opacity: themeOpacity }}`.
   - [SplitPaneContainer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/SplitPaneContainer.tsx), [TiptapEditor.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/TiptapEditor.tsx), [DiffViewer.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/modes/DiffViewer.tsx), and [PlaintextMarkdownEditor.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/modes/PlaintextMarkdownEditor.tsx): Set wrappers to `bg-transparent` and secondary chrome (gutters, headers) to `bg-[var(--bg-secondary)]/80 backdrop-blur-sm`.
   - [DatabaseView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/database/DatabaseView.tsx), [GraphView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/graph/GraphView.tsx), and [TagCloudView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/tags/TagCloudView.tsx): Set canvas wrappers to `bg-transparent` so theme background images stay visible across all workspace tabs on desktop and mobile.
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
