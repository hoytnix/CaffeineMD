export interface ThemeDesignTokens {
  themeName: string;
  bgBase: string;          // Hex or hsl, e.g. #0a0b0e
  surfaceGlass: string;    // e.g. rgba(18, 20, 28, 0.7)
  surfaceHover: string;    // e.g. rgba(28, 32, 44, 0.8)
  borderGlass: string;     // e.g. rgba(255, 255, 255, 0.08)
  borderGlow: string;      // e.g. rgba(255, 230, 0, 0.3)
  accentPrimary: string;   // e.g. #ffff66
  accentSecondary: string; // e.g. #00ffcc
  accentGlow: string;      // e.g. rgba(255, 255, 102, 0.15)
  textMain: string;        // e.g. #f3f4f6
  textMuted: string;       // e.g. #9ca3af
  textBright: string;      // e.g. #ffffff
  fontSans: string;        // Must default to Inter / system sans-serif
  fontMono: string;        // Must default to JetBrains Mono / system monospace
  bgImageUrl?: string;     // Theme ambient backdrop image URL
  fontFamily?: string;     // Theme / editor font choice ('JetBrains Mono', 'Merriweather', 'Inter')
}

export type ExportThemeTokens = ThemeDesignTokens;

export const DEFAULT_THEME_TOKENS: ThemeDesignTokens = {
  themeName: 'Cyber Glass Dark',
  bgBase: '#0a0b0e',
  surfaceGlass: 'rgba(18, 20, 28, 0.75)',
  surfaceHover: 'rgba(28, 32, 44, 0.85)',
  borderGlass: 'rgba(255, 255, 255, 0.08)',
  borderGlow: 'rgba(99, 102, 241, 0.25)',
  accentPrimary: '#6366f1',
  accentSecondary: '#06b6d4',
  accentGlow: 'rgba(99, 102, 241, 0.18)',
  textMain: '#f3f4f6',
  textMuted: '#9ca3af',
  textBright: '#ffffff',
  fontSans: "Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  fontMono: "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
};

export function sanitizeThemeTokens(input?: Partial<ThemeDesignTokens> | null): ThemeDesignTokens {
  const d = DEFAULT_THEME_TOKENS;
  if (!input || typeof input !== 'object') return d;
  return {
    themeName: typeof input.themeName === 'string' && input.themeName ? input.themeName : d.themeName,
    bgBase: typeof input.bgBase === 'string' && input.bgBase ? input.bgBase : d.bgBase,
    surfaceGlass: typeof input.surfaceGlass === 'string' && input.surfaceGlass ? input.surfaceGlass : d.surfaceGlass,
    surfaceHover: typeof input.surfaceHover === 'string' && input.surfaceHover ? input.surfaceHover : d.surfaceHover,
    borderGlass: typeof input.borderGlass === 'string' && input.borderGlass ? input.borderGlass : d.borderGlass,
    borderGlow: typeof input.borderGlow === 'string' && input.borderGlow ? input.borderGlow : d.borderGlow,
    accentPrimary: typeof input.accentPrimary === 'string' && input.accentPrimary ? input.accentPrimary : d.accentPrimary,
    accentSecondary: typeof input.accentSecondary === 'string' && input.accentSecondary ? input.accentSecondary : d.accentSecondary,
    accentGlow: typeof input.accentGlow === 'string' && input.accentGlow ? input.accentGlow : d.accentGlow,
    textMain: typeof input.textMain === 'string' && input.textMain ? input.textMain : d.textMain,
    textMuted: typeof input.textMuted === 'string' && input.textMuted ? input.textMuted : d.textMuted,
    textBright: typeof input.textBright === 'string' && input.textBright ? input.textBright : d.textBright,
    fontSans: d.fontSans, // Enforce safe sans-serif stack
    fontMono: d.fontMono, // Enforce safe mono stack
    bgImageUrl: typeof input.bgImageUrl === 'string' ? input.bgImageUrl : undefined,
    fontFamily: typeof input.fontFamily === 'string' ? input.fontFamily : undefined,
  };
}

