# Active Context: CaffeineMD

## Current Focus
- **Dual-Mode Database List View (Standard List vs Responsive Card Grid)**:
  - **Zustand & LocalStorage Layout Persistence (`workspaceStore.ts`)**:
    - Added `listViewLayout: 'list' | 'grid'` and `setListViewLayout: (layout: ListViewLayout) => void` to `WorkspaceState`.
    - Persisted state changes to `localStorage` under key `caffeinemd-list-layout` with client-safe hydration.
  - **Modular Card Item (`src/components/database/list/ListCardItem.tsx`)**:
    - Extracted 144 LOC modular card component with document title/emoji, status pill, Eisenhower priority badge, 3-line body excerpt preview via `extractCleanExcerpt`, tag pills, and relative timestamp.
    - Consumed solid theme CSS variables (`var(--card)`, `var(--border)`, `var(--foreground)`, `var(--bg-primary)`, `var(--theme-accent)`) for wallpaper isolation.
    - Full keyboard accessibility (`Enter`/`Space` activation) and hover elevation.
  - **Toolbar Segmented Switcher (`ViewSwitcher.tsx`)**:
    - Rendered compact segmented toggle with `LayoutList` and `LayoutGrid` icons when `databaseViewMode === 'list'`.
  - **Declarative List Orchestration (`ListView.tsx`)**:
    - Integrated inline header bar displaying total note count, active layout badge, and quick switcher buttons.
    - Switched conditionally between streamlined row list and responsive CSS grid (`grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4`).
  - **Documentation & Verification (`database-graph-and-export.md`)**:
    - Documented dual-mode list view capabilities, card structure, and state persistence.

## Architecture & Recent Changes
1. **Dual-Mode Database List Engine**:
   - `ListView.tsx` acts as a declarative container switching between compact rows and multi-column visual cards while delegating card item logic to `ListCardItem.tsx` to maintain strict LOC limits.
2. **Solid Theme Token Layering**:
   - Database views utilize solid CSS variables (`var(--card)`) ensuring clean readability against user-configured background image wallpapers.

## Next Steps
- Maintain strict <250 LOC per file across all modules (strict hard limit: 400 LOC).
- Verification: Run `pnpm run lint` on every prompt cycle.
