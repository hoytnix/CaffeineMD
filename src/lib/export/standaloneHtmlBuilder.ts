import { Note } from '@/src/lib/storage/schema';
import { markdownToHtml } from '@/src/lib/markdown/markdownToHtml';
import { themeDefinitions, ThemeDefinition } from '@/src/lib/themes/themeDefinitions';
import { findVaultTemplate } from '@/src/lib/storage/repositories/noteRepository';
import { renderJinjaTemplate, TemplateContext, TemplatePage } from './jinjaCompiler';

export interface ExportHtmlOptions {
  themeId: string;
  includeThemeSwitcher: boolean;
  appTitle?: string;
  isPwa?: boolean;
  customTemplate?: string;
  pages?: TemplatePage[];
}

export function escapeHtml(str: string): string {
  return (str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[m] || m));
}

function resolveTheme(themeId: string): ThemeDefinition {
  return themeDefinitions.find((t) => t.id === themeId) || themeDefinitions[0];
}

export function renderWithJinjaTemplate(
  note: Note,
  template: string,
  options: ExportHtmlOptions
): string {
  const renderedContent = markdownToHtml(note.content || '');
  const title = options.appTitle || note.title || note.name?.replace(/\.[^/.]+$/, '') || 'Untitled Document';
  const wordCount = (note.content || '').trim().split(/\s+/).filter(Boolean).length;
  const readingTimeVal = `${Math.max(1, Math.ceil(wordCount / 200))} min read`;
  const dateVal = new Date(note.updatedAt || Date.now()).toLocaleDateString();

  const context: TemplateContext = {
    title,
    content: renderedContent,
    description: `${title} - Offline Standalone Document`,
    date: dateVal,
    wordCount,
    readingTime: readingTimeVal,
    reading_time: readingTimeVal,
    word_count: wordCount,
    isPwa: Boolean(options.isPwa),
    is_pwa: Boolean(options.isPwa),
    frontmatter: note.frontmatter || {},
    pages: options.pages,
    themeVars: `/* custom theme */`,
  };

  return renderJinjaTemplate(template, context);
}

export async function buildStandaloneHtml(note: Note, options: ExportHtmlOptions): Promise<string> {
  let template = options.customTemplate;
  if (!template) {
    const folderPath = note.path.includes('/') ? note.path.slice(0, note.path.lastIndexOf('/')) : '';
    const found = await findVaultTemplate(note.vaultId || 'default-vault', folderPath);
    if (found?.content) {
      template = found.content;
    }
  }

  if (template) {
    return renderWithJinjaTemplate(note, template, options);
  }

  const selectedTheme = resolveTheme(options.themeId);
  const renderedContent = markdownToHtml(note.content || '');
  const title = options.appTitle || note.title || note.name?.replace(/\.[^/.]+$/, '') || 'Untitled Document';

  const bg = selectedTheme.background || '#121212';
  const fg = selectedTheme.foreground || '#e0e0e0';
  const card = selectedTheme.card || '#1e1e1e';
  const border = selectedTheme.border || '#333333';
  const accent = selectedTheme.accent || '#6366f1';

  return `<!DOCTYPE html>
<html lang="en" data-theme="${selectedTheme.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeHtml(title)} - Offline Standalone Document">
  ${options.isPwa ? `<link rel="manifest" href="./manifest.webmanifest">
  <meta name="theme-color" content="${bg}">` : ''}
  <style>
    :root {
      --bgPrimary: ${bg};
      --textPrimary: ${fg};
      --bgSecondary: ${card};
      --borderColor: ${border};
      --accent: ${accent};
      --font-sans: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      --font-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background-color: var(--bgPrimary, #121212);
      color: var(--textPrimary, #e0e0e0);
      font-family: var(--font-sans);
      line-height: 1.65;
      padding: 2.5rem 1.25rem;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      transition: background-color 0.2s ease, color 0.2s ease;
    }
    .container {
      width: 100%;
      max-width: 860px;
    }
    header.doc-header {
      margin-bottom: 2.5rem;
      border-bottom: 1px solid var(--borderColor, #333);
      padding-bottom: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }
    .doc-header h1 { font-size: 2.25rem; font-weight: 700; color: var(--textPrimary); line-height: 1.25; }
    .theme-toggle-btn {
      background: var(--bgSecondary, #1e1e1e);
      color: var(--textPrimary);
      border: 1px solid var(--borderColor, #333);
      padding: 0.45rem 0.9rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.85rem;
      font-weight: 500;
      white-space: nowrap;
      transition: opacity 0.2s;
    }
    .theme-toggle-btn:hover { opacity: 0.85; }
    article.content { font-size: 1.05rem; }
    article.content h1, article.content h2, article.content h3, article.content h4 {
      margin-top: 1.8rem;
      margin-bottom: 0.8rem;
      color: var(--textPrimary);
      font-weight: 600;
    }
    article.content p { margin-bottom: 1.2rem; }
    article.content pre {
      background: var(--bgSecondary, #1a1a1a);
      border: 1px solid var(--borderColor, #2e2e2e);
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      margin: 1.2rem 0;
      font-family: var(--font-mono);
      font-size: 0.9rem;
    }
    article.content code {
      background: var(--bgSecondary, #1a1a1a);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 0.88em;
    }
    article.content blockquote {
      border-left: 3px solid var(--accent);
      padding: 0.6rem 1rem;
      margin: 1.2rem 0;
      background: var(--bgSecondary);
      border-radius: 0 6px 6px 0;
    }
    article.content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }
    article.content th, article.content td {
      border: 1px solid var(--borderColor, #333);
      padding: 0.6rem 0.9rem;
      text-align: left;
    }
    article.content th { background: var(--bgSecondary, #222); font-weight: 600; }
    article.content a { color: var(--accent, #6366f1); text-decoration: none; }
    article.content a:hover { text-decoration: underline; }
    @media print {
      body { background: #fff !important; color: #000 !important; }
      .theme-toggle-btn { display: none; }
    }
  </style>
</head>
<body>
  <main class="container">
    <header class="doc-header">
      <h1>${escapeHtml(title)}</h1>
      ${options.includeThemeSwitcher ? '<button class="theme-toggle-btn" id="theme-toggle">Invert Theme</button>' : ''}
    </header>
    <article class="content">
      ${renderedContent}
    </article>
  </main>
  <script>
    ${options.isPwa ? `
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(console.error);
      });
    }` : ''}
    ${options.includeThemeSwitcher ? `
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const root = document.documentElement;
        const currentBg = root.style.getPropertyValue('--bgPrimary');
        const isWhite = currentBg === '#ffffff' || currentBg === 'rgb(255, 255, 255)';
        root.style.setProperty('--bgPrimary', isWhite ? '${bg}' : '#ffffff');
        root.style.setProperty('--textPrimary', isWhite ? '${fg}' : '#121212');
        root.style.setProperty('--bgSecondary', isWhite ? '${card}' : '#f4f4f5');
      });
    }` : ''}
  </script>
</body>
</html>`;
}
