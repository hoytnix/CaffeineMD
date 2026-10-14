# Active Context: CaffeineMD

## Current Focus
- **Database Space-Saving & Spoilers**: Collapsible filter spoiler hidden by default (`filtersOpen`), sleek filter toggle button with active badge count, and removed redundant "Vault Database" top header to maximize vertical screen real estate on mobile/compact viewports.
- **iOS Settings Experience**: Native iOS Settings navigation architecture, sticky quick-tab switcher, Dynamic SSO Account Card with clean `'User'` fallback, 5 squircle category rows, and Themes tab ordering.
- **Branding & Mobile UX**: TehWiz production branding in settings footer, responsive tab close buttons for mobile/touch screens.
- **Seed Note Placement**: Explicit root-level assignment (`folder: ''`, `path: '/Welcome to CaffeineMD ☕.md'`).
- **Strict LOC Enforcement**: All settings and editor subcomponents decomposed under the strict 200/250 LOC limits.

## Architecture & Recent Changes
1. **Database Spoilable Filters & Streamlined Toolbar**:
   - [DatabaseToolbar.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/database/DatabaseToolbar.tsx): Removed the redundant top header block spanning from "Vault Database" to the New Row button. Introduced collapsible `filtersOpen` toggle state, hiding search/filter/sort by default.
   - Added compact toggle button displaying active filter count badge and chevron indicator, plus a 1-tap "Reset" button when filters are active.
   - [DatabaseView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/database/DatabaseView.tsx): Adjusted outer layout padding to responsive `p-4 sm:p-6 md:p-8` for compact mobile screens like iPhone SE.

2. **Dynamic SSO Account Card & Footer Branding**:
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
