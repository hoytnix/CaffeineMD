import {
  ThemeDesignTokens,
  DEFAULT_THEME_TOKENS,
  sanitizeThemeTokens,
  buildAuditedThemeTemplate,
} from './themeTokens';
import { generateStructuredGeminiOutput, DEFAULT_GEMINI_MODELS } from '@/src/lib/ai/geminiClient';
import { storageRegistry, STORAGE_KEYS } from '@/src/lib/config/storageRegistry';

export type { ThemeDesignTokens };
export {
  DEFAULT_THEME_TOKENS,
  sanitizeThemeTokens,
  buildAuditedThemeTemplate,
};

export function getGeminiApiKey(): string {
  return storageRegistry.getItem(STORAGE_KEYS.GEMINI_API_KEY);
}

export interface GenerateThemeOptions {
  apiKey: string;
  prompt: string;
  themeStyle?: string;
  isMultiPage?: boolean;
}

export const GEMINI_CANDIDATE_MODELS = DEFAULT_GEMINI_MODELS;

const GEMINI_THEME_SYSTEM_INSTRUCTION = `You are an elite color theory and UI design specialist.
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

export async function generateThemeTokensWithGemini(
  options: GenerateThemeOptions
): Promise<ThemeDesignTokens> {
  const { apiKey, prompt, themeStyle = 'modern dark glassmorphism' } = options;

  if (!apiKey || !apiKey.trim()) {
    throw new Error('Please provide a valid Gemini API key.');
  }

  const result = await generateStructuredGeminiOutput<Record<string, unknown>>({
    apiKey,
    prompt: `Design Style: ${themeStyle}\nUser Prompt: ${prompt}`,
    systemInstruction: GEMINI_THEME_SYSTEM_INSTRUCTION,
    candidateModels: GEMINI_CANDIDATE_MODELS,
    temperature: 0.6,
  });

  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to generate theme design tokens with Gemini');
  }

  return sanitizeThemeTokens(result.data);
}

export async function generateJinjaThemeWithGemini(
  options: GenerateThemeOptions
): Promise<string> {
  const tokens = await generateThemeTokensWithGemini(options);
  return buildAuditedThemeTemplate(tokens, options.isMultiPage);
}
