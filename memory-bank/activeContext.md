# Active Context: CaffeineMD

## Current Focus
- **iOS Settings Experience**: Native iOS Settings navigation architecture, sticky quick-tab switcher, Dynamic SSO Account Card with fallback, 5 squircle category rows, and Themes tab ordering.
- **Branding & Mobile UX**: TehWiz production branding in settings footer, responsive tab close buttons for mobile/touch screens.
- **Seed Note Placement**: Explicit root-level assignment (`folder: ''`, `path: '/Welcome to CaffeineMD ☕.md'`).
- **Strict LOC Enforcement**: All settings and editor subcomponents decomposed under the strict 200/250 LOC limits.

## Architecture & Recent Changes
1. **Dynamic SSO Account Card & Footer Branding**:
   - [IosSettingsHome.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/IosSettingsHome.tsx): Dynamic profile card resolving `googleDriveUser?.displayName` (with fallback to "Michael Hoyt"), real email, dynamic initials avatar (`MH`), and TehWiz branding footer link (`https://tehwiz.com`).
   - [SettingsView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/SettingsView.tsx): Added external link footer to `https://tehwiz.com` ("A TehWiz Production.").

2. **Mobile File Tab Closing**:
   - [DocumentTabBar.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/DocumentTabBar.tsx): Updated close tab (`X`) button to be always visible on mobile/touch viewports (`opacity-100 md:opacity-0 md:group-hover:opacity-100`).

3. **Root Seed Note Normalization**:
   - [seedData.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/storage/seedData.ts): Set explicit `folder: ''` and `path: '/Welcome to CaffeineMD ☕.md'` to prevent empty directory grouping in the file tree.

4. **Integrated Platform Capabilities**:
   - **Multi-Language WASM Sandbox**: Warm worker singleton executing Python (Pyodide), TS/JS, SQLite (`sql.js`), Lua (Fengari), POSIX Shell, JSON/HTML preview, Godbolt compiler (Rust/Go/C/C++).
   - **Exporter & Deployer**: Production PWA / Standalone HTML export, 1-click Netlify & GitHub Pages deployments, sandboxed live preview drawer, AI app synthesis.
   - **Editor UX Suite**: Outline TOC HUD, Minimap, Table GUI, Smart Paste engine, Multi-pane split view, Focus mode, Typewriter scrolling, `⌘P` Quick-Switcher.
   - **Storage & Cloud Sync**: Dexie IndexedDB with Google Drive anti-resurrection deletion reconciliation and 5MB chunking.

## Next Steps
- Maintain strict <200 LOC per file across all modules.
- Verification: Run `pnpm run lint` on every prompt cycle.
