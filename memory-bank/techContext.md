# Tech Context: Kite Workspace

## Tech Stack
- **Framework**: Next.js 15+ (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, `tw-animate-css`
- **Rich-Text Engine**: `@tiptap/react`, `@tiptap/core`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/suggestion`, `@tiptap/extension-task-list`, `@tiptap/extension-task-item`, `@tiptap/extension-table*`, `@tiptap/extension-image`
- **Database**: `dexie`, `dexie-react-hooks`
- **Graph Physics**: `d3-force`
- **Serialization**: `js-yaml`
- **Icons**: `lucide-react`
- **State**: `zustand`

## Runtime Constraints
- Local-first architecture; all storage is client-side in IndexedDB and direct disk filesystem handles.
- Keyed plugins in ProseMirror must always define explicit distinct `PluginKey` instances when multiple suggestion plugins are mounted simultaneously.
