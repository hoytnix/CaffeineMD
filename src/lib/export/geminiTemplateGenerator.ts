export interface GenerateThemeOptions {
  apiKey: string;
  prompt: string;
  themeStyle?: string;
  isMultiPage?: boolean;
}

export const GEMINI_CANDIDATE_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.5-flash-lite',
  'gemini-3.1-pro',
];

export async function generateJinjaThemeWithGemini(
  options: GenerateThemeOptions
): Promise<string> {
  const { apiKey, prompt, themeStyle = 'modern dark glassmorphism', isMultiPage = false } = options;

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please provide a valid Gemini API key.');
  }

  const systemInstruction = `You are an elite frontend UI/UX designer. Create a single-file, production-grade Jinja2 HTML template for an offline-first PWA and standalone document reader.

Aesthetic Style: ${themeStyle}

STRICT ARCHITECTURE & DOM RULES:
1. Exactly ONE <main> container and ONE <article> container for the whole document:
   <main class="site-container">
     <header class="doc-header">
       <h1>{{ title }}</h1>
       <div class="meta-pills">
         <span>{{ date }}</span>
         <span>{{ reading_time }}</span>
       </div>
     </header>
     <article class="article-content">
       {{ content }}
     </article>
   </main>
2. CRITICAL: The placeholder token "{{ content }}" MUST be the ONLY contents inside the <article class="article-content"> element. NEVER output dummy paragraphs, mock markdown, or sample article text. NEVER output multiple <main> elements or duplicate document bodies.
3. Jinja Placeholders:
   - {{ title }} for document <title> and header <h1>
   - {{ content }} for the markdown article HTML
   - {{ date }} and {{ reading_time }} for metadata pills
   - {% if is_pwa %}<link rel="manifest" href="./manifest.webmanifest"><script>if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');</script>{% endif %}
${isMultiPage ? '   - Navigation sidebar/drawer: {% for page in pages %}<a href="{{ page.url }}">{{ page.title }}</a>{% endfor %}' : ''}

TYPOGRAPHY & LAYOUT GUARDRAILS (STRICT):
1. Font Stacks: Use ONLY clean, modern sans-serif or technical monospace fonts:
   - Body & Headings: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
   - Monospace: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
   - FORBIDDEN: Strictly FORBID exotic serif fonts (such as "Zen Old Mincho", "Noto Serif JP", Mincho, or decorative serif fonts).
2. Layout & Spacing:
   - Mandate text-align: left; and line-height: 1.6; across the body and article.
   - FORBIDDEN: Strictly FORBID text-justify: inter-ideograph, text justification, or line-heights exceeding 1.75.
   - Max-width of reading container must be 840px-880px.

MANDATORY COMPONENT CSS:
Include comprehensive styling inside an inlined <style> tag:
1. .wiki-link:
   - Accent text color, subtle background pill (e.g., padding: 0.1em 0.4em; border-radius: 4px; background: rgba(99, 102, 241, 0.12); display: inline; text-decoration: none;)
   - hover: text-decoration: underline; background: rgba(99, 102, 241, 0.22);
2. .editor-image:
   - max-width: 100%; height: auto; border-radius: 8px; margin: 1.5rem 0; display: block; border: 1px solid rgba(255, 255, 255, 0.1);
3. Dark-mode glassmorphic surfaces with clean borders:
   - Pre/code blocks: Frosted glass background, rounded-lg, 1px border, scrollable.
   - Blockquotes: Accent left border (3px solid), soft card background, rounded-r.
   - Tables: Full-width, border-collapse, subtle border lines, alternating or styled header.
   - Callouts: Clean rounded border with icon badge.

OUTPUT INSTRUCTION:
Output ONLY valid raw HTML/Jinja template code. No explanations, no markdown code fences.`;

  let lastError: Error | null = null;

  for (const model of GEMINI_CANDIDATE_MODELS) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey.trim()
      )}`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemInstruction}\n\nUser Theme Design Request: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || `Gemini API error: ${response.status} (${model})`;
        throw new Error(message);
      }

      const data = await response.json();
      let generatedHtml: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!generatedHtml) {
        throw new Error(`Empty response returned from ${model}`);
      }

      // Strip potential markdown code block wrappers
      generatedHtml = generatedHtml
        .replace(/^```(?:html|jinja|htm)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

      // Normalize any <!-- CONTENT --> or {{ content | safe }} to {{ content }}
      generatedHtml = generatedHtml
        .replace(/<!--\s*CONTENT\s*-->/gi, '{{ content }}')
        .replace(/{{\s*content\s*\|\s*safe\s*}}/gi, '{{ content }}');

      // Ensure mandatory content placeholder exists without ever creating duplicate <main> containers
      if (!generatedHtml.includes('{{ content }}') && !generatedHtml.includes('{{content}}')) {
        if (/<article[^>]*>[\s\S]*?<\/article>/i.test(generatedHtml)) {
          // Replace dummy article body with the single token
          generatedHtml = generatedHtml.replace(
            /(<article[^>]*>)[\s\S]*?(<\/article>)/i,
            '$1\n      {{ content }}\n    $2'
          );
        } else if (/<main[^>]*>[\s\S]*?<\/main>/i.test(generatedHtml)) {
          generatedHtml = generatedHtml.replace(
            /(<main[^>]*>)[\s\S]*?(<\/main>)/i,
            '$1\n      {{ content }}\n    $2'
          );
        } else if (generatedHtml.includes('</body>')) {
          generatedHtml = generatedHtml.replace(
            '</body>',
            '<main class="site-container">\n  <article class="article-content">{{ content }}</article>\n</main>\n</body>'
          );
        } else {
          generatedHtml += '\n<main class="site-container">\n  <article class="article-content">{{ content }}</article>\n</main>';
        }
      }

      return generatedHtml;
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      // If unauthorized / invalid key, fail fast without cascade
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid'))) {
        throw lastError;
      }
      // Cascade down to next model if this attempt fails
      continue;
    }
  }

  throw lastError || new Error('Failed to generate template with Gemini');
}
