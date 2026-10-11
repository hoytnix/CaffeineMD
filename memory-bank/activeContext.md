# Active Context: Kite Workspace

## Current Focus
Implemented Gmail-style URL routing and hash permalinking with bi-directional state synchronization, dynamic Next.js App Router paths (`/w/[workspaceId]`), root redirection, and seamless deep linking.

## Key Changes
1. **Bi-Directional Hash Routing Hook (`/src/hooks/useWorkspaceRouter.ts`)**:
   - Listens to `window.location.hash`, `popstate`, and `hashchange` events to hydrate workspace ID, active view tab (`editor`, `graph`, `table`, `kanban`, `board`, `list`, `tags`, `settings`), and note path.
   - Silently synchronizes local Zustand store changes back to browser address bar without full page reloads using `window.history.replaceState`.
   - Encodes and decodes note paths (e.g. `#/editor/Daily%20Notes%2F2026-10-10.md`).

2. **Root Dynamic Route & Redirection Architecture (`/app/page.tsx` & `/app/w/[workspaceId]/page.tsx`)**:
   - Root `/` page redirects to `/w/[workspaceId]#[view]` using active or default workspace and preserves existing hash fragments.
   - Dynamic `/app/w/[workspaceId]/page.tsx` mounts the primary workspace shell and invokes `useWorkspaceRouter()` at top level.

3. **Store Synchronization & Settings Embed (`/src/stores/workspaceStore.ts`, `/src/components/settings/SettingsView.tsx`)**:
   - Extended `WorkspaceState` with `activeTab`, `activeNotePath`, `setActiveTab`, and `setActiveNotePath`.
   - Preserved open tabs and file paths when confirming already active workspace ID.
   - Integrated `SettingsView` directly into workspace views when navigating to `#/settings`.
