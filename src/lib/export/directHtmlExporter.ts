/**
 * Direct Monolithic HTML Generator
 * Bypasses intermediate Jinja compiling, token schemas, and template placeholders.
 * Directly prompts Gemini with raw note markdown bodies to generate a single,
 * complete, interactive monolithic HTML application.
 */

import { GEMINI_CANDIDATE_MODELS } from './geminiTemplateGenerator';
import { markdownToHtml } from '@/src/lib/markdown/markdownToHtml';
import { parseFrontmatter } from '@/src/lib/markdown/frontmatter';
import { cleanWikiLinks } from './standaloneHtmlBuilder';

export interface DirectHtmlNote {
  title: string;
  content: string;
  path: string;
}

export interface DirectHtmlExportParams {
  folderName: string;
  notes: DirectHtmlNote[];
  userPrompt: string;
  apiKey: string;
}

export const DIRECT_HTML_MODELS = GEMINI_CANDIDATE_MODELS;

/**
 * Pre-compiles note bodies into clean HTML fragments with YAML frontmatter stripped.
 */
export function precompileNotesForDirectHtml(notes: DirectHtmlNote[]): DirectHtmlNote[] {
  return notes.map((note, index) => {
    const rawContent = note.content || '';
    const { data: frontmatter, content: cleanMarkdown } = parseFrontmatter(rawContent);
    const htmlBody = cleanWikiLinks(markdownToHtml(cleanMarkdown));
    const title =
      frontmatter.title ||
      note.title ||
      `Document ${index + 1}`;

    return {
      ...note,
      title,
      content: htmlBody,
    };
  });
}

/**
 * Formats note Markdown bodies into standard delimited document blocks.
 */
export function formatDocumentsPromptBlock(notes: DirectHtmlNote[]): string {
  return notes
    .map((note, index) => {
      const idx = index + 1;
      const title = note.title || `Document ${idx}`;
      return `=== DOCUMENT ${idx}: ${title} ===\n${note.content || ''}\n=== END DOCUMENT ===`;
    })
    .join('\n\n');
}

/**
 * Strips markdown codeblock wrappers and extracts the raw HTML string.
 */
export function stripHtmlMarkdownWrapper(rawText: string): string {
  let cleaned = rawText.trim();

  // Strip leading code fences
  cleaned = cleaned.replace(/^```(?:html|htm|xml)?\s*\n?/i, '');
  // Strip trailing code fences
  cleaned = cleaned.replace(/\n?```\s*$/i, '');
  cleaned = cleaned.trim();

  // Extract from <!doctype html> or <html if leading text exists
  const doctypeIndex = cleaned.search(/<!doctype\s+html>/i);
  if (doctypeIndex > 0) {
    cleaned = cleaned.substring(doctypeIndex);
  } else {
    const htmlIndex = cleaned.search(/<html[\s>]/i);
    if (htmlIndex > 0) {
      cleaned = cleaned.substring(htmlIndex);
    }
  }

  // Strip anything after </html>
  const closeHtmlIndex = cleaned.toLowerCase().lastIndexOf('</html>');
  if (closeHtmlIndex !== -1) {
    cleaned = cleaned.substring(0, closeHtmlIndex + 7);
  }

  return cleaned.trim();
}

/**
 * Directly generates a complete monolithic interactive HTML application using Gemini.
 */
export async function generateMonolithicHtmlExport(
  folderNameOrParams: string | DirectHtmlExportParams,
  notesArg?: DirectHtmlNote[],
  userPromptArg?: string,
  apiKeyArg?: string
): Promise<string> {
  const { folderName, notes, userPrompt, apiKey } =
    typeof folderNameOrParams === 'object'
      ? folderNameOrParams
      : {
          folderName: folderNameOrParams,
          notes: notesArg || [],
          userPrompt: userPromptArg || '',
          apiKey: apiKeyArg || '',
        };

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please provide a valid Gemini API key.');
  }

  if (!notes || notes.length === 0) {
    throw new Error('No documents provided for direct HTML export.');
  }

  const systemInstruction = `
You are an expert full-stack web developer.
Generate a SINGLE, PRODUCTION-GRADE, MONOLITHIC HTML FILE containing all embedded CSS (<style>) and client navigation (<script>).

CRITICAL ARCHITECTURE RULES:
1. STATIC DOM FIRST (NO RAW JS DATA ARRAYS):
   - DO NOT store note contents inside JavaScript string variables or arrays (e.g., do NOT do 'const docs = [{ content: \`...\` }]'). Raw text with quotes, backticks, or unescaped characters breaks JS parsing.
   - Render every single note DIRECTLY into semantic HTML markup inside the DOM:
     <div class="documents-container">
       <article id="doc-1" class="vault-doc-card" data-title="..." data-category="...">
         <header><h2>Note Title</h2></header>
         <div class="note-body">...Full Note HTML / Lyrics...</div>
       </article>
       ...
     </div>
   - Use JavaScript ONLY for UI behavior (filtering, searching, tab switching, or modal reading), targeting elements already present in the DOM.

2. COMPLETE CONTENT PRESERVATION:
   - Include 100% of the content from ALL provided files. Never truncate, summarize, or use ellipses.

3. RESILIENT INTERACTIVITY:
   - Ensure scripts execute immediately or on window 'load'.
   - Include global search that toggles display of existing DOM elements based on data attributes.
   - Provide clean dark-mode typography (Inter, JetBrains Mono) with 'text-align: left' and standard line-heights.

4. OUTPUT FORMAT:
   - Return ONLY raw <!DOCTYPE html> markup. Do NOT wrap in markdown triple backticks.
`;

  const precompiledNotes = precompileNotesForDirectHtml(notes);
  const formattedDocs = formatDocumentsPromptBlock(precompiledNotes);
  const userContent = `Application / Vault Name: ${folderName || 'CaffeineMD Export'}
Total Documents: ${precompiledNotes.length}

USER DESIGN & FEATURE PREFERENCES:
${userPrompt || 'Create a modern, elegant, dark glassmorphic single-page web app with sidebar navigation, search filter, and full document reading views.'}

DOCUMENTS TO EMBED:
${formattedDocs}

Generate the complete monolithic <!DOCTYPE html> now with all embedded styling, scripts, and zero truncation.`;

  let lastError: Error | null = null;

  for (const model of DIRECT_HTML_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey.trim()
      )}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemInstruction }],
          },
          contents: [
            {
              role: 'user',
              parts: [{ text: userContent }],
            },
          ],
          generationConfig: {
            temperature: 0.3,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || `Gemini API error: ${response.status} (${model})`;
        throw new Error(message);
      }

      const data = await response.json();
      const rawText: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!rawText) {
        throw new Error(`Empty response returned from ${model}`);
      }

      const finalHtml = stripHtmlMarkdownWrapper(rawText);
      if (!finalHtml.toLowerCase().includes('<html')) {
        throw new Error('Generated output did not contain valid HTML markup.');
      }

      return finalHtml;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (
        err.message &&
        (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid'))
      ) {
        throw lastError;
      }
      continue;
    }
  }

  throw lastError || new Error('Failed to generate monolithic HTML export with Gemini');
}
