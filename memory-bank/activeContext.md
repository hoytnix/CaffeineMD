# Active Context: Kite Workspace

## Current Focus
Completed full architectural modularization across all 5 refactoring milestones, eliminating God Components and Tangled Modes while bringing core codebase files into the clean 100–250 LOC target standard.

## Key Changes
1. **Milestone 1: Markdown Serialization Layer Decoupled**:
   - Extracted YAML frontmatter, hashtag parsing, and title deduction into `src/lib/markdown/frontmatter.ts` (125 LOC).
   - Extracted DOM-walking HTML-to-Markdown serializer into `src/lib/markdown/htmlToMarkdown.ts` (181 LOC), preserving intentional consecutive `<p><br></p>` blank lines.
   - Extracted Markdown-to-HTML parser with blockquotes, task lists, and tables into `src/lib/markdown/markdownToHtml.ts` (293 LOC).
   - Preserved `src/lib/markdown/serializer.ts` (8 LOC) as a clean facade with 100% backward compatibility.
2. **Milestone 2: TiptapEditor God Component Disentangled**:
   - Extracted unified persistence and disk write-back into `src/hooks/useNotePersistence.ts` (158 LOC).
   - Extracted popover menus into `FloatingSlashMenu.tsx` (89 LOC) and `FloatingWikiLinkMenu.tsx` (70 LOC).
   - Extracted standalone raw editor into `PlaintextMarkdownEditor.tsx` (186 LOC) with line-numbered gutter sync.
   - Extracted `EditorHeader.tsx` (104 LOC) and `BinaryAssetPreview.tsx` (39 LOC).
   - Reduced `TiptapEditor.tsx` from 1,078 LOC to focused ProseMirror orchestration.
3. **Milestone 3: Knowledge Graph Visualization Decoupled**:
   - Extracted Dexie data aggregation into `src/hooks/useGraphData.ts` (125 LOC).
   - Extracted 2D canvas rendering and DPR scaling into `src/lib/graph/graphCanvasRenderer.ts` (94 LOC).
   - Extracted HUD controls into `src/components/graph/GraphControls.tsx` (106 LOC).
   - Reduced `GraphView.tsx` from 408 LOC down to 199 LOC.
4. **Milestone 4: FileTree & Database View Modularized**:
   - Extracted tree hierarchy sorting into `src/hooks/useTreeStructure.ts` (64 LOC) and memoized recursive item into `FileTreeItem.tsx` (113 LOC).
   - Extracted note creation into `NewNoteModal.tsx` (80 LOC), reducing `FileTree.tsx` to 189 LOC.
   - Extracted database schema extraction into `useDatabaseSchema.ts` (61 LOC), toolbar into `DatabaseToolbar.tsx` (155 LOC), and List view into `ListView.tsx` (61 LOC), reducing `DatabaseView.tsx` to 98 LOC.
5. **Milestone 5: Ingestion Pipeline & Mounting Modularized**:
   - Extracted WebKit directory recursion into `src/lib/storage/entryCrawler.ts` (127 LOC) and atomic IndexedDB transactions into `batchIndexer.ts` (29 LOC).
   - Extracted directory handle mounting into `src/hooks/useVaultMounting.ts` (142 LOC) and visual action cards into `DropzoneUploadCards.tsx` (88 LOC), reducing `VaultDropzone.tsx` to 108 LOC.
