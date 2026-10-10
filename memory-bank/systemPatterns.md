# System Patterns & Architecture

## Architecture Matrix
- **Storage Layer**:
  - `Dexie.js` IndexedDB schema (`KiteVaultDatabase` in `/src/lib/storage/db.ts`) storing `files`, `backlinks`, `tags`, and `settings`.
  - Native File System Access API adapter (`/src/lib/storage/fileSystem.ts`) managing handles for live local directories and disk writes.
  - Ingestion pipeline (`/src/lib/storage/importPipeline.ts`) with `webkitGetAsEntry()` recursive crawler.
- **Editor Architecture**:
  - Tiptap v2 + ProseMirror plugins.
  - `@tiptap/suggestion` extensions with **dedicated unique `PluginKey` instances**:
    - `SlashCommandPluginKey = new PluginKey('slashCommandSuggestion')`
    - `WikiLinkPluginKey = new PluginKey('wikiLinkSuggestion')`
    *(Prevents ProseMirror `RangeError: Adding different instances of a keyed plugin`)*
- **Markdown & Frontmatter Bridge**:
  - `/src/lib/markdown/serializer.ts` parses and dumps YAML headers (`js-yaml`) and extracts WikiLinks `[[Page|Alias]]`.
- **Reactive State Management**:
  - `zustand` (`/src/stores/workspaceStore.ts`) for tab management, active view switches, search modals, and import dialogs.
  - `dexie-react-hooks` (`useLiveQuery`) for reactive UI updates across the file tree and databases.
