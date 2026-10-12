/**
 * Inline Markdown Formatting & Tokenization
 * Handles WikiLinks, inline code protection, bold, italic, strikethrough,
 * markdown links, and markdown image syntax (![alt](url "title")).
 */

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function unescapeHtml(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, '>')
    .replace(/&lt;/g, '<')
    .replace(/&amp;/g, '&');
}

/**
 * Prettify WikiLinks [[note]] or [[target|label]] outside of code spans.
 */
export function prettifyWikiLinks(text: string): string {
  return text.replace(/\[\[(.*?)\]\]/g, (_, inner) => {
    const parts = inner.split('|').map((s: string) => s.trim());
    const target = parts[0];
    const label = parts[1] || target;
    return `<span data-wikilink="${escapeHtml(target)}" class="wiki-link">[[${escapeHtml(label)}]]</span>`;
  });
}

/**
 * Replace WikiLinks across HTML tokens while preserving inline code and pre tags.
 */
export function replaceWikiLinksInHtml(html: string): string {
  const tokens = html.split(/(<pre[\s\S]*?<\/pre>|<code[\s\S]*?<\/code>)/gi);
  return tokens
    .map((token) => {
      if (/^<(pre|code)[\s\S]*<\/\1>$/i.test(token)) {
        return token;
      }
      return prettifyWikiLinks(token);
    })
    .join('');
}

/**
 * Matches markdown image syntax:
 * ![alt](url) or ![alt](url "title") or ![alt](<url> "title")
 * Supports URLs with balanced parentheses, query strings, data URIs, and angle brackets.
 */
export const IMAGE_MARKDOWN_REGEX =
  /!\[(.*?)\]\(\s*(?:<([^>]+)>|([^\s'"<>]*(?:\([^\s)]*\)[^\s'"<>]*)*))(?:\s+["'](.*?)["'])?\s*\)/g;

/**
 * Convert inline markdown annotations to HTML.
 * Images are processed BEFORE regular links to prevent `[alt](url)` collision.
 */
export function formatInline(text: string): string {
  // Protect inline code spans: `code` so WikiLinks inside inline code are not prettified
  const codeSpans: string[] = [];
  let res = text.replace(/`([^`]+)`/g, (_, code) => {
    codeSpans.push(code);
    return `__INLINE_CODE_${codeSpans.length - 1}__`;
  });

  // Prettify WikiLinks outside code
  res = prettifyWikiLinks(res);

  // Markdown images: ![alt](url "title") or ![alt](url)
  // Must run BEFORE links so ! isn't left as an orphan before an anchor tag
  res = res.replace(IMAGE_MARKDOWN_REGEX, (_match, alt, urlAngle, urlBare, title) => {
    const url = urlAngle || urlBare || '';
    const escapedSrc = escapeHtml(url);
    const escapedAlt = escapeHtml(alt || '');
    const titleAttr = title ? ` title="${escapeHtml(title)}"` : '';
    return `<img src="${escapedSrc}" alt="${escapedAlt}"${titleAttr} class="editor-image rounded-md max-w-full my-2">`;
  });

  // Bold **text**
  res = res.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  res = res.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // Strikethrough ~~text~~
  res = res.replace(/~~(.+?)~~/g, '<s>$1</s>');
  // Markdown links [label](url)
  res = res.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    '<a href="$2" class="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 underline underline-offset-2 transition-colors">$1</a>'
  );

  // Restore inline code spans without prettifying wikilinks inside them
  res = res.replace(/__INLINE_CODE_(\d+)__/g, (_, idx) => {
    const code = codeSpans[Number(idx)];
    return `<code>${escapeHtml(code)}</code>`;
  });

  return res;
}
