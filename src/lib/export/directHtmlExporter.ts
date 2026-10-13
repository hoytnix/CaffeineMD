/**
 * Direct Monolithic HTML Generator
 * Bypasses intermediate Jinja compiling, token schemas, and template placeholders.
 * Directly prompts Gemini with raw note markdown bodies to generate a single,
 * complete, interactive monolithic HTML application.
 */

import { GEMINI_CANDIDATE_MODELS } from './geminiTemplateGenerator';

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

  const systemInstruction = `You are a world-class principal frontend architect and creative UI engineer.
Given a collection of markdown documents and a design prompt, you synthesize a single, gorgeous, production-grade, monolithic HTML application with zero external framework dependencies.

STRICT MONOLITHIC SPECIFICATION:
1. OUTPUT FORMAT:
   - Output ONLY raw HTML starting with <!DOCTYPE html> and closing with </html>.
   - Do NOT wrap your output in markdown code blocks (\`\`\`html).
   - Do NOT provide preambles, explanations, summaries, or postscripts.
2. EMBEDDED ARCHITECTURE:
   - All styling must be embedded inside a <style> block in <head>.
   - All client-side interactivity (navigation tabs, sidebar switching, search filter, theme toggle, copy buttons) must be embedded inside a <script> block before </body>.
   - Design with modern glassmorphism, responsive flex/grid layouts, clean typographic hierarchy, and polished micro-interactions.
3. STRICT ZERO TRUNCATION RULE (CRITICAL):
   - Every single document's full body, headings, paragraphs, lists, tables, code blocks, lyrics, and metadata must be fully and completely rendered in the DOM.
   - NEVER truncate, summarize, omit, or use placeholder tokens like "..." or "<!-- more content -->".
   - If there are multiple documents, provide an intuitive navigation structure (e.g., sidebar nav, tabs, or cards) allowing the user to view each complete document cleanly.
4. USER THEME & STYLE:
   - Strictly honor the user's styling, aesthetic, layout, and feature instructions.`;

  const formattedDocs = formatDocumentsPromptBlock(notes);
  const userContent = `Application / Vault Name: ${folderName || 'CaffeineMD Export'}
Total Documents: ${notes.length}

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
