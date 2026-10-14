# Core Architecture & State Management

This document details the application shell, routing mechanisms, client-side state topology, and architectural guardrails governing **CaffeineMD**.

---

## 1. Routing & Application Shell

CaffeineMD leverages Next.js 15 App Router while maintaining an offline-first, client-rendered single-page application (SPA) architecture for ultra-low latency navigation.

```
                    ┌────────────────────────────┐
                    │       Next.js 15 App       │
                    └─────────────┬──────────────┘
                                  │
         ┌────────────────────────┼────────────────────────┐
         ▼                        ▼                        ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Landing Page   │    │ Workspace Route  │    │  Settings Route  │
│   /app/page.tsx  │    │ /app/w/[id]/...  │    │ /app/settings/.. │
└──────────────────┘    └─────────┬────────┘    └──────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │   useWorkspaceRouter.ts   │
                    │ (Hash & Query Synced State│
                    └─────────────┬─────────────┘
                                  │
         ┌────────────────┬───────┴────────┬────────────────┐
         ▼                ▼                ▼                ▼
   #view=editor     #view=database    #view=graph      #view=tags
```

### 1.1 Landing Page (`/app/page.tsx` & `/src/components/landing`)
- **Purpose**: Welcomes new users, explains core capabilities, and initiates the initial workspace creation or local folder mount.
- **Key Modules**:
  - `HeroSection.tsx`: Value proposition with instant "Launch Web Workspace" action.
  - `VaultDropzone.tsx`: Live drag-and-drop ingestion zone parsing native OS directories (`webkitdirectory`) into Dexie IndexedDB.
  - `DemoVaultsList.tsx`: Pre-built workspace templates (Research Lab, Personal Knowledge Wiki, Project Management) ready for 1-click instantiation.

### 1.2 Workspace Route (`/app/w/[workspaceId]/page.tsx`)
- **Purpose**: The primary operational studio. Manages the active workspace lifecycle, mounts the left collapsible navigation sidebar, top breadcrumb toolbar, document tab bar, and views container.
- **Deep-linking & Hash Sync (`useWorkspaceRouter.ts`)**:
  - Synchronizes active note selection and active views directly with URL hashes and query parameters without causing full page re-renders:
    - `#view=editor&note=/Welcome.md`
    - `#view=database&folder=/Projects`
    - `#view=graph`
    - `#view=tags&tag=react`
  - When users use browser Back/Forward navigation, `useWorkspaceRouter` listens to `hashchange` and synchronizes `workspaceStore` active tabs and views automatically.

### 1.3 iOS-Inspired Settings Route (`/app/settings/page.tsx` & `/src/components/settings`)
- **Purpose**: Standalone, distraction-free configuration center patterned after the modern iOS Settings design language.
- **Layout Architecture**:
  - `IosSettingsHome.tsx`: Two-column iPad/Desktop layout and single-column mobile view with dynamic SSO Google profile card, squircle icon badges, and grouped setting categories.
  - `SettingsView.tsx`: Container orchestrating category switching (`storage`, `themes`, `editor`, `shortcuts`, `sandbox`, `sync`) with unified branding footer.

---

## 2. Global State Management

Global application state is managed using **Zustand 5**, separated into focused stores to eliminate cascading re-renders across the editor, databases, and search engines.

### 2.1 Workspace Store (`/src/stores/workspaceStore.ts`)
The `useWorkspaceStore` is the central nerve center for workspace navigation, layout modes, tabs, and user preferences:

```ts
interface WorkspaceState {
  // Workspace & Navigation
  activeWorkspaceId: string;
  activeFilePath: string | null;
  openTabs: DocumentTab[];
  sidebarCollapsed: boolean;
  sidebarWidth: number;

  // Multi-Pane Split View
  splitNoteId: string | null;
  activePaneIndex: number; // 0 = primary pane, 1 = secondary pane

  // Primary Workspace Views
  activeView: 'editor' | 'database' | 'graph' | 'tags';
  activeDatabaseFolder: string;

  // Editor Sub-Modes & HUD Toggles
  editorMode: 'wysiwyg' | 'plaintext' | 'diff';
  minimapVisible: boolean;
  outlineHudVisible: boolean;
  focusModeActive: boolean;
  typewriterScrollActive: boolean;
  toolboxPosition: 'left' | 'right' | 'top' | 'floating';

  // Theme & Appearance
  themeId: string;
  themeOpacity: number; // 0.10 to 1.00
  customThemes: CustomThemeDefinition[];

  // Code Execution Sandbox
  codeExecutionSandboxEnabled: boolean;
}
```

