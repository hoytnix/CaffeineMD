import JSZip from 'jszip';
import { Note } from '@/src/lib/storage/schema';
import { db } from '@/src/lib/storage/db';
import { buildStandaloneHtml, escapeHtml, ExportHtmlOptions } from './standaloneHtmlBuilder';

export interface PwaExportBundleOptions extends ExportHtmlOptions {
  scopeMode: 'single' | 'directory';
  folderPath?: string;
  workspaceId: string;
  appName: string;
  shortName: string;
  appId: string;
}

export function slugify(text: string): string {
  return (text || 'untitled')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '') || 'note';
}

function remapWikiLinksToHtml(html: string): string {
  // Convert any remaining [[Note Title]] or data-wikilink anchors to relative .html files
  return html.replace(/href="#\/note\/([^"]+)"/g, (_match, target) => {
    return `href="./${slugify(decodeURIComponent(target))}.html"`;
  }).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, alias) => {
    const text = alias || target;
    return `<a href="./${slugify(target.trim())}.html">${escapeHtml(text.trim())}</a>`;
  });
}

export async function generatePwaZipBundle(
  activeNote: Note,
  options: PwaExportBundleOptions
): Promise<Blob> {
  const zip = new JSZip();

  let notesToExport: Note[] = [activeNote];
  if (options.scopeMode === 'directory') {
    const allFiles = await db.files.toArray();
    const vaultFiltered = allFiles.filter((f) => {
      if (f.isTrash || f.isBinary) return false;
      if (!options.workspaceId) return true;
      if (options.workspaceId === 'default-vault') return !f.vaultId || f.vaultId === 'default-vault';
      return f.vaultId === options.workspaceId;
    });

    notesToExport = options.folderPath
      ? vaultFiltered.filter((n) => n.path.startsWith(options.folderPath!))
      : vaultFiltered;

    if (notesToExport.length === 0) {
      notesToExport = [activeNote];
    }
  }

  // 1. Build Manifest (PWABuilder & Capacitor Compliant)
  const manifest = {
    name: options.appName || 'CaffeineMD Export',
    short_name: options.shortName || 'CaffeineMD',
    start_url: './index.html',
    id: `./?id=${encodeURIComponent(options.appId || 'com.caffeinemd.export')}`,
    scope: './',
    display: 'standalone',
    background_color: '#121212',
    theme_color: '#1e1e1e',
    orientation: 'any',
    icons: [
      { src: './icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: './icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
  zip.file('manifest.webmanifest', JSON.stringify(manifest, null, 2));

  // 2. Build Capacitor Configuration
  const capacitorConfig = {
    appId: options.appId || 'com.caffeinemd.export',
    appName: options.appName || 'CaffeineMD Export',
    webDir: '.',
    bundledWebRuntime: false,
  };
  zip.file('capacitor.config.json', JSON.stringify(capacitorConfig, null, 2));

  // 3. Build Service Worker (sw.js)
  const cachedFiles = ['index.html', 'manifest.webmanifest'];
  notesToExport.forEach((n, idx) => {
    if (idx > 0 || options.scopeMode === 'directory') {
      cachedFiles.push(`${slugify(n.title || n.name)}.html`);
    }
  });

  const swScript = `const CACHE_NAME = '${options.appId || 'caffeinemd-export'}-v1';
const ASSETS = ${JSON.stringify(Array.from(new Set(cachedFiles)))};

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
    ))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => res || fetch(e.request))
  );
});`;
  zip.file('sw.js', swScript);

  // 4. Render HTML files
  if (options.scopeMode === 'single') {
    const singleHtml = buildStandaloneHtml(activeNote, { ...options, isPwa: true });
    zip.file('index.html', remapWikiLinksToHtml(singleHtml));
  } else {
    // Generate an index navigation hub + subpages
    const indexHtml = buildDirectoryIndexHtml(notesToExport, options);
    zip.file('index.html', indexHtml);

    notesToExport.forEach((n) => {
      const pageHtml = buildStandaloneHtml(n, { ...options, isPwa: true });
      const filename = `${slugify(n.title || n.name)}.html`;
      zip.file(filename, remapWikiLinksToHtml(pageHtml));
    });
  }

  // 5. Package Placeholder Icons
  const iconsFolder = zip.folder('icons');
  if (iconsFolder) {
    const dummySvgIcon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#1e1e1e" rx="100"/>
  <path d="M160 256 L220 316 L352 184" stroke="#6366f1" stroke-width="36" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;
    iconsFolder.file('icon.svg', dummySvgIcon);
    iconsFolder.file('icon-192.png', dummySvgIcon);
    iconsFolder.file('icon-512.png', dummySvgIcon);
  }

  return await zip.generateAsync({ type: 'blob' });
}

function buildDirectoryIndexHtml(notes: Note[], options: PwaExportBundleOptions): string {
  const noteListHtml = notes
    .map((n) => {
      const title = n.title || n.name?.replace(/\.[^/.]+$/, '') || 'Untitled';
      const file = `${slugify(n.title || n.name)}.html`;
      return `<li>
  <a href="./${file}">${escapeHtml(title)}</a>
  <span class="path">${escapeHtml(n.path)}</span>
</li>`;
    })
    .join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(options.appName)} - Index</title>
  <link rel="manifest" href="./manifest.webmanifest">
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; background: #121212; color: #e0e0e0; padding: 2.5rem 1.25rem; max-width: 800px; margin: 0 auto; line-height: 1.6; }
    h1 { font-size: 2.25rem; margin-bottom: 0.5rem; color: #fff; font-weight: 700; }
    p.sub { color: #a1a1aa; margin-bottom: 2rem; font-size: 0.95rem; }
    ul { list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.6rem; }
    li { padding: 0.85rem 1.2rem; background: #1e1e1e; border: 1px solid #27272a; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; }
    a { color: #818cf8; text-decoration: none; font-weight: 500; font-size: 1.05rem; }
    a:hover { text-decoration: underline; }
    .path { color: #71717a; font-size: 0.8rem; font-family: ui-monospace, monospace; }
  </style>
</head>
<body>
  <h1>${escapeHtml(options.appName)}</h1>
  <p class="sub">Vault Export &bull; ${notes.length} Documents</p>
  <ul>${noteListHtml}</ul>
  <script>
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');
  </script>
</body>
</html>`;
}
