# Active Context: Kite Workspace

## Current Focus
Resolved line-height crunching and lossless preservation of multiple consecutive newlines and line breaks across Rich Text and Plaintext modes.

## Key Changes
1. **Line Height & Typography Spacing**:
   - Upgraded `.ProseMirror` styling in `/app/globals.css` with generous line-height (`1.8`), distinct paragraph margins (`margin-top: 0.6rem; margin-bottom: 0.85rem`), and dedicated heading spacing.
   - Configured empty paragraph nodes (`.ProseMirror p:empty`, `.ProseMirror p.is-empty`, `.ProseMirror p:has(> br:only-child)`) with `min-height: 1.8rem;` so intentional blank lines never collapse to 0 height.
   - Enhanced Plaintext mode line numbers gutter and raw markdown textarea from `leading-6` to `leading-7` with matching `h-7` line heights for synchronized, comfortable spacing.
2. **Lossless Multi-Newline Preservation**:
   - Fixed `markdownToEditorHtml()` in `/src/lib/markdown/serializer.ts` to count consecutive blank lines. Beyond the single-blank block separator, each additional blank line creates an explicit `<p><br></p>` block in the rich text editor.
   - Supported intra-paragraph line breaks (`<br>`) for soft line breaks within paragraphs.
   - Updated `editorHtmlToMarkdown()` in `/src/lib/markdown/serializer.ts` to map empty paragraphs `<p><br></p>` to newline markers (`\n`) and removed aggressive newline collapsing (`replace(/\n{3,}/g, '\n\n')`).
   - Added Markdown table parsing to HTML table elements in `markdownToEditorHtml()`.