#### Detailed State Responsibilities:
1. **Tabs & Split-Pane Lifecycle**:
   - `openTabs`: Array of open documents with scroll offsets, unsaved dirty flags, and active timestamps.
   - `splitNoteId`: When non-null, splits the main editor canvas into two side-by-side or stacked editor panes (`SplitPaneContainer.tsx`), enabling simultaneous cross-reference of two notes.
   - `activePaneIndex`: Focus tracker for keyboard accelerators (e.g., `⌘S` targets the currently active pane).
2. **View Routing & Isolation**:
   - `activeView`: Switches between Rich Editor (`editor`), Frontmatter Relational Database (`database`), 2D Force-Directed Graph (`graph`), and Tag Taxonomy Cloud (`tags`).
3. **Editor Display & HUD State**:
   - `editorMode`: Governs whether the primary pane renders Tiptap (`wysiwyg`), line-gutter code editor (`plaintext`), or two-way diff comparison (`diff`).
   - `focusModeActive`: Toggles distraction-free writing (collapsing sidebars, toolbars, and tab chrome with `F11`).
   - `typewriterScrollActive`: Keeps the active cursor line vertically centered in the viewport during typing.
4. **WASM Sandbox Opt-In**:
   - `codeExecutionSandboxEnabled`: Defaults to `false` for instant application startup without background runtime downloads. Persisted under `caffeinemd-code-execution-sandbox`.

### 2.2 Vault Find & Replace Store (`/src/stores/findReplaceStore.ts`)
Governs the batch RegEx replacement modal (`⌘⇧H`):
- `searchQuery` & `replaceQuery`: RegEx or literal search patterns.
- `caseSensitive`, `matchWholeWord`, `useRegex`: Match flags.
- `matchesByFile`: Map of file paths to matched line ranges and replacement previews.
- `selectedFileIds`: Set of files marked for atomic replacement.
- `historySnapshots`: Stack of previous multi-file operations enabling 1-click snapshot rollback.

---

## 3. Hydration & Theme Synchronization

Because Next.js performs initial server-side rendering (SSR), accessing `localStorage` directly in component bodies causes SSR hydration mismatch warnings. CaffeineMD implements a robust hydration protocol:

### Theme Hydration Flow
```
Browser Request ──► SSR Render with Default Tokens ──► Client DOM Mount
                                                              │
                                                  hydrateTheme() Executed
                                                              │
                             ┌────────────────────────────────┴──────────────────────────────┐
                             ▼                                                               ▼
             Read `caffeinemd-theme-id` &                  Inject CSS Variables to `document.documentElement`
             `caffeinemd-theme-opacity`                     (--bg-primary, --text-primary, --theme-opacity)
```

1. **`applyThemeToDocument()` (`src/lib/themes/colorUtils.ts`)**:
   - Applies active theme color tokens directly to `document.documentElement.style`.
   - Injects the theme background image URL to `--theme-bg-image`.
   - Sets `--theme-opacity` (clamped between 0.10 and 1.00) and `--bg-image-opacity`.
2. **Solid Color Isolation Guardrail**:
   - `--bg-primary` and `--bg-secondary` remain solid hex/RGB tokens at all times.
   - Transparency is **never** blended into root background tokens (preventing buttons, dropdown menus, and settings cards from becoming transparent).
   - Only the fixed background image layer (`z-0`) reads `--theme-opacity`.

---

## 4. Coding Standards & Architectural Guardrails

Maintainers must strictly adhere to the project's non-negotiable architectural constraints:

### 4.1 Strict 250-Line Limit Per File
- **100 LOC**: Ideal target for focused, highly testable units.
- **250 LOC**: Strict soft limit. Files exceeding 250 lines must be immediately decomposed into sub-components, custom hooks, or utility modules.
- **400 LOC**: Absolute hard limit for legacy or monolithic parser algorithms. No PR adding code to a file over 250 lines will be accepted without decomposition.

### 4.2 De-Composition Pattern
When a component grows complex:
1. **Extract Hooks**: Move state, timers, and event listeners into `/src/hooks/` or local `use[Feature].ts`.
2. **Extract Sub-Components**: Break render trees into atomic sub-components (e.g., `ExternalCardContent.tsx` extracted from `IosLinkPreviewCard.tsx`).
3. **Extract Business Logic**: Move math, string transformations, and schema parsing into `/src/lib/`.

### 4.3 Zero-Console-Bloat Policy
- Production code must never leave rogue `console.log` statements in loops or change handlers.
- Use explicit warnings (`console.warn`) only for non-fatal user errors (e.g., malformed YAML in frontmatter).
- Critical failures must be surfaced via toast notifications or visual error boundaries.

### 4.4 Verification Protocol
Before submitting changes, maintainers must verify:
```bash
# Must complete with 0 errors and 0 warnings
pnpm run lint

# Standalone type checker must report zero issues
pnpm exec tsc --noEmit
```
