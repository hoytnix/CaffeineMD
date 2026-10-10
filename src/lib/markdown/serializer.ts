import * as yaml from 'js-yaml';

export interface ParsedMarkdownNote {
  title: string;
  frontmatter: Record<string, any>;
  body: string;
  tags: string[];
  wikiLinks: Array<{
    target: string;
    alias?: string;
    raw: string;
  }>;
}

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Parses raw markdown text, extracting YAML frontmatter, tags, and WikiLinks
 */
export function parseMarkdownContent(rawText: string, fallbackTitle = 'Untitled'): ParsedMarkdownNote {
  let body = rawText;
  let frontmatter: Record<string, any> = {};
  const tagsSet = new Set<string>();

  // 1. Extract YAML frontmatter
  const match = rawText.match(FRONTMATTER_REGEX);
  if (match) {
    const yamlString = match[1];
    try {
      const parsed = yaml.load(yamlString);
      if (parsed && typeof parsed === 'object') {
        frontmatter = parsed as Record<string, any>;
      }
    } catch (err) {
      console.warn('Failed to parse YAML frontmatter:', err);
    }
    body = rawText.slice(match[0].length);
  }

  // 2. Extract tags from frontmatter
  if (Array.isArray(frontmatter.tags)) {
    frontmatter.tags.forEach((t: any) => {
      if (typeof t === 'string' && t.trim()) {
        tagsSet.add(t.trim().replace(/^#/, ''));
      }
    });
  } else if (typeof frontmatter.tags === 'string') {
    frontmatter.tags.split(',').forEach((t: string) => {
      if (t.trim()) tagsSet.add(t.trim().replace(/^#/, ''));
    });
  }

  // Also extract inline #hashtags from body
  const inlineTagMatches = body.matchAll(/(?:^|\s)#([a-zA-Z0-9_\-\/]+)(?=\s|$|[.,;:!?])/g);
  for (const tagMatch of inlineTagMatches) {
    if (tagMatch[1]) {
      tagsSet.add(tagMatch[1]);
    }
  }

  // 3. Extract WikiLinks: [[Target]] or [[Target|Alias]]
  const wikiLinks: Array<{ target: string; alias?: string; raw: string }> = [];
  const wikiLinkMatches = body.matchAll(/\[\[(.*?)\]\]/g);
  for (const wlMatch of wikiLinkMatches) {
    const rawContent = wlMatch[1]?.trim();
    if (!rawContent) continue;

    if (rawContent.includes('|')) {
      const [target, alias] = rawContent.split('|').map((s) => s.trim());
      wikiLinks.push({ target, alias, raw: wlMatch[0] });
    } else {
      wikiLinks.push({ target: rawContent, raw: wlMatch[0] });
    }
  }

  // 4. Determine title
  let title = fallbackTitle;
  if (frontmatter.title && typeof frontmatter.title === 'string') {
    title = frontmatter.title.trim();
  } else {
    // Try first H1 from markdown body: # Heading
    const firstH1 = body.match(/^#\s+(.*)$/m);
    if (firstH1 && firstH1[1]) {
      title = firstH1[1].trim();
    }
  }

  return {
    title,
    frontmatter,
    body,
    tags: Array.from(tagsSet),
    wikiLinks,
  };
}

/**
 * Re-serializes frontmatter and markdown body into standard raw file content
 */
export function serializeMarkdownWithFrontmatter(
  body: string,
  frontmatter: Record<string, any>
): string {
  const cleanFrontmatter: Record<string, any> = {};

  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== undefined && value !== null && value !== '') {
      cleanFrontmatter[key] = value;
    }
  }

  if (Object.keys(cleanFrontmatter).length === 0) {
    return body;
  }

  try {
    const yamlString = yaml.dump(cleanFrontmatter, {
      lineWidth: -1,
      forceQuotes: false,
    });
    return `---\n${yamlString.trim()}\n---\n\n${body.replace(/^\n+/, '')}`;
  } catch (e) {
    return body;
  }
}

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

/**
 * Convert markdown to simplified HTML for initial Tiptap document loading,
 * preserving WikiLinks, single line breaks (<br>), multiple consecutive blank lines,
 * and markdown tables.
 */
export function markdownToEditorHtml(markdown: string): string {
  if (!markdown || !markdown.trim()) return '<p></p>';

  // If already full HTML, just ensure wikilinks are preserved
  const isHtml = /^\s*<[a-z][\s\S]*>/i.test(markdown);
  if (isHtml) {
    return markdown.replace(/\[\[(.*?)\]\]/g, (_, inner) => {
      const parts = inner.split('|').map((s: string) => s.trim());
      const target = parts[0];
      const label = parts[1] || target;
      return `<span data-wikilink="${escapeHtml(target)}" class="wiki-link">[[${escapeHtml(label)}]]</span>`;
    });
  }

  // Pre-process WikiLinks: [[Target]] or [[Target|Alias]]
  const processed = markdown.replace(/\[\[(.*?)\]\]/g, (_, inner) => {
    const parts = inner.split('|').map((s: string) => s.trim());
    const target = parts[0];
    const label = parts[1] || target;
    return `<span data-wikilink="${escapeHtml(target)}" class="wiki-link">[[${escapeHtml(label)}]]</span>`;
  });

  const lines = processed.split(/\r?\n/);
  const htmlParts: string[] = [];

  let inUl = false;
  let inOl = false;
  let inTaskList = false;
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];
  let inBlockquote = false;
  let blockquoteLines: string[] = [];

  // Buffer for regular paragraph lines
  let currentParagraphLines: string[] = [];
  let consecutiveBlankLines = 0;

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      const pContent = currentParagraphLines
        .map((l) => formatInline(l))
        .join('<br>');
      htmlParts.push(`<p>${pContent}</p>`);
      currentParagraphLines = [];
    }
  };

  const flushBlockquote = () => {
    if (inBlockquote && blockquoteLines.length > 0) {
      const content = blockquoteLines
        .map((l) => formatInline(l))
        .join('<br>');
      htmlParts.push(`<blockquote><p>${content}</p></blockquote>`);
      blockquoteLines = [];
      inBlockquote = false;
    }
  };

  const closeLists = () => {
    if (inTaskList) {
      htmlParts.push('</ul>');
      inTaskList = false;
    }
    if (inUl) {
      htmlParts.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      htmlParts.push('</ol>');
      inOl = false;
    }
  };

  const closeAllBlocks = () => {
    flushParagraph();
    flushBlockquote();
    closeLists();
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Inside fenced code block
    if (inCodeBlock) {
      if (trimmed.startsWith('```')) {
        htmlParts.push(
          `<pre><code class="${codeBlockLang ? `language-${codeBlockLang}` : ''}">${escapeHtml(
            codeBlockLines.join('\n')
          )}</code></pre>`
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLang = '';
      } else {
        codeBlockLines.push(line);
      }
      continue;
    }

    // Fenced code block start
    if (trimmed.startsWith('```')) {
      closeAllBlocks();
      consecutiveBlankLines = 0;
      inCodeBlock = true;
      codeBlockLang = trimmed.slice(3).trim();
      codeBlockLines = [];
      continue;
    }

    // Blank line handling
    if (!trimmed) {
      closeAllBlocks();
      consecutiveBlankLines++;
      // If there are 2 or more consecutive blank lines, each extra blank line
      // represents an intentional empty line in the document
      if (consecutiveBlankLines >= 2) {
        htmlParts.push('<p><br></p>');
      }
      continue;
    }

    // Reset blank lines counter when a non-empty line is found
    consecutiveBlankLines = 0;

    // Horizontal rule: --- or *** or ___
    if (/^(---|___|\*\*\*)$/.test(trimmed)) {
      closeAllBlocks();
      htmlParts.push('<hr>');
      continue;
    }

    // Headings: #, ##, ###, ####, #####, ######
    const hMatch = trimmed.match(/^(#{1,6})\s+(.*)$/);
    if (hMatch) {
      closeAllBlocks();
      const level = hMatch[1].length;
      const content = formatInline(hMatch[2]);
      htmlParts.push(`<h${level}>${content}</h${level}>`);
      continue;
    }

    // Blockquote: >
    const bqMatch = trimmed.match(/^>\s*(.*)$/);
    if (bqMatch) {
      flushParagraph();
      closeLists();
      inBlockquote = true;
      blockquoteLines.push(bqMatch[1]);
      continue;
    } else if (inBlockquote) {
      flushBlockquote();
    }

    // Task list checkbox: - [ ] or - [x]
    const taskMatch = trimmed.match(/^-\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      flushParagraph();
      if (inUl) { htmlParts.push('</ul>'); inUl = false; }
      if (inOl) { htmlParts.push('</ol>'); inOl = false; }
      if (!inTaskList) {
        htmlParts.push('<ul data-type="taskList">');
        inTaskList = true;
      }
      const checked = taskMatch[1].toLowerCase() === 'x';
      htmlParts.push(
        `<li data-type="taskItem" data-checked="${checked}"><p>${formatInline(taskMatch[2])}</p></li>`
      );
      continue;
    }

    // Bullet list: - or *
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      flushParagraph();
      if (inTaskList) { htmlParts.push('</ul>'); inTaskList = false; }
      if (inOl) { htmlParts.push('</ol>'); inOl = false; }
      if (!inUl) {
        htmlParts.push('<ul>');
        inUl = true;
      }
      htmlParts.push(`<li><p>${formatInline(ulMatch[1])}</p></li>`);
      continue;
    }

    // Numbered list: 1.
    const olMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (olMatch) {
      flushParagraph();
      if (inTaskList) { htmlParts.push('</ul>'); inTaskList = false; }
      if (inUl) { htmlParts.push('</ul>'); inUl = false; }
      if (!inOl) {
        htmlParts.push('<ol>');
        inOl = true;
      }
      htmlParts.push(`<li><p>${formatInline(olMatch[1])}</p></li>`);
      continue;
    }

    // Markdown Table: | col | col |
    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      closeAllBlocks();
      const tableRows: string[] = [trimmed];
      while (
        i + 1 < lines.length &&
        lines[i + 1].trim().startsWith('|') &&
        lines[i + 1].trim().endsWith('|')
      ) {
        i++;
        tableRows.push(lines[i].trim());
      }
      const parsedTable = parseMarkdownTableToHtml(tableRows);
      if (parsedTable) {
        htmlParts.push(parsedTable);
        continue;
      }
    }

    // Regular paragraph content:
    // Close lists/blockquotes if transitioning to a paragraph
    closeLists();
    flushBlockquote();
    currentParagraphLines.push(trimmed);
  }

  closeAllBlocks();

  if (inCodeBlock && codeBlockLines.length > 0) {
    htmlParts.push(
      `<pre><code class="${codeBlockLang ? `language-${codeBlockLang}` : ''}">${escapeHtml(
        codeBlockLines.join('\n')
      )}</code></pre>`
    );
  }

  return htmlParts.join('') || '<p></p>';
}

function parseMarkdownTableToHtml(rows: string[]): string {
  if (rows.length === 0) return '';
  let html = '<table><tbody>';
  let isHeader = true;

  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    // Skip divider row like | --- | --- |
    if (/^\|(\s*[:-]+[-| :]*)\|$/.test(row)) {
      continue;
    }
    const cells = row
      .slice(1, -1)
      .split('|')
      .map((c) => c.trim());

    html += '<tr>';
    for (const cell of cells) {
      const tag = isHeader && r === 0 ? 'th' : 'td';
      html += `<${tag}><p>${formatInline(cell)}</p></${tag}>`;
    }
    html += '</tr>';
    if (r === 0) isHeader = false;
  }

  html += '</tbody></table>';
  return html;
}

function formatInline(text: string): string {
  // Bold **text**
  let res = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  res = res.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>');
  // Strikethrough ~~text~~
  res = res.replace(/~~(.+?)~~/g, '<s>$1</s>');
  // Markdown links [label](url)
  res = res.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
  // Inline code `code`
  res = res.replace(/`([^`]+)`/g, '<code>$1</code>');
  return res;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
