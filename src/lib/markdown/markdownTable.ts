import { formatInline } from './markdownInline';

/**
 * Parses markdown table rows (| col | col |) into HTML table representation.
 */
export function parseMarkdownTableToHtml(rows: string[]): string {
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
