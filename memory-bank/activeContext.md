# Active Context: CaffeineMD

## Current Focus
- **Google Drive Durable Persistence & Auto-Sync**: Configured `access_type: 'offline'` and `prompt: 'consent'` with localStorage token metadata fallback so sessions persist across browser restarts; wired silent background auto-sync (`triggerAutoSync()`) on note saves.
- **Settings Footer Deduplication**: Removed redundant footer from `IosSettingsHome` so `"A TehWiz Production."` appears cleanly once at the bottom of `SettingsView`.
- **Database Space-Saving & Spoilers**: Collapsible filter spoiler hidden by default (`filtersOpen`), sleek filter toggle button with active badge count, and removed redundant "Vault Database" top header to maximize vertical screen real estate on mobile/compact viewports.
- **Strict LOC Enforcement**: All settings and editor subcomponents decomposed under strict LOC limits.

## Architecture & Recent Changes
1. **Google Drive Token Lifetime & Persistence**:
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
