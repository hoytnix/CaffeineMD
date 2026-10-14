import { Editor } from '@tiptap/react';
import { saveAsset, getCachedAssetUrl } from '@/src/lib/storage/repositories/assetRepository';
import { markdownToHtml } from './markdownToHtml';
import { detectCodeLanguage } from './codeLanguageDetector';
import { escapeHtml } from './markdownInline';

export interface SmartPasteResult {
  type: string;
  label: string;
}

function parseDelimitedRow(row: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (char === '"' || char === "'") {
      if (inQuotes && row[i + 1] === char) {
        current += char;
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

function buildTableHtml(headers: string[], rows: string[][]): string {
  let html = '<table class="border-collapse table-auto w-full"><tbody><tr>';
  headers.forEach((h) => { html += `<th><p>${escapeHtml(h)}</p></th>`; });
  html += '</tr>';
  rows.forEach((row) => {
    html += '<tr>';
    row.forEach((val) => { html += `<td><p>${escapeHtml(val)}</p></td>`; });
    html += '</tr>';
  });
  return html + '</tbody></table>';
}

/**
 * Execute smart paste by auto-detecting clipboard media, structured data,
 * tables, code, links, or markdown and inserting it into Tiptap.
 */
export async function executeSmartPaste(editor: Editor): Promise<SmartPasteResult> {
  // Step 1: Check for Clipboard Images
  if (typeof navigator !== 'undefined' && navigator.clipboard?.read) {
    try {
      const items = await navigator.clipboard.read();
      for (const item of items) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const ext = imageType.split('/')[1] || 'png';
          const file = new File([blob], `pasted-${Date.now()}.${ext}`, { type: imageType });
          const asset = await saveAsset(file);
          const objectUrl = getCachedAssetUrl(asset.path) || URL.createObjectURL(blob);
          editor.chain().focus().insertContent(`<img src="${objectUrl}" alt="Pasted Image" data-asset-id="${asset.id}" />`).run();
          return { type: 'image', label: 'Image' };
        }
      }
    } catch {
      // Fall through to text
    }
  }

  // Step 2: Read Clipboard Text
  let text = '';
  try {
    text = (await navigator.clipboard.readText()).trim();
  } catch {
    return { type: 'empty', label: 'Empty Clipboard' };
  }
  if (!text) return { type: 'empty', label: 'Empty Clipboard' };

  // Step 3: Priority Routing

  // 1. Single URL
  if (/^https?:\/\/\S+$/i.test(text)) {
    if (/\.(png|jpe?g|gif|webp|svg|avif)(\?.*)?$/i.test(text)) {
      editor.chain().focus().insertContent(`<img src="${text}" alt="Image" />`).run();
      return { type: 'image-url', label: 'Image URL' };
    }
    if (!editor.state.selection.empty) {
      (editor.chain().focus() as any).setLink?.({ href: text }).run();
      return { type: 'link', label: 'Link Applied' };
    }
    editor.chain().focus().insertContent(`<a href="${text}" target="_blank" rel="noopener noreferrer">${text}</a>`).run();
    return { type: 'link', label: 'Link' };
  }

  // 2. JSON Data
  if (text.startsWith('{') || text.startsWith('[')) {
    try {
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed) && parsed.length > 0 && typeof parsed[0] === 'object' && parsed[0] !== null && !Array.isArray(parsed[0])) {
        const keysSet = new Set<string>();
        parsed.forEach((item) => { if (item && typeof item === 'object') Object.keys(item).forEach((k) => keysSet.add(k)); });
        const headers = Array.from(keysSet);
        if (headers.length > 0) {
          const rows = parsed.map((item) => headers.map((h) => {
            const raw = item ? (item as any)[h] : '';
            return raw !== undefined && raw !== null ? (typeof raw === 'object' ? JSON.stringify(raw) : String(raw)) : '';
          }));
          editor.chain().focus().insertContent(buildTableHtml(headers, rows)).run();
          return { type: 'table-json', label: 'JSON Table' };
        }
      }
      const formatted = JSON.stringify(parsed, null, 2);
      editor.chain().focus().insertContent(`<pre><code class="language-json">${escapeHtml(formatted)}</code></pre>`).run();
      return { type: 'code-json', label: 'JSON' };
    } catch {
      // Continue to next detector
    }
  }

  // 3. Markdown Table
  if (/^\|.+\|\s*\n\|[\s:|-]+\|/m.test(text)) {
    editor.chain().focus().insertContent(markdownToHtml(text)).run();
    return { type: 'table-markdown', label: 'Markdown Table' };
  }

  // 4. CSV / TSV Tabular Data
  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length >= 2) {
    const delimiter = rawLines.every((l) => l.includes('\t')) ? '\t' : rawLines.every((l) => l.includes(',')) ? ',' : null;
    if (delimiter) {
      const rows = rawLines.map((line) => parseDelimitedRow(line, delimiter));
      const colCounts = rows.map((r) => r.length);
      if (colCounts.every((c) => c > 1 && c === colCounts[0]) && colCounts[0] >= 2) {
        const [headers, ...bodyRows] = rows;
        editor.chain().focus().insertContent(buildTableHtml(headers, bodyRows)).run();
        return { type: 'table-csv', label: delimiter === '\t' ? 'TSV Table' : 'CSV Table' };
      }
    }
  }

  // 5. Structured Markdown
  const isMarkdown =
    /^#{1,6}\s+/m.test(text) ||
    /^-\s+\[[ xX]\]\s+/m.test(text) ||
    /^>\s+/m.test(text) ||
    /```/.test(text) ||
    /\[\[.+?\]\]/.test(text) ||
    /(\*\*|__)[^\s].+?(\*\*|__)/.test(text);

  if (isMarkdown) {
    editor.chain().focus().insertContent(markdownToHtml(text)).run();
    return { type: 'markdown', label: 'Markdown' };
  }

  // 6. Source Code
  const detectedLang = detectCodeLanguage(text);
  if (detectedLang && detectedLang !== 'plaintext') {
    editor.chain().focus().insertContent(`<pre><code class="language-${detectedLang}">${escapeHtml(text)}</code></pre>`).run();
    return { type: 'code', label: `${detectedLang.toUpperCase()} Code` };
  }

  // 7. Plain Text Fallback
  editor.chain().focus().insertContent(escapeHtml(text)).run();
  return { type: 'text', label: 'Plain Text' };
}
