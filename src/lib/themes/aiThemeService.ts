import { Type } from '@google/genai';
import { generateStructuredGeminiOutput, DEFAULT_GEMINI_MODELS } from '@/src/lib/ai/geminiClient';

export interface GeneratedThemePalette {
  name: string;
  background: string;
  foreground: string;
  card: string;
  accent: string;
  border: string;
  fontFamily: string;
  primary?: string;
  fontFamilyGoogleUrl?: string;
  backgroundImageUrl?: string;
}

export const THEME_SYSTEM_INSTRUCTION = `You are a world-class UI color palette and typography designer specializing in dark/light minimalist IDE and knowledge base themes like Obsidian, VS Code, and Linear.
Given a theme vibe description, generate a gorgeous, high-contrast, fully cohesive color palette.
Ensure that:
- background and foreground have high contrast (WCAG AAA compliant readability for text).
- card is slightly lighter than background (if dark) or slightly softer (if light).
- border complements the card and background with subtle delineation.
- accent provides a distinct, striking highlight color.
- all colors must be valid 6-character hex codes (e.g. #1e1e24).
- fontFamily should be a clean, modern web font (e.g. Inter, 'JetBrains Mono', 'Fira Code', 'Outfit', 'Plus Jakarta Sans', 'Cinzel', 'Playfair Display').`;

export const THEME_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    name: {
      type: Type.STRING,
      description: 'A creative title for this theme (2-4 words)',
    },
    background: {
      type: Type.STRING,
      description: 'Hex color for page background e.g. #0a0b10',
    },
    foreground: {
      type: Type.STRING,
      description: 'Hex color for primary text e.g. #f3f4f6',
    },
    card: {
      type: Type.STRING,
      description: 'Hex color for card/panel container background e.g. #141622',
    },
    accent: {
      type: Type.STRING,
      description: 'Hex color for accent buttons, active tabs, and highlights e.g. #6366f1',
    },
    border: {
      type: Type.STRING,
      description: 'Hex color for borders and dividers e.g. #282b3d',
    },
    fontFamily: {
      type: Type.STRING,
      description: 'CSS font family stack e.g. Inter, sans-serif or "JetBrains Mono", monospace',
    },
    fontFamilyGoogleUrl: {
      type: Type.STRING,
      description: 'Optional Google Fonts CSS URL if using a custom web font',
    },
    backgroundImageUrl: {
      type: Type.STRING,
      description: 'Optional subtle abstract ambient backdrop image URL from unsplash',
    },
  },
  required: ['name', 'background', 'foreground', 'card', 'accent', 'border', 'fontFamily'],
};

export const AI_THEME_CANDIDATE_MODELS = DEFAULT_GEMINI_MODELS;

export async function generateAiThemePalette(
  prompt: string,
  apiKey: string
): Promise<GeneratedThemePalette> {
  const trimmedKey = apiKey.trim();
  const trimmedPrompt = prompt.trim();

  if (!trimmedKey) {
    throw new Error('Gemini BYOK API key is required.');
  }
  if (!trimmedPrompt) {
    throw new Error('A theme description prompt is required.');
  }

  // 1. Attempt client-side direct generation via unified geminiClient
  const directResult = await generateStructuredGeminiOutput<GeneratedThemePalette>({
    apiKey: trimmedKey,
    prompt: `Design a cohesive theme palette based on this user vibe: "${trimmedPrompt}". Return JSON according to the schema.`,
    systemInstruction: THEME_SYSTEM_INSTRUCTION,
    responseSchema: THEME_RESPONSE_SCHEMA,
    candidateModels: AI_THEME_CANDIDATE_MODELS,
  });

  if (directResult.data) {
    return directResult.data;
  }

  // 2. Fallback to /api/theme/generate route with apiKey in request body
  const res = await fetch('/api/theme/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: trimmedPrompt, apiKey: trimmedKey }),
  });

  if (!res.ok) {
    const errJson = await res.json().catch(() => ({}));
    throw new Error(errJson.error || directResult.error || 'Failed to generate theme');
  }

  const generated = await res.json();
  if (!generated) {
    throw new Error('Failed to generate theme palette with Gemini.');
  }

  return generated;
}
