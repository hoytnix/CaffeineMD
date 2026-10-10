# Active Context: Kite Workspace

## Current Focus
Resolved Netlify CI build failure caused by peer dependency snapshot mismatch for `@tiptap/extension-underline` in `pnpm-lock.yaml`. Added `netlify.toml` with `@netlify/plugin-nextjs` and SPA fallback redirects to guarantee proper client routing and prevent 404s on refresh.

## Key Changes
1. **pnpm Lockfile Sync (`ERR_PNPM_LOCKFILE_MISSING_DEPENDENCY`)**:
   - Resolved peer-dependency snapshot resolution for `@tiptap/extension-underline` via `pnpm install --fix-lockfile`.
   - Verified that `pnpm install --frozen-lockfile` runs cleanly with 0 errors.
2. **Netlify Deployment Configuration (`netlify.toml`)**:
   - Created [netlify.toml](file:///home/oloty/Dev/Kite/netlify.toml) declaring:
     - `[build]` command `pnpm build` and publish directory `.next`.
     - `[[plugins]]` package `@netlify/plugin-nextjs` for server/static rendering.
     - `[[redirects]]` mapping `/*` to `/index.html` with status `200` to prevent 404s on dynamic client routes.
3. **Editor & Toolbar Integrity**:
   - Retained 3x enlarged bottom formatting toolbar strictly constrained to `w-[calc(100%-3rem)] max-w-2xl` with invisible internal overflow and drag-to-pan scrolling.
   - Retained theme-wide styling across canvas, headers, blockquotes, code, tables, and settings.
