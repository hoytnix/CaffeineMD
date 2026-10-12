# Progress: CaffeineMD

## Milestones
- [x] **Storage & Mounting**: Dexie IndexedDB, Native File System Access (`showDirectoryPicker`), WebKit recursive drop.
- [x] **Serialization**: Lossless YAML frontmatter parsing, bi-directional WikiLinks, HTML-Markdown image roundtrips.
- [x] **Editor Core**: Tiptap v2, ProseMirror plugins, slash commands (`/`), task lists, tables, universal emoji drawer (`Shift+Space`).
- [x] **Toolbar & Layout**: Decomposed floating pill popovers, decouple header notch, note metrics bar (words/tokens/emojis/links).
- [x] **Plaintext & Diff**: Dynamic wrapped line gutter sync, side-by-side diff viewer with unsaved state buffer.
- [x] **Databases & Graph**: Frontmatter Table view, Kanban board (Eisenhower matrix), D3 force physics knowledge graph.
- [x] **Search & Navigation**: `⌘K` fuzzy search modal, hash routing permalinks (`/w/[id]#[view]`), resizable sidebar.
- [x] **Cloud Sync & Themes**: Google Drive 5MB resumable chunk sync, 14 CSS themes, universal Noto Color Emoji font.
- [x] **Brand Consistency**: Strict user-facing `CaffeineMD` branding, seed note `Welcome to CaffeineMD.md`, canonical metadata.
- [x] **Native PWA Engine**: Service Worker (`sw.js`), 192/512px icons, native `beforeinstallprompt` prompt execution, direct editor launch.
- [x] **High-Impact Landing**: 10-component modular landing page with 6 interspersed install CTAs, live mockup, and TehWiz footer.
- [x] **SEO & JSON-LD**: Interconnected Schema.org `@graph` (WebSite, WebPage, WebApplication, Organization) on `/`.
- [x] **Lint Verification Suite**: All outstanding ESLint errors and warnings resolved; verified 0 errors and 0 warnings.
- [x] **Service Worker Network-First Upgrade**: Updated `sw.js` to `caffeinemd-v2` with Network-First strategy and cache-busting on mount to prevent stale JS from overriding Next.js multi-section landing page during hydration.
- [x] **Navbar Install Button Simplification**: Updated top navbar CTA in [LandingNav.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/landing/LandingNav.tsx) and [InstallButton.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/landing/InstallButton.tsx) to display "Install".

## Verification Status
- Lint verification: Passing cleanly with 0 errors and 0 warnings (`pnpm run lint`). Enforced after every request.
- Production build: Bypassed after normal requests per user protocol (reserved for major milestones / explicit requests).
- Tiered LOC Limits: 100% compliant (<100 LOC sweet spot, <250 LOC soft limit across all landing & core modules).
