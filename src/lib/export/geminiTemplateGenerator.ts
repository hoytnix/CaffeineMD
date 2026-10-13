import {
  ThemeDesignTokens,
  DEFAULT_THEME_TOKENS,
  sanitizeThemeTokens,
  buildAuditedThemeTemplate,
} from './themeTokens';

export type { ThemeDesignTokens };
export {
  DEFAULT_THEME_TOKENS,
  sanitizeThemeTokens,
  buildAuditedThemeTemplate,
};

export interface GenerateThemeOptions {
  apiKey: string;
  prompt: string;
  themeStyle?: string;
  isMultiPage?: boolean;
}

export const GEMINI_CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
];

export async function generateThemeTokensWithGemini(
  options: GenerateThemeOptions
): Promise<ThemeDesignTokens> {
  const { apiKey, prompt, themeStyle = 'modern dark glassmorphism' } = options;

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please provide a valid Gemini API key.');
  }

  const systemInstruction = `You are an elite color theory and UI design specialist.
Given a design style request, return a strict JSON object specifying theme color and design tokens.
DO NOT generate raw HTML, CSS style blocks, or explanatory text.
DO NOT use exotic serif fonts (such as Zen Old Mincho or decorative typefaces).

Required JSON Schema:
{
  "themeName": string (concise creative name),
  "bgBase": string (hex/hsl for root page background),
  "surfaceGlass": string (rgba for glassmorphic cards and sidebar),
  "surfaceHover": string (rgba for interactive hover state),
  "borderGlass": string (rgba for subtle frosted glass borders),
  "borderGlow": string (rgba for active glowing borders),
  "accentPrimary": string (hex/hsl high-contrast primary accent),
  "accentSecondary": string (hex/hsl complementary accent),
  "accentGlow": string (rgba soft glow for pills and wikilinks),
  "textMain": string (hex/hsl primary body text color),
  "textMuted": string (hex/hsl secondary and metadata text),
  "textBright": string (hex/hsl bright heading and highlight text),
  "fontSans": string (sans-serif stack, must default to "Inter, system-ui, sans-serif"),
  "fontMono": string (monospace stack, must default to "'JetBrains Mono', monospace")
}`;

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
              parts: [{ text: `${systemInstruction}\n\nDesign Style: ${themeStyle}\nUser Prompt: ${prompt}` }],
            },
          ],
          generationConfig: {
            temperature: 0.6,
            responseMimeType: 'application/json',
            maxOutputTokens: 2048,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message = errorData.error?.message || `Gemini API error: ${response.status} (${model})`;
        throw new Error(message);
      }

      const data = await response.json();
      let rawJsonText: string = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!rawJsonText) {
        throw new Error(`Empty response returned from ${model}`);
      }

      rawJsonText = rawJsonText
        .replace(/^```(?:json)?\s*\n?/i, '')
        .replace(/\n?```\s*$/i, '')
        .trim();

      const parsed = JSON.parse(rawJsonText);
      return sanitizeThemeTokens(parsed);
    } catch (err: any) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid'))) {
        throw lastError;
      }
      continue;
    }
  }

  throw lastError || new Error('Failed to generate theme design tokens with Gemini');
}

export async function generateJinjaThemeWithGemini(
  options: GenerateThemeOptions
): Promise<string> {
  const tokens = await generateThemeTokensWithGemini(options);
  return buildAuditedThemeTemplate(tokens, options.isMultiPage);
}
