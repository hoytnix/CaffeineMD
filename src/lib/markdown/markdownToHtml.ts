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

export function formatInline(text: string): string {
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

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
