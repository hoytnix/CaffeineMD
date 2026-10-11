# System Patterns & Architecture

## Core Patterns
- **Storage**: Dexie.js IndexedDB (`files`, `backlinks`, `tags`, `workspaces`, `settings`) in `/src/lib/storage/`. File System Access API in `/src/lib/storage/fileSystem.ts`.
- **Editor**: Tiptap v2 + ProseMirror with distinct keyed plugins (`SlashCommandPluginKey`, `WikiLinkPluginKey` to prevent `RangeError`). Lossless YAML header parser via `js-yaml` in `/src/lib/markdown/`.
- **State**: `zustand` (`workspaceStore.ts`) for navigation & modals; `dexie-react-hooks` (`useLiveQuery`) for reactive UI.
- **LOC Constraint**: Strict 100–250 LOC per module; god components decomposed into focused hooks, subcomponents, and barrel contracts.
- **Portal Popovers**: Editor toolbar menus (Style, Headings, Lists, Media, History) rendered via `createPortal` to `document.body` with fixed coordinates to prevent overflow clipping.
