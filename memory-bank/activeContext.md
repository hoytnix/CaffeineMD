# Active Context: CaffeineMD

## Current State
- **Landing & PWA**: High-converting, multi-section landing page at `/` ([app/page.tsx](file:///home/oloty/Dev/CaffeineMD/app/page.tsx), 46 LOC) with 6 interspersed `Install CaffeineMD` CTAs across Nav, Hero, Features, Comparison, Shortcuts, and MegaCTA.
- **Native PWA Engine**: Local-first Service Worker ([public/sw.js](file:///home/oloty/Dev/CaffeineMD/public/sw.js)), compliant 192/512px icons, native `beforeinstallprompt` handling, and direct editor launch (`/w/default-vault#/editor/Welcome%20to%20CaffeineMD.md`). Standalone mode bypasses landing directly into workspace.
- **SEO & Structured Data**: Comprehensive Schema.org `@graph` (WebSite, WebPage, WebApplication/SoftwareApplication, Organization) in [app/layout.tsx](file:///home/oloty/Dev/CaffeineMD/app/layout.tsx).
- **Core Editor**: Tiptap v2 rich text, raw plaintext with off-screen DOM gutter scroll sync, side-by-side diff viewer (`diffUtils.ts`, `DiffViewer.tsx`), configurable autosave interval, and lossless markdown image roundtrips.
- **Branding & Architecture**: Strict `CaffeineMD` user-facing naming, TehWiz Production footer, and strict tiered LOC compliance (<100 LOC sweet spot, <250 LOC soft limit).
- **Verification Rule**: Run `pnpm run lint` after every request (0 errors, 0 warnings). Do NOT run `pnpm run build` after every request.
- **Recent Fixes**:
  - Simplified top navbar CTA button in [LandingNav.tsx](file:///home/oloty/Dev/CaffeineMD/src/components/landing/LandingNav.tsx) from "Install CaffeineMD (Native App)" to "Install".
  - Resolved Service Worker hydration override: upgraded [public/sw.js](file:///home/oloty/Dev/CaffeineMD/public/sw.js) to `caffeinemd-v2` with **Network-First** strategy.
  - Added programmatic cache busting in [usePwaInstall.ts](file:///home/oloty/Dev/CaffeineMD/src/components/landing/hooks/usePwaInstall.ts) and immediate `reg.update()`.
  - Integrated `@vercel/analytics` package into [app/layout.tsx](file:///home/oloty/Dev/CaffeineMD/app/layout.tsx) for real-time web traffic and telemetry.

## Next Steps
- Maintain modular <100-250 LOC boundaries across all components.
- Run `pnpm run lint` verification on every turn without building.
