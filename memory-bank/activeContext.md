# Active Context: Kite MD

## Current State
- **Rebranding**: Successfully rebranded from "Kite Workspace"/"Kite" to "Kite MD" across `app/layout.tsx`, `metadata.json`, `WorkspacePopover.tsx`, `RemoteWorkspacesList.tsx`, `seedData.ts`, and `workspaceStore.ts`.
- **Bottom Toolbar**: Reorderable pill `[Copy All] -> [Style ▾] -> [Headers ▾] -> [List ▾] -> [Media ▾] -> [Divider] -> [Tables] -> [History ▾]`. Submenus use portal popovers.
- **Document Metrics**: `NoteMetricsBar.tsx` (207 LOC) above `NOTE PROPERTIES` in `BacklinksPanel.tsx`. Real-time words, chars, LLM tokens, emojis (with ZWJ detection), links, and KB size via `useSyncExternalStore`.
- **Universal Emojis & Branding**: Embedded Google Fonts `Noto Color Emoji` with WOFF2 Unicode subsetting; Kite logo replaced with Kite emoji `🪁` in `WorkspacePopover.tsx` (247 LOC).
- **Refactoring Status**: All modules adhere strictly to the 100–250 LOC boundary.

## Next Steps
- Maintain clean, decomposed component architecture.
- Verify storage and cloud sync workflows as features evolve.
