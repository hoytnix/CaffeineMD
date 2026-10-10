# Active Context: Kite Workspace

## Current Focus
Implemented the Universal Emoji Drawer (`Shift + Space`), cleaned top navbar to 5 icon-only peer view tabs, created dedicated iOS-style settings page, integrated 14 theme presets with Gemini 3.5 Flash-Lite AI Theme Generator, established 1-to-1 Live Disk Folder workspace architecture with popover switcher, and built Google SSO with bidirectional Google Drive sync.

## Key Changes
1. **Universal Emoji Engine & Drawer**:
   - Color emoji font fallback rules in `app/globals.css`.
   - Global keyboard hook `useEmojiDrawer` (`Shift + Spacebar`) with scroll prevention.
   - Comprehensive multi-category emoji dataset in `src/lib/emoji/emojiData.ts`.
   - Accessible keyboard-navigable drawer in `src/components/emoji/EmojiDrawer.tsx` inserting directly into active Tiptap caret, focused inputs, or clipboard with toast.
2. **Navbar Cleanup & 5 Icon-Only Peer Views**:
   - Removed `Import Vault` button and `IndexedDB` status badge from top navbar.
   - Restructured views into 5 top-level peer view tabs in `workspaceStore`: Editor (`FileText`), Graph (`Network`), Table (`Table`), Board (`Kanban`), and List (`List`).
   - Icon-only triggers with accessible titles and zero visible text labels.
3. **Dedicated iOS-Style Settings Page**:
   - Sidebar footer features `Settings` gear button navigating to standalone `/settings` page (`app/settings/page.tsx`) with iOS back button returning to `/`.
   - Inset list cards, discrete rows, toggle controls, and clean typography.
4. **Theme Engine & AI Theme Generator**:
   - `src/lib/themes/themeDefinitions.ts` with 14 presets (Dark, Light, Solarized Light, Solarized Dark, Monokai, Forest, Seahorse, Deep Sea, Microsoft, Hacker, Spring, Summer, Autumn, Winter) plus Custom.
   - Dynamic CSS variable application (`--background`, `--foreground`, `--card`, `--border`, `--accent`, `--primary`, `--font-family`, `--bg-image`).
   - 2-4 column responsive theme selector grid in Settings with Custom pinned as final card.
   - Next.js API route `app/api/theme/generate/route.ts` powered by Gemini 3.5 Flash-Lite with structured JSON schema.
5. **Workspaces & 1:1 Kite SVG Logo**:
   - Replaced plain text wordmark with crisp geometric 1:1 SVG Kite logo mark (`src/components/workspace/WorkspacePopover.tsx`).
   - Popover for active workspace indicator, connected disk folders list, mount disk folder action, and disconnect action.
   - Live disk directory handle persistence in IndexedDB (`db.workspaces`).
6. **Google SSO & Google Drive Cloud Sync**:
   - Client-side Google SSO with scope `https://www.googleapis.com/auth/drive.file`.
   - `src/lib/sync/googleDriveSync.ts` managing 1 root folder per workspace (`Kite-[workspace-name]`) with bidirectional sync and timestamp/hash detection.
