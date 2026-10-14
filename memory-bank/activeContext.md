# Active Context: CaffeineMD

## Current Focus
- **Strategic Modular Refactoring (100–250 LOC Architecture Target)**:
  - Executed full decomposition across the Top 7 largest and most complex files in the codebase, bringing 100% of target files comfortably into the 100–250 LOC sweet spot.
  - Decomposed files and extracted components:
    1. **Emoji Dataset**: [emojiData.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/emoji/emojiData.ts) (184 LOC) with [emojiObjectsSymbols.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/emoji/emojiObjectsSymbols.ts) (75 LOC).
    2. **Zustand Root Store**: [workspaceStore.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/workspaceStore.ts) (197 LOC) sliced into [tabsSlice.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/slices/tabsSlice.ts) (174 LOC), [themeStorageSlice.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/slices/themeStorageSlice.ts) (229 LOC), [themeStorageUtils.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/slices/themeStorageUtils.ts) (85 LOC), [trashSlice.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/slices/trashSlice.ts) (191 LOC), and [uiOverlaySlice.ts](file:///home/oloty/Dev/CaffeineMD/src/stores/slices/uiOverlaySlice.ts) (131 LOC).
    3. **Tiptap Tri-Mode Editor**: [TiptapEditor.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/TiptapEditor.tsx) (249 LOC) decomposed with [EditorBody.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/components/EditorBody.tsx) (153 LOC) and [EditorOverlays.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/components/EditorOverlays.tsx) (56 LOC).
    4. **Settings Orchestrator**: [SettingsView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/settings/SettingsView.tsx) (125 LOC) decomposed with [useSettingsState.ts](file:///home/oloty/Dev/CaffeineMD/src/components/settings/useSettingsState.ts) (93 LOC).
    5. **Workspace Modal**: [CreateWorkspaceModal.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/workspace/CreateWorkspaceModal.tsx) (143 LOC) decomposed with [useCreateWorkspace.ts](file:///home/oloty/Dev/CaffeineMD/src/components/workspace/useCreateWorkspace.ts) (137 LOC) and [WorkspaceStorageSelector.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/workspace/WorkspaceStorageSelector.tsx) (143 LOC).
    6. **Tag Cloud & Note Registry**: [TagCloudView.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/tags/TagCloudView.tsx) (134 LOC) decomposed with [TagCloudHeader.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/tags/TagCloudHeader.tsx) (114 LOC), [TagNoteCard.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/tags/TagNoteCard.tsx) (110 LOC), and [excerpt.ts](file:///home/oloty/Dev/CaffeineMD/src/lib/markdown/excerpt.ts) (44 LOC).
    7. **Styling & Prose Sheets**: [globals.css](file:///home/oloty/Dev/CaffeineMD/app/globals.css) (150 LOC) decomposed into [prosemirror.css](file:///home/oloty/Dev/CaffeineMD/app/prosemirror.css) (191 LOC), [editor-lists.css](file:///home/oloty/Dev/CaffeineMD/app/editor-lists.css) (140 LOC), and [syntax.css](file:///home/oloty/Dev/CaffeineMD/app/syntax.css) (133 LOC).
- **Production-Grade Maintainer Documentation Suite (`/docs`)**:
  - Authored a comprehensive 8-document technical documentation suite covering architecture, state, storage, indexing, Tiptap extensions, WASM sandbox, themes, databases, 2D force graph, and maintainer playbooks.
- **External Link Preview on Tap/Click (iOS/Mobile & Desktop)**:
  - Eliminated native browser link navigation on iOS Safari and desktop within `contenteditable` by setting `target: null` in `@tiptap/extension-link`.
  - Registered `click` and `touchend` listeners in the capture phase (`{ capture: true }`) on the editor container in [IosLinkPreviewCard.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/editor/components/IosLinkPreviewCard.tsx).
- **Theme Background Image Layer & Opacity Slider Isolation**:
  - Ensured only the background image layer is affected by the opacity slider (cards, buttons, inputs, modals, and toolbars remain 100% solid and crisp).

## Architecture & Recent Changes
1. **Modular Zustand Store Slicing**:
   - Decomposed monolithic store in `workspaceStore.ts` into individual domain slices in `src/stores/slices/` without breaking any public interfaces or re-exported types (`TabItem`, `ToolboxPosition`, `EditorFontFamily`, `DEFAULT_AUTOSAVE_INTERVAL`).
2. **Editor Workspace & Overlays Separation**:
   - `TiptapEditor.tsx` acts as a clean top-level coordinator delegating the document scroll area and toolbars to `EditorBody.tsx` and all floating modals/menus to `EditorOverlays.tsx`.
3. **Settings State & Sub-components**:
   - `SettingsView.tsx` coordinates screens via `useSettingsState.ts`, which encapsulates auth listeners, Gemini key events, and theme preset resolution.
4. **CSS Architecture**:
   - Separated global CSS into modular stylesheets (`globals.css`, `prosemirror.css`, `editor-lists.css`, `syntax.css`) preserving exact typography, table styles, task list alignment, and HLJS token highlighting.

## Next Steps
- Maintain strict <250 LOC per file across all modules.
- Verification: Run `pnpm run lint` on every prompt cycle.
