export interface SearchIndexItem {
  id: string;
  title: string;
  slug: string;
  tags: string[];
  excerpt: string;
  tokens: string[];
}

export function stripMarkdown(md: string): string {
  return (md || '')
    .replace(/^---[\s\S]*?---/g, '') // strip frontmatter
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[\[(.*?)\]\]/g, '$1') // wikilinks
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // markdown links
    .replace(/`{1,3}[\s\S]*?`{1,3}/g, '') // code
    .replace(/[#*_~>-]/g, ' ') // formatting chars
    .replace(/\s+/g, ' ')
    .trim();
}

export function buildVaultSearchIndex(
  notes: Array<{
    id: string;
    title: string;
    slug: string;
    content: string;
    tags?: string[];
    frontmatter?: Record<string, any>;
  }>
): SearchIndexItem[] {
  return notes.map((n) => {
    const plainText = stripMarkdown(n.content);
    const tags = Array.isArray(n.tags) && n.tags.length > 0
      ? n.tags
      : (Array.isArray(n.frontmatter?.tags) ? n.frontmatter!.tags : []);

    const tokens = Array.from(
      new Set(plainText.toLowerCase().match(/\b\w{3,}\b/g) || [])
    ).slice(0, 500);

    return {
      id: String(n.id || n.slug),
      title: n.title,
      slug: n.slug,
      tags: tags.map(String),
      excerpt: plainText.slice(0, 200),
      tokens,
    };
  });
}

export function generateSpotlightSearchSnippet(searchIndex: SearchIndexItem[]): string {
  const indexJson = JSON.stringify(searchIndex);

  return `
<!-- Vault Spotlight Search Modal -->
<div id="spotlight-modal" class="spotlight-overlay" style="display: none;" role="dialog" aria-modal="true" aria-label="Search Vault">
  <div class="spotlight-dialog">
    <div class="spotlight-input-wrap">
      <svg class="spotlight-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
      <input type="text" id="spotlight-input" class="spotlight-input" placeholder="Search notes, tags, content... (↑↓ to select, ↵ to open, ESC)" autocomplete="off" spellcheck="false">
      <kbd class="spotlight-kbd">ESC</kbd>
    </div>
    <div id="spotlight-results" class="spotlight-results" role="listbox"></div>
  </div>
</div>

<style>
.spotlight-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 5rem 1rem 1rem;
}
.spotlight-dialog {
  width: 100%;
  max-width: 640px;
  background: var(--surface-glass, #18181b);
  border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.15));
  border-radius: 14px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6), 0 0 20px var(--border-glow, rgba(99, 102, 241, 0.2));
  overflow: hidden;
  animation: spotlightFadeIn 0.15s ease-out;
}
@keyframes spotlightFadeIn {
  from { opacity: 0; transform: scale(0.97) translateY(-10px); }
  to { opacity: 1; transform: scale(1) translateY(0); }
}
.spotlight-input-wrap {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--border-glass, rgba(255, 255, 255, 0.1));
}
.spotlight-icon { color: var(--accent-primary, #6366f1); flex-shrink: 0; }
.spotlight-input {
  flex: 1;
  background: transparent;
  border: none;
  outline: none;
  color: var(--text-bright, #fff);
  font-size: 1rem;
  font-family: inherit;
}
.spotlight-kbd {
  font-size: 0.7rem;
  padding: 0.2rem 0.45rem;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-muted, #9ca3af);
  border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.1));
}
.spotlight-results {
  max-height: 380px;
  overflow-y: auto;
  padding: 0.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.spotlight-item {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  color: var(--text-main, #d1d5db);
  border: 1px solid transparent;
  transition: all 0.1s ease;
}
.spotlight-item:hover, .spotlight-item.selected {
  background: var(--surface-hover, rgba(255, 255, 255, 0.08));
  border-color: var(--border-glow, rgba(99, 102, 241, 0.3));
  color: var(--text-bright, #fff);
}
.spotlight-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.spotlight-item-title { font-weight: 600; font-size: 0.95rem; }
.spotlight-tags { display: flex; gap: 0.35rem; }
.spotlight-tag { font-size: 0.7rem; color: var(--accent-primary, #818cf8); background: var(--accent-glow, rgba(99,102,241,0.15)); padding: 0.1rem 0.4rem; border-radius: 9999px; }
.spotlight-excerpt { font-size: 0.8rem; color: var(--text-muted, #9ca3af); line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.spotlight-empty { padding: 2rem 1rem; text-align: center; color: var(--text-muted, #9ca3af); font-size: 0.88rem; }
.spotlight-trigger-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.8rem;
  background: var(--surface-glass, rgba(255, 255, 255, 0.05));
  border: 1px solid var(--border-glass, rgba(255, 255, 255, 0.1));
  border-radius: 8px;
  color: var(--text-muted, #9ca3af);
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.15s ease;
}
.spotlight-trigger-btn:hover { color: var(--text-bright, #fff); border-color: var(--border-glow, rgba(99, 102, 241, 0.3)); }
</style>

<script>
window.__VAULT_SEARCH_INDEX__ = ${indexJson};
(function() {
  var index = window.__VAULT_SEARCH_INDEX__ || [];
  var modal = document.getElementById('spotlight-modal');
  var input = document.getElementById('spotlight-input');
  var resultsBox = document.getElementById('spotlight-results');
  var selectedIndex = 0;
  var currentResults = [];

  function openSpotlight() {
    if (!modal) return;
    modal.style.display = 'flex';
    input.value = '';
    renderResults('');
    setTimeout(function() { input.focus(); }, 50);
  }

  function closeSpotlight() {
    if (!modal) return;
    modal.style.display = 'none';
  }

  function filterIndex(q) {
    var query = (q || '').trim().toLowerCase();
    if (!query) return index.slice(0, 10);
    var terms = query.split(/\\s+/);
    return index.filter(function(item) {
      var t = item.title.toLowerCase();
      var exc = item.excerpt.toLowerCase();
      var tags = (item.tags || []).join(' ').toLowerCase();
      return terms.every(function(term) {
        return t.indexOf(term) !== -1 || tags.indexOf(term) !== -1 || exc.indexOf(term) !== -1;
      });
    }).slice(0, 15);
  }

  function renderResults(query) {
    currentResults = filterIndex(query);
    selectedIndex = 0;
    if (currentResults.length === 0) {
      resultsBox.innerHTML = '<div class="spotlight-empty">No matching notes found.</div>';
      return;
    }
    resultsBox.innerHTML = currentResults.map(function(item, idx) {
      var tagsHtml = (item.tags || []).map(function(tag) {
        return '<span class="spotlight-tag">#' + escapeHtml(tag) + '</span>';
      }).join(' ');
      return '<div class="spotlight-item ' + (idx === 0 ? 'selected' : '') + '" data-idx="' + idx + '" data-slug="' + item.slug + '" data-id="' + item.id + '">' +
        '<div class="spotlight-item-header">' +
          '<span class="spotlight-item-title">' + escapeHtml(item.title) + '</span>' +
          '<div class="spotlight-tags">' + tagsHtml + '</div>' +
        '</div>' +
        '<div class="spotlight-excerpt">' + escapeHtml(item.excerpt) + '</div>' +
      '</div>';
    }).join('');

    resultsBox.querySelectorAll('.spotlight-item').forEach(function(el) {
      el.addEventListener('click', function() {
        var slug = el.getAttribute('data-slug');
        var id = el.getAttribute('data-id');
        selectNote(slug, id);
      });
    });
  }

  function escapeHtml(str) {
    return (str || '').replace(/[&<>"']/g, function(m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m] || m;
    });
  }

  function selectNote(slug, id) {
    closeSpotlight();
    var target = 'note-' + slug;
    window.location.hash = target;
    if (typeof window.switchVaultNote === 'function') {
      window.switchVaultNote(target);
    }
  }

  function handleKeydown(e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      if (modal.style.display === 'flex') closeSpotlight();
      else openSpotlight();
      return;
    }
    if (modal.style.display !== 'flex') return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closeSpotlight();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (currentResults.length === 0) return;
      selectedIndex = (selectedIndex + 1) % currentResults.length;
      updateSelected();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (currentResults.length === 0) return;
      selectedIndex = (selectedIndex - 1 + currentResults.length) % currentResults.length;
      updateSelected();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (currentResults[selectedIndex]) {
        selectNote(currentResults[selectedIndex].slug, currentResults[selectedIndex].id);
      }
    }
  }

  function updateSelected() {
    var items = resultsBox.querySelectorAll('.spotlight-item');
    items.forEach(function(el, idx) {
      if (idx === selectedIndex) {
        el.classList.add('selected');
        el.scrollIntoView({ block: 'nearest' });
      } else {
        el.classList.remove('selected');
      }
    });
  }

  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === modal) closeSpotlight();
    });
  }
  if (input) {
    input.addEventListener('input', function(e) {
      renderResults(e.target.value);
    });
  }
  window.addEventListener('keydown', handleKeydown);
  window.openVaultSpotlight = openSpotlight;
})();
</script>`;
}
