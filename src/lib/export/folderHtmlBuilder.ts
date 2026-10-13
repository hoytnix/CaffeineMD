import { Note } from '@/src/lib/storage/schema';
import { markdownToHtml } from '@/src/lib/markdown/markdownToHtml';
import { parseFrontmatter } from '@/src/lib/markdown/frontmatter';
import { themeDefinitions, ThemeDefinition } from '@/src/lib/themes/themeDefinitions';
import { findVaultTemplate } from '@/src/lib/storage/repositories/noteRepository';
import { renderJinjaTemplate, TemplateContext } from './jinjaCompiler';
import { cleanWikiLinks, escapeHtml, ExportHtmlOptions } from './standaloneHtmlBuilder';
import { ROUTER_SCRIPT, renderDefaultFolderHtmlStyles } from './folderHtmlStyles';
import { inlineHtmlAssets } from './assetBundler';
import { buildVaultSearchIndex, generateSpotlightSearchSnippet } from './vaultSearchIndex';
import { buildVaultGraphData, generateCanvasGraphSnippet } from './canvasGraphHud';

export interface ExportNoteItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  compiledHtml?: string;
  updatedAt?: string;
}

export interface ExportFolderHtmlOptions extends ExportHtmlOptions {
  folderName?: string;
  workspaceId?: string;
  folderPath?: string;
}

function resolveTheme(themeId: string): ThemeDefinition {
  return themeDefinitions.find((t) => t.id === themeId) || themeDefinitions[0];
}

