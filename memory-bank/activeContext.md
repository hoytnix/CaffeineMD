# Active Context: CaffeineMD

## Current Focus
- **Code Execution Sandbox Settings & Runtime Caching**: Added `codeExecutionSandboxEnabled` boolean setting defaulting to `false` for instant initial app startup without long runtime downloading. Placed the Code Execution Sandbox setting card immediately following Editor Display & Behavior in the Settings tab.
- **WASM Runner Status Fix**: Dismissed transient "compiler is downloading" status messages once execution finishes, and filtered out downloading/loading statuses in the output drawer when subsequent outputs exist.
- **One-Time Compiler & WASM Caching**: Integrated the browser Cache API in `runtimeCache.ts` and runner modules (`jsTsRunner`, `sqlRunner`, `luaRunner`) so that when the sandbox setting is enabled, binaries and WASM runtimes are downloaded and cached once instead of on every code execution.
- **Comprehensive CRUD Auto-Sync**: Expanded automatic background Google Drive sync (`triggerAutoSync()`) across note & folder creation, movement, duplication, renaming, and trashing.
- **Strict LOC Enforcement**: All new and modified settings and editor subcomponents decomposed under strict LOC limits.

## Architecture & Recent Changes
1. **Code Execution Sandbox & Runtime Caching**:
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
