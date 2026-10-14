const CACHE_NAME = 'caffeinemd-sandbox-runtime-v1';

export const RUNTIME_ASSETS: { id: string; label: string; url: string; approxSize: string }[] = [
  {
    id: 'typescript',
    label: 'TypeScript Compiler',
    url: 'https://cdn.jsdelivr.net/npm/typescript@5.6.3/lib/typescript.min.js',
    approxSize: '~2.5 MB',
  },
  {
    id: 'sql-wasm-js',
    label: 'SQLite WASM JS Loader',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js',
    approxSize: '~150 KB',
  },
  {
    id: 'sql-wasm-binary',
    label: 'SQLite WASM Binary',
    url: 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm',
    approxSize: '~1.5 MB',
  },
  {
    id: 'fengari-lua',
    label: 'Fengari Lua 5.3 Runtime',
    url: 'https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js',
    approxSize: '~800 KB',
  },
  {
    id: 'pyodide-loader',
    label: 'Pyodide Loader Module',
    url: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.mjs',
    approxSize: '~70 KB',
  },
];

/**
 * Fetch a resource using Cache API if available, otherwise standard fetch.
 * Returns the Response object.
 */
export async function fetchWithRuntimeCache(url: string, init?: RequestInit): Promise<Response> {
  if (typeof caches !== 'undefined') {
    try {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(url);
      if (cachedResponse) {
        return cachedResponse;
      }
      const response = await fetch(url, init);
      if (response.ok) {
        // Clone response before caching since response stream can only be read once
        cache.put(url, response.clone()).catch(() => {});
      }
      return response;
    } catch {
      // Fallback to regular fetch on any cache error
    }
  }
  return fetch(url, init);
}

/**
 * Check whether runtime assets are already cached.
 */
export async function isRuntimeCached(): Promise<boolean> {
  if (typeof caches === 'undefined') return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const keys = await cache.keys();
    // Consider cached if at least core runtimes (ts + sql + lua) are present
    return keys.length >= 3;
  } catch {
    return false;
  }
}

/**
 * Pre-download and cache all compiler/runtime assets one time.
 */
export async function preloadSandboxRuntimes(
  onProgress?: (item: { asset: string; loaded: number; total: number }) => void
): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    const cache = await caches.open(CACHE_NAME);
    let loaded = 0;
    const total = RUNTIME_ASSETS.length;

    for (const asset of RUNTIME_ASSETS) {
      try {
        const existing = await cache.match(asset.url);
        if (!existing) {
          const resp = await fetch(asset.url);
          if (resp.ok) {
            await cache.put(asset.url, resp);
          }
        }
      } catch (assetErr) {
        console.warn(`Failed to cache ${asset.label}:`, assetErr);
      }
      loaded++;
      onProgress?.({ asset: asset.label, loaded, total });
    }
  } catch (err) {
    console.warn('Sandbox runtime caching error:', err);
  }
}

/**
 * Clear the sandbox runtime cache.
 */
export async function clearSandboxRuntimeCache(): Promise<void> {
  if (typeof caches === 'undefined') return;
  try {
    await caches.delete(CACHE_NAME);
  } catch {}
}
