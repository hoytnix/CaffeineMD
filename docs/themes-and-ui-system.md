# Theme Engine, CSS Variables & Mobile UX

This document details CaffeineMD's theme architecture, dynamic CSS variable cascading, background image opacity isolation, and responsive mobile adaptations.

---

## 1. Theme Engine Architecture

CaffeineMD features a flexible design system located in [`src/lib/themes/`](file:///home/oloty/Dev/CaffeineMD/src/lib/themes/):

```
┌────────────────────────────────────────────────────────────────────────┐
│                        CaffeineMD Theme Engine                         │
├──────────────────────────┬──────────────────────┬──────────────────────┤
│       Base Presets       │   Seasonal Presets   │    Custom & BYOK     │
│  • Obsidian Dark         │  • Autumn Maple      │  • AI Theme Studio   │
│  • Modern Indigo Dark    │  • Cherry Blossom    │    (Gemini 3.8 Flash)│
│  • Cyberpunk Glass       │  • Nordic Winter     │  • Custom Backdrop   │
│  • Solarized Light/Dark  │  • Summer Horizon    │    Wizard            │
└──────────────────────────┴──────────────────────┴──────────────────────┘
                                   │
                                   ▼
                      applyThemeToDocument()
                                   │
                                   ▼
       Inject CSS Custom Properties onto <html> (document.documentElement)
```

### 1.1 Preset Categories
1. **Base Themes ([`baseThemes.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/themes/presets/baseThemes.ts))**:
   - Modern developer staples including Obsidian Dark, Minimalist Light, Solarized, and Cyberpunk Neon.
2. **Seasonal Themes ([`seasonalThemes.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/themes/presets/seasonalThemes.ts))**:
   - Curated high-aesthetic palettes with themed backdrop images (Autumn Warmth, Sakura Breeze, Arctic Solitude).
3. **Custom Themes ([`customThemes.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/themes/presets/customThemes.ts))**:
   - User-defined theme records saved to IndexedDB (`settings` table) and hydrated into `workspaceStore.customThemes`.

### 1.2 AI Theme Studio & Custom Theme Wizard
- **AI Theme Studio Route Handler (`/app/api/theme/generate/route.ts`)**:
  - Leverages Google Gemini BYOK (`gemini-3.8-flash` cascading down to `gemini-3.7-flash` and `gemini-3.5-flash-lite`).
  - Accepts natural language aesthetic prompts (e.g., *"1980s retro synthwave cassette aesthetic with dark purple backgrounds and cyan neon borders"*).
  - Enforces strict JSON Schema validation returning complete color tokens: `primary`, `accent`, `background`, `foreground`, `card`, `border`, syntax colors, and Google Font URLs.
- **Custom Theme Wizard (`CustomThemeWizard.tsx`)**:
  - Interactive color picker UI allowing users to customize foreground/background hex values, upload custom wallpaper images, and adjust Google Web Fonts.

---

## 2. CSS Variables & Background Opacity Isolation

A core UI breakthrough in CaffeineMD is the strict separation between **ambient background image opacity** and **opaque UI elements**:

```
┌────────────────────────────────────────────────────────────────────────────────────┐
│ VIEWPORT STACK                                                                     │
├────────────────────────────────────────────────────────────────────────────────────┤
│ [z-30] Modals, Dropdowns, Command Palette (100% Solid & Opaque)                    │
├────────────────────────────────────────────────────────────────────────────────────┤
│ [z-20] Editor Toolbars, Settings Cards, Database Rows (100% Solid & Opaque)        │
├────────────────────────────────────────────────────────────────────────────────────┤
│ [z-10] Page / Canvas Wrappers (bg-transparent, allowing backdrop visibility)       │
├────────────────────────────────────────────────────────────────────────────────────┤
│ [z-0]  Dedicated Fixed Background Image Layer (opacity: var(--theme-opacity))     │
├────────────────────────────────────────────────────────────────────────────────────┤
│ [-z-1] Root Document Background (bg-[var(--bg-primary)], solid color fallback)     │
└────────────────────────────────────────────────────────────────────────────────────┘
```

### 2.1 The Transparency Trap
In naive theme implementations, applying opacity directly to `--bg-primary` or `--bg-secondary` (e.g., via `color-mix(in srgb, #000 80%, transparent)`) causes buttons, settings sections, cards, and dropdown menus to turn translucent. Text becomes illegible against busy wallpapers, and UI surfaces lose contrast.

### 2.2 CaffeineMD's Architectural Solution
1. **Solid Color Surface Tokens**:
   - In [`colorUtils.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/themes/colorUtils.ts) and [`globals.css`](file:///home/oloty/Dev/CaffeineMD/app/globals.css), `--bg-primary`, `--bg-secondary`, `--card`, `--theme-bg-sidebar`, and `--theme-bg-card` are **always 100% solid, fully opaque hex/RGB values**.
   - Cards, buttons, inputs, modals, and toolbars render on solid backgrounds.
2. **Dedicated Background Layer**:
   - In `app/w/[workspaceId]/page.tsx` and `SettingsView.tsx`:
     ```tsx
     {/* Ambient Wallpaper Layer */}
     <div
       className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center transition-opacity duration-300"
       style={{
         backgroundImage: 'var(--theme-bg-image)',
         opacity: themeOpacity, // Driven by workspaceStore.themeOpacity (0.10 - 1.00)
       }}
     />
     ```
3. **Transparent Canvas Wrappers**:
   - The intermediate page containers and editor canvas wrappers (`TiptapEditor.tsx`, `PlaintextMarkdownEditor.tsx`, `DiffViewer.tsx`, `DatabaseView.tsx`, `GraphView.tsx`) declare `bg-transparent`.
   - The user sees the aesthetic wallpaper behind their writing canvas, while all interactive UI widgets remain crisp and opaque.
4. **Mobile Scroll Attachment**:
   - On iOS Safari, `background-attachment: fixed` causes significant scrolling stutter.
   - `globals.css` overrides mobile viewports with `background-attachment: scroll !important` to maintain 60 FPS scrolling.

---

## 3. Mobile & iOS Safari Ergonomics

CaffeineMD is tuned for mobile WebKit and iOS touch interaction:

### 3.1 Virtual Keyboard Viewport Adaptation (`useKeyboardOffset.ts`)
- On iOS devices, the software keyboard obscures bottom-fixed toolbars and input fields.
- `useKeyboardOffset.ts` listens to `window.visualViewport.addEventListener('resize')`.
- Calculates the difference between `window.innerHeight` and `visualViewport.height`, injecting `--keyboard-offset` into the document style.
- Editor toolbars and floating action bars translate upward smoothly with keyboard opening.

### 3.2 Responsive Database Viewports
- In `TableView.tsx`, `KanbanView.tsx`, and `ListView.tsx`, toolbars feature collapsible spoiler sections (`DatabaseSpoilerFilter.tsx`).
- Column headers collapse into compact horizontal scrolling trays on touch screens.
- Active filter badges indicate applied constraints without consuming vertical screen real estate.

### 3.3 iOS-Native Settings Navigation (`IosSettingsHome.tsx`)
- On viewports `< 768px`, the settings experience adapts to Apple's native single-column navigation pattern.
- Tapping a category (e.g., Themes, Storage, Google Drive) slides in the detail view with an iOS-style back navigation header.
- Persistent profile pill surfaces SSO authentication status with dynamic user initials and email.
