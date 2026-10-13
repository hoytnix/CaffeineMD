import { ThemeDefinition } from '@/src/lib/themes/themeDefinitions';

export const ROUTER_SCRIPT = `
<script>
  (function() {
    function switchNote(targetId) {
      if (!targetId) return;
      var cleanTarget = decodeURIComponent(targetId).trim().replace(/^#/, '');
      var normalizedTarget = cleanTarget.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      var panes = document.querySelectorAll('.vault-note-pane');
      var links = document.querySelectorAll('.sidebar-nav a, a.sidebar-nav-link');
      var found = false;

      panes.forEach(function(pane) {
        if (
          pane.id === cleanTarget ||
          pane.id === 'note-' + cleanTarget ||
          pane.getAttribute('data-note-id') === cleanTarget ||
          pane.getAttribute('data-slug') === cleanTarget
        ) {
          pane.style.display = 'block';
          found = true;
          cleanTarget = pane.id;
        } else {
          pane.style.display = 'none';
        }
      });

      if (!found && panes.length > 0) {
        panes[0].style.display = 'block';
        cleanTarget = panes[0].id;
      }

      links.forEach(function(link) {
        var href = link.getAttribute('href') || '';
        var rawHref = href.replace(/^#/, '');
        if (
          rawHref === cleanTarget ||
          'note-' + rawHref === cleanTarget ||
          rawHref === cleanTarget.replace(/^note-/, '')
        ) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }

    function handleHash() {
      var hash = window.location.hash.replace('#', '');
      if (hash) {
        switchNote(hash);
      } else {
        var firstPane = document.querySelector('.vault-note-pane');
        if (firstPane) switchNote(firstPane.id);
      }
    }

    window.addEventListener('hashchange', handleHash);
    window.addEventListener('DOMContentLoaded', handleHash);
    window.switchVaultNote = switchNote;
    handleHash();
  })();
</script>`;

export function renderDefaultFolderHtmlStyles(theme: ThemeDefinition): string {
  const bg = theme.background || '#121212';
  const fg = theme.foreground || '#e0e0e0';
  const card = theme.card || '#1e1e1e';
  const border = theme.border || '#333333';
  const accent = theme.accent || '#6366f1';

  return `
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
      line-height: 1.6;
      text-align: left;
      min-height: 100vh;
      display: flex;
      transition: background-color 0.2s ease, color 0.2s ease;
    }
    .app-layout {
      display: flex;
      width: 100%;
      min-height: 100vh;
    }
    .sidebar {
      width: 280px;
      flex-shrink: 0;
      background: var(--bgSecondary, #1e1e1e);
      border-right: 1px solid var(--borderColor, #333);
      padding: 1.5rem 1rem;
      position: sticky;
      top: 0;
      height: 100vh;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .sidebar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--borderColor, #333);
      padding-bottom: 0.75rem;
    }
    .sidebar-header h2 {
      font-size: 1.05rem;
      font-weight: 700;
      color: var(--textPrimary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      gap: 0.3rem;
      flex: 1;
    }
    .sidebar-nav-link {
      padding: 0.5rem 0.75rem;
      border-radius: 6px;
      color: var(--textPrimary);
      opacity: 0.8;
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 500;
      transition: all 0.15s ease;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .sidebar-nav-link:hover {
      opacity: 1;
      background: rgba(99, 102, 241, 0.12);
      color: var(--accent);
    }
    .sidebar-nav-link.active {
      opacity: 1;
      background: rgba(99, 102, 241, 0.2);
      color: var(--accent);
      font-weight: 600;
    }
    .main-pane {
      flex: 1;
      min-width: 0;
      padding: 2.5rem 2rem;
      overflow-y: auto;
      display: flex;
      justify-content: center;
    }
    .vault-note-pane {
      width: 100%;
      max-width: 860px;
    }
    header.doc-header {
      margin-bottom: 2rem;
      border-bottom: 1px solid var(--borderColor, #333);
      padding-bottom: 1.25rem;
    }
    .doc-header h1 { font-size: 2.25rem; font-weight: 700; color: var(--textPrimary); line-height: 1.25; }
    .meta-pills {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-top: 0.75rem;
    }
    .meta-pills span {
      font-size: 0.75rem;
      padding: 0.2rem 0.55rem;
      border-radius: 9999px;
      background: var(--bgSecondary, #1e1e1e);
      border: 1px solid var(--borderColor, #333);
      color: var(--textPrimary, #e0e0e0);
      font-weight: 500;
    }
    article.article-content { font-size: 1.05rem; text-align: left; line-height: 1.6; }
    article.article-content h1, article.article-content h2, article.article-content h3 {
      margin-top: 1.8rem;
      margin-bottom: 0.8rem;
      color: var(--textPrimary);
      font-weight: 600;
    }
    article.article-content p { margin-bottom: 1.2rem; }
    article.article-content pre {
      background: var(--bgSecondary, #1a1a1a);
      border: 1px solid var(--borderColor, #2e2e2e);
      border-radius: 8px;
      padding: 1rem;
      overflow-x: auto;
      margin: 1.2rem 0;
      font-family: var(--font-mono);
      font-size: 0.9rem;
    }
    article.article-content code {
      background: var(--bgSecondary, #1a1a1a);
      padding: 0.2rem 0.4rem;
      border-radius: 4px;
      font-family: var(--font-mono);
      font-size: 0.88em;
    }
    article.article-content blockquote {
      border-left: 3px solid var(--accent);
      padding: 0.6rem 1rem;
      margin: 1.2rem 0;
      background: var(--bgSecondary);
      border-radius: 0 6px 6px 0;
    }
    article.article-content table {
      width: 100%;
      border-collapse: collapse;
      margin: 1.5rem 0;
    }
    article.article-content th, article.article-content td {
      border: 1px solid var(--borderColor, #333);
      padding: 0.6rem 0.9rem;
      text-align: left;
    }
    article.article-content th { background: var(--bgSecondary, #222); font-weight: 600; }
    article.article-content a { color: var(--accent, #6366f1); text-decoration: none; }
    article.article-content a:hover { text-decoration: underline; }
    .wiki-link {
      color: var(--accent, #6366f1);
      background: rgba(99, 102, 241, 0.12);
      padding: 0.12em 0.45em;
      border-radius: 4px;
      font-weight: 500;
      text-decoration: none;
      transition: background-color 0.15s ease;
      display: inline;
    }
    .wiki-link:hover {
      background: rgba(99, 102, 241, 0.22);
      text-decoration: underline;
    }
    .editor-image {
      max-width: 100%;
      height: auto;
      border-radius: 8px;
      margin: 1.5rem 0;
      display: block;
      border: 1px solid var(--borderColor, #333);
    }
    .theme-toggle-btn {
      background: var(--bgSecondary, #1e1e1e);
      color: var(--textPrimary);
      border: 1px solid var(--borderColor, #333);
      padding: 0.35rem 0.75rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 0.8rem;
      font-weight: 500;
      transition: opacity 0.2s;
    }
    .theme-toggle-btn:hover { opacity: 0.85; }
    @media (max-width: 768px) {
      .app-layout { flex-direction: column; }
      .sidebar { width: 100%; height: auto; position: static; border-right: none; border-bottom: 1px solid var(--borderColor, #333); }
      .main-pane { padding: 1.5rem 1rem; }
    }
    @media print {
      body { background: #fff !important; color: #000 !important; }
      .sidebar, .theme-toggle-btn { display: none !important; }
      .vault-note-pane { display: block !important; margin-bottom: 3rem; page-break-after: always; }
    }
`;
}