export function compileTokensToStylesheet(tokens: ThemeDesignTokens): string {
  const t = sanitizeThemeTokens(tokens);
  const isMono = t.fontFamily?.includes('JetBrains Mono') || t.fontFamily === 'mono';
  const isSerif = t.fontFamily?.includes('Merriweather') || t.fontFamily === 'serif';
  const effectiveFont = isMono
    ? 'var(--font-mono)'
    : isSerif
    ? 'Georgia, Cambria, "Times New Roman", Times, serif'
    : 'var(--font-sans)';
  const bgImageValue = t.bgImageUrl ? `url("${t.bgImageUrl}")` : 'none';

  return `
:root {
  --bg-base: ${t.bgBase};
  --surface-glass: ${t.surfaceGlass};
  --surface-hover: ${t.surfaceHover};
  --border-glass: ${t.borderGlass};
  --border-glow: ${t.borderGlow};
  --accent-primary: ${t.accentPrimary};
  --accent-secondary: ${t.accentSecondary};
  --accent-glow: ${t.accentGlow};
  --text-main: ${t.textMain};
  --text-muted: ${t.textMuted};
  --text-bright: ${t.textBright};
  --font-sans: ${t.fontSans};
  --font-mono: ${t.fontMono};
  --bg-image: ${bgImageValue};
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  background-color: var(--bg-base);
  background-image: var(--bg-image, none);
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  background-repeat: no-repeat;
  color: var(--text-main);
  font-family: ${effectiveFont};
  line-height: 1.6;
  text-align: left;
  min-height: 100vh;
  -webkit-font-smoothing: antialiased;
}
.site-layout {
  display: flex;
  min-height: 100vh;
  width: 100%;
}
.sidebar-panel {
  width: 280px;
  flex-shrink: 0;
  background: var(--surface-glass);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid var(--border-glass);
  padding: 1.5rem 1rem;
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.sidebar-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--text-bright);
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}
.sidebar-nav-link {
  display: block;
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  color: var(--text-muted);
  text-decoration: none;
  font-size: 0.88rem;
  font-weight: 500;
  border: 1px solid transparent;
  transition: all 0.15s ease;
}
.sidebar-nav-link:hover {
  background: var(--surface-hover);
  color: var(--text-bright);
  border-color: var(--border-glass);
}
.sidebar-nav-link.active {
  background: var(--accent-glow);
  color: var(--accent-primary);
  border-color: var(--border-glow);
  font-weight: 600;
}
.main-content {
  flex: 1;
  min-width: 0;
  padding: 3rem 2.5rem;
  display: flex;
  justify-content: center;
  overflow-y: auto;
}
.article-shell {
  width: 100%;
  max-width: 860px;
}
.doc-header {
  margin-bottom: 2.25rem;
  border-bottom: 1px solid var(--border-glass);
  padding-bottom: 1.5rem;
}
.doc-header h1 {
  font-size: 2.35rem;
  font-weight: 800;
  color: var(--text-bright);
  line-height: 1.2;
  letter-spacing: -0.02em;
}
.meta-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.85rem;
}
.meta-pills span, .meta-pill {
  font-size: 0.75rem;
  padding: 0.2rem 0.6rem;
  border-radius: 9999px;
  background: var(--surface-glass);
  border: 1px solid var(--border-glass);
  color: var(--text-muted);
  font-weight: 500;
}
.article-content {
  font-size: 1.05rem;
  line-height: 1.65;
  color: var(--text-main);
  text-align: left;
}
.article-content h1, .article-content h2, .article-content h3, .article-content h4 {
  color: var(--text-bright);
  font-weight: 700;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  line-height: 1.3;
}
.article-content p { margin-bottom: 1.25rem; }
.article-content pre {
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(8px);
  border: 1px solid var(--border-glass);
  border-radius: 10px;
  padding: 1.15rem;
  overflow-x: auto;
  margin: 1.5rem 0;
  font-family: var(--font-mono);
  font-size: 0.9rem;
}
.article-content code {
  background: rgba(255, 255, 255, 0.08);
  padding: 0.2em 0.45em;
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.88em;
  color: var(--accent-primary);
}
.article-content blockquote {
  border-left: 3px solid var(--accent-primary);
  background: var(--surface-glass);
  padding: 0.85rem 1.2rem;
  border-radius: 0 8px 8px 0;
  margin: 1.5rem 0;
  color: var(--text-muted);
}
.article-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 1.75rem 0;
  font-size: 0.95rem;
}
.article-content th, .article-content td {
  border: 1px solid var(--border-glass);
  padding: 0.7rem 1rem;
  text-align: left;
}
.article-content th {
  background: var(--surface-glass);
  color: var(--text-bright);
  font-weight: 600;
}
.article-content a {
  color: var(--accent-primary);
  text-decoration: none;
}
.article-content a:hover {
  text-decoration: underline;
}
.wiki-link {
  color: var(--accent-primary);
  background: var(--accent-glow);
  padding: 0.15em 0.5em;
  border-radius: 6px;
  font-weight: 500;
  text-decoration: none;
  border: 1px solid var(--border-glass);
  transition: all 0.15s ease;
  display: inline-block;
}
.wiki-link:hover {
  background: var(--surface-hover);
  border-color: var(--border-glow);
  text-decoration: none;
}
.editor-image {
  max-width: 100%;
  height: auto;
  border-radius: 10px;
  margin: 1.5rem 0;
  display: block;
  border: 1px solid var(--border-glass);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25);
}
@media (max-width: 768px) {
  .site-layout { flex-direction: column; }
  .sidebar-panel { width: 100%; height: auto; position: static; border-right: none; border-bottom: 1px solid var(--border-glass); }
  .main-content { padding: 1.75rem 1.25rem; }
}
`;
}

export function buildAuditedThemeTemplate(
  tokens: ThemeDesignTokens,
  isMultiPage = false
): string {
  const css = compileTokensToStylesheet(tokens);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>{{ title }}</title>
  <meta name="description" content="{{ description }}">
  {% if is_pwa %}
  <link rel="manifest" href="./manifest.webmanifest">
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        navigator.serviceWorker.register('./sw.js').catch(console.error);
      });
    }
  </script>
  {% endif %}
  <style>
${css}
  </style>
</head>
<body>
  <div class="site-layout">
    <aside class="sidebar-panel">
      <div class="sidebar-title">
        <span>{{ folderName or title }}</span>
      </div>
      <nav class="sidebar-nav">
        {% for note in notes %}
          <a href="#{{ note.id }}" class="sidebar-nav-link">{{ note.title }}</a>
        {% endfor %}
        ${isMultiPage ? `
        {% for page in pages %}
          <a href="{{ page.url }}" class="sidebar-nav-link">{{ page.title }}</a>
        {% endfor %}` : ''}
      </nav>
    </aside>
    <main class="main-content">
      <div class="article-shell">
        <header class="doc-header">
          <h1>{{ title }}</h1>
          <div class="meta-pills">
            {% if date %}<span>{{ date }}</span>{% endif %}
            {% if reading_time %}<span>{{ reading_time }}</span>{% endif %}
          </div>
        </header>
        <article class="article-content">
          {{ content }}
        </article>
      </div>
    </main>
  </div>
</body>
</html>`;
}
