/**
 * Converts Tiptap editor HTML output back into clean Markdown.
 * Preserves intentional consecutive blank lines, single line breaks (<br>),
 * WikiLinks, blockquotes, lists, and tables without collapsing newlines.
 */
export function editorHtmlToMarkdown(html: string): string {
  if (!html || !html.trim()) return '';

  // If it's not HTML, return as is
  if (!/<[a-z][\s\S]*>/i.test(html)) {
    return html;
  }

  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    // Regex fallback for non-DOM environments
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<li[^>]*data-type="taskItem"[^>]*data-checked="true"[^>]*>(.*?)<\/li>/gi, '- [x] $1\n')
      .replace(/<li[^>]*data-type="taskItem"[^>]*data-checked="false"[^>]*>(.*?)<\/li>/gi, '- [ ] $1\n')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '- $1\n')
      .replace(/<p[^>]*>(?:<br[^>]*>)?<\/p>/gi, '\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<code[^>]*>(.*?)<\/code>/gi, '`$1`')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<span[^>]*data-wikilink="([^"]+)"[^>]*>.*?<\/span>/gi, '[[$1]]')
      .replace(/<[^>]+>/g, '')
      .trim();
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    // Check for WikiLink span
    if (el.hasAttribute('data-wikilink')) {
      if (el.closest('pre') || el.closest('code')) {
        return el.textContent || '';
      }
      const target = el.getAttribute('data-wikilink') || '';
      return `[[${target}]]`;
    }

    // Line break element
    if (tag === 'br') {
      return '\n';
    }

    // Check if inside list item
    const isInsideLi = el.parentElement?.tagName.toLowerCase() === 'li';

    // Children content
    const childrenText = Array.from(el.childNodes).map(walk).join('');

    switch (tag) {
      case 'h1':
        return `# ${childrenText.trim()}\n\n`;
      case 'h2':
        return `## ${childrenText.trim()}\n\n`;
      case 'h3':
        return `### ${childrenText.trim()}\n\n`;
      case 'h4':
        return `#### ${childrenText.trim()}\n\n`;
      case 'h5':
        return `##### ${childrenText.trim()}\n\n`;
      case 'h6':
        return `###### ${childrenText.trim()}\n\n`;
      case 'p': {
        if (isInsideLi) {
          return childrenText.trim();
        }
        // Check if paragraph is blank (only <br> or empty whitespace)
        const isPureBreak =
          el.childNodes.length === 1 &&
          (el.childNodes[0] as HTMLElement).tagName?.toLowerCase() === 'br';
        const isBlank =
          !childrenText.trim() && (el.childNodes.length === 0 || isPureBreak);
        if (isBlank) {
          // Empty paragraph node in Tiptap represents an extra blank line
          return '\n';
        }
        return `${childrenText.trim()}\n\n`;
      }
      case 'strong':
      case 'b':
        return `**${childrenText}**`;
      case 'em':
      case 'i':
        return `*${childrenText}*`;
      case 's':
      case 'del':
        return `~~${childrenText}~~`;
      case 'code':
        if (el.parentElement?.tagName.toLowerCase() === 'pre') {
          return el.textContent || '';
        }
        return `\`${childrenText}\``;
      case 'pre': {
        const codeEl = el.querySelector('code');
        const lang = codeEl?.className?.match(/language-([a-zA-Z0-9_-]+)/)?.[1] || '';
        const codeContent = codeEl ? codeEl.textContent : el.textContent;
        return `\`\`\`${lang}\n${(codeContent || '').trim()}\n\`\`\`\n\n`;
      }
      case 'blockquote': {
        const lines = childrenText.trim().split('\n');
        return lines.map((l) => `> ${l}`).join('\n') + '\n\n';
      }
      case 'hr':
        return `---\n\n`;
      case 'a': {
        const href = el.getAttribute('href') || '';
        return `[${childrenText}](${href})`;
      }
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || '';
        return `![${alt}](${src})`;
      }
      case 'ul': {
        const isTaskList = el.getAttribute('data-type') === 'taskList';
        const items = Array.from(el.children).map((child) => {
          if (child.tagName.toLowerCase() === 'li') {
            const liText = Array.from(child.childNodes).map(walk).join('').trim();
            if (isTaskList || child.getAttribute('data-type') === 'taskItem') {
              const checked = child.getAttribute('data-checked') === 'true';
              return `- [${checked ? 'x' : ' '}] ${liText}`;
            }
            return `- ${liText}`;
          }
          return walk(child);
        });
        return items.filter(Boolean).join('\n') + '\n\n';
      }
      case 'ol': {
        const items = Array.from(el.children).map((child, idx) => {
          if (child.tagName.toLowerCase() === 'li') {
            const liText = Array.from(child.childNodes).map(walk).join('').trim();
            return `${idx + 1}. ${liText}`;
          }
          return walk(child);
        });
        return items.filter(Boolean).join('\n') + '\n\n';
      }
      case 'table': {
        const rows = Array.from(el.querySelectorAll('tr'));
        if (rows.length === 0) return '';
        const tableLines: string[] = [];

        rows.forEach((tr, rIdx) => {
          const cells = Array.from(tr.querySelectorAll('th, td'));
          const cellTexts = cells.map((c) =>
            Array.from(c.childNodes).map(walk).join('').trim().replace(/\|/g, '\\|')
          );
          tableLines.push(`| ${cellTexts.join(' | ')} |`);

          if (rIdx === 0 && (tr.querySelector('th') || rows.length > 1)) {
            tableLines.push(`| ${cellTexts.map(() => '---').join(' | ')} |`);
          }
        });
        return tableLines.join('\n') + '\n\n';
      }
      default:
        return childrenText;
    }
  }

  const result = Array.from(doc.body.childNodes).map(walk).join('');
  // Preserve intentional multiple blank lines, only cap runs longer than 6 newlines
  return result.trim().replace(/\n{7,}/g, '\n\n\n\n\n\n');
}
