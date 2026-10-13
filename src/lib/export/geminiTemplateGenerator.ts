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
Requirements:
1. Include modern CSS inside an inlined <style> tag. Design style: ${themeStyle}.
2. Use Jinja placeholders:
   - {{ title }} for the page heading and document <title>
   - {{ content }} for the rendered Markdown article HTML
   - {{ date }} and {{ reading_time }} for metadata pills
   - {% if is_pwa %}<link rel="manifest" href="./manifest.webmanifest"><script>if('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js');</script>{% endif %}
${isMultiPage ? '   - Include an offline navigation drawer/sidebar: {% for page in pages %}<a href="{{ page.url }}">{{ page.title }}</a>{% endfor %}' : ''}
3. Responsive layout (max-width 880px for reading), exquisite typography, styled blockquotes, tables, and pre/code blocks.
4. Output ONLY valid raw HTML/Jinja template code. No explanations, no markdown code fences.`;

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

      // Ensure mandatory content placeholder exists
      if (!generatedHtml.includes('{{ content }}') && !generatedHtml.includes('{{content}}')) {
        if (generatedHtml.includes('</body>')) {
          generatedHtml = generatedHtml.replace(
            '</body>',
            '<main class="content">{{ content }}</main>\n</body>'
          );
        } else {
          generatedHtml += '\n<main class="content">{{ content }}</main>';
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