export async function buildFolderStandaloneHtml(
  folderNotes: Note[],
  options: ExportFolderHtmlOptions
): Promise<string> {
  const folderName = options.folderName || options.appTitle || 'Knowledge Index';

  const processedNotes: ExportNoteItem[] = await Promise.all(
    folderNotes.map(async (note) => {
      const rawContent = note.content || '';
      const { data: frontmatter, content: cleanMarkdown } = parseFrontmatter(rawContent);
      const rawCompiledHtml = cleanWikiLinks(markdownToHtml(cleanMarkdown));
      const compiledHtml = await inlineHtmlAssets(rawCompiledHtml);
      const title =
        frontmatter.title ||
        note.title ||
        note.name?.replace(/\.[^/.]+$/, '') ||
        'Untitled Document';
      const slug =
        title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '') || String(note.id || 'note');

      return {
        id: String(note.id || note.path || slug),
        title,
        slug,
        content: cleanMarkdown,
        compiledHtml,
        updatedAt: frontmatter.updatedAt || note.updatedAt
          ? String(frontmatter.updatedAt || note.updatedAt)
          : undefined,
      };
    })
  );

  const searchIndex = buildVaultSearchIndex(folderNotes.map((n, i) => ({
    id: processedNotes[i].id,
    title: processedNotes[i].title,
    slug: processedNotes[i].slug,
    content: processedNotes[i].content,
    tags: n.tags,
    frontmatter: n.frontmatter,
  })));
  const searchSnippet = generateSpotlightSearchSnippet(searchIndex);

  const graphData = buildVaultGraphData(folderNotes.map((n, i) => ({
    id: processedNotes[i].id,
    title: processedNotes[i].title,
    slug: processedNotes[i].slug,
    content: processedNotes[i].content,
    tags: n.tags,
    frontmatter: n.frontmatter,
  })));
  const graphSnippet = generateCanvasGraphSnippet(graphData);

  const multiNoteHtml = processedNotes
    .map(
      (note, idx) => `
    <section id="note-${note.slug}" class="vault-note-pane" data-note-id="${escapeHtml(note.id)}" data-slug="${escapeHtml(note.slug)}" style="${idx === 0 ? '' : 'display: none;'}">
      <header class="doc-header">
        <h1>${escapeHtml(note.title)}</h1>
        <div class="meta-pills">
          ${note.updatedAt ? `<span>${new Date(Number(note.updatedAt) || note.updatedAt).toLocaleDateString()}</span>` : ''}
          <span>Note ${idx + 1} of ${processedNotes.length}</span>
        </div>
      </header>
      <article class="article-content">
        ${note.compiledHtml || ''}
      </article>
    </section>`
    )
    .join('\n');

  let template = options.customTemplate;
  if (!template) {
    const searchFolder = options.folderPath || '';
    const found = await findVaultTemplate(options.workspaceId || 'default-vault', searchFolder);
    if (found?.content) {
      template = found.content;
    }
  }

  if (template) {
    let normalizedTemplate = template
      .replace(/<!--\s*CONTENT\s*-->/gi, '{{ content }}')
      .replace(/{{\s*content\s*\|\s*safe\s*}}/gi, '{{ content }}');

    if (/<nav class="sidebar-nav">\s*<\/nav>/i.test(normalizedTemplate)) {
      normalizedTemplate = normalizedTemplate.replace(
        /<nav class="sidebar-nav">\s*<\/nav>/i,
        `<nav class="sidebar-nav">
  {% for note in notes %}
    <a href="#{{ note.id }}" class="sidebar-nav-link">{{ note.title }}</a>
  {% endfor %}
</nav>`
      );
    }

    if (!normalizedTemplate.includes('{{ content }}') && !normalizedTemplate.includes('{{content}}')) {
      if (/<article[^>]*>[\s\S]*?<\/article>/i.test(normalizedTemplate)) {
        normalizedTemplate = normalizedTemplate.replace(
          /(<article[^>]*>)[\s\S]*?(<\/article>)/i,
          '$1{{ content }}$2'
        );
      } else if (/<main[^>]*>[\s\S]*?<\/main>/i.test(normalizedTemplate)) {
        normalizedTemplate = normalizedTemplate.replace(
          /(<main[^>]*>)[\s\S]*?(<\/main>)/i,
          '$1{{ content }}    $2'
        );
      }
    }

    const notesContext = processedNotes.map((n) => ({
      id: `note-${n.slug}`,
      title: n.title,
      slug: n.slug,
      url: `#note-${n.slug}`,
      path: n.id,
      date: n.updatedAt ? new Date(Number(n.updatedAt) || n.updatedAt).toLocaleDateString() : '',
    }));

    const templateContext: TemplateContext = {
      title: `${folderName} — Knowledge Index`,
      folderName,
      folder_name: folderName,
      notes: notesContext,
      pages: notesContext,
      content: multiNoteHtml,
      description: `${folderName} — Knowledge Index`,
      date: new Date().toLocaleDateString(),
      wordCount: processedNotes.reduce((acc, n) => acc + n.content.trim().split(/\s+/).filter(Boolean).length, 0),
      isPwa: Boolean(options.isPwa),
      is_pwa: Boolean(options.isPwa),
      themeVars: '/* custom theme */',
    };

    let rendered = renderJinjaTemplate(normalizedTemplate, templateContext);
    const scriptsToInject = `${searchSnippet}\n${graphSnippet}\n${ROUTER_SCRIPT}`;
    if (rendered.includes('</body>')) {
      rendered = rendered.replace('</body>', `${scriptsToInject}\n</body>`);
    } else {
      rendered += scriptsToInject;
    }
    return rendered;
  }

  const selectedTheme = resolveTheme(options.themeId);
  const bg = selectedTheme.background || '#121212';

  return `<!DOCTYPE html>
<html lang="en" data-theme="${selectedTheme.id}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
  <title>${escapeHtml(folderName)} — Knowledge Index</title>
  <meta name="description" content="${escapeHtml(folderName)} - Offline Standalone Knowledge Base">
  ${options.isPwa ? `<link rel="manifest" href="./manifest.webmanifest">
  <meta name="theme-color" content="${bg}">` : ''}
  <style>
  ${renderDefaultFolderHtmlStyles(selectedTheme)}
  </style>
</head>
<body>
  <div class="app-layout">
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>${escapeHtml(folderName)}</h2>
        <div style="display: flex; gap: 0.35rem; align-items: center;">
          <button class="spotlight-trigger-btn" onclick="window.openVaultSpotlight && window.openVaultSpotlight()" title="Search (⌘K)">Search</button>
          <button class="graph-hud-trigger-btn" onclick="window.openVaultGraph && window.openVaultGraph()" title="Knowledge Graph">Graph</button>
          ${options.includeThemeSwitcher ? '<button class="theme-toggle-btn" id="theme-toggle" title="Invert Theme">Invert</button>' : ''}
        </div>
      </div>
      <nav class="sidebar-nav">
        ${processedNotes.map((n, idx) => `<a href="#note-${n.slug}" class="sidebar-nav-link ${idx === 0 ? 'active' : ''}">${escapeHtml(n.title)}</a>`).join('\n        ')}
      </nav>
    </aside>
    <main class="main-pane">
      ${multiNoteHtml}
    </main>
  </div>
  ${options.isPwa ? `
  <script>
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').catch(console.error);
      });
    }
  </script>` : ''}
  ${options.includeThemeSwitcher ? `
  <script>
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.addEventListener('click', () => {
        const root = document.documentElement;
        const currentBg = root.style.getPropertyValue('--bgPrimary');
        const isWhite = currentBg === '#ffffff' || currentBg === 'rgb(255, 255, 255)';
        root.style.setProperty('--bgPrimary', isWhite ? '${bg}' : '#ffffff');
        root.style.setProperty('--textPrimary', isWhite ? '${selectedTheme.foreground || '#e0e0e0'}' : '#121212');
        root.style.setProperty('--bgSecondary', isWhite ? '${selectedTheme.card || '#1e1e1e'}' : '#f4f4f5');
      });
    }
  </script>` : ''}
  ${searchSnippet}
  ${graphSnippet}
  ${ROUTER_SCRIPT}
</body>
</html>`;
}
