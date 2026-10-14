import { GoogleGenAI, Type } from '@google/genai';

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

export const AI_THEME_CANDIDATE_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-pro',
];

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

  let generated: GeneratedThemePalette | null = null;

  // 1. Attempt client-side direct generation via @google/genai with cascading fallback
  try {
    const ai = new GoogleGenAI({ apiKey: trimmedKey });
    for (const model of AI_THEME_CANDIDATE_MODELS) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: `Design a cohesive theme palette based on this user vibe: "${trimmedPrompt}". Return JSON according to the schema.`,
          config: {
            systemInstruction: THEME_SYSTEM_INSTRUCTION,
            responseMimeType: 'application/json',
            responseSchema: THEME_RESPONSE_SCHEMA,
          },
        });

        const text = response.text;
        if (text) {
          generated = JSON.parse(text);
          break;
        }
      } catch (modelErr: unknown) {
        console.warn(`Direct model ${model} failed, trying next fallback:`, modelErr instanceof Error ? modelErr.message : modelErr);
      }
    }
  } catch (directErr) {
    console.warn('Direct client-side Gemini calls failed, attempting API route fallback:', directErr);
  }

  // 2. Fallback to /api/theme/generate route with apiKey in request body
  if (!generated) {
    const res = await fetch('/api/theme/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: trimmedPrompt, apiKey: trimmedKey }),
    });

    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      throw new Error(errJson.error || 'Failed to generate theme');
    }

    generated = await res.json();
  }

  if (!generated) {
    throw new Error('Failed to generate theme palette with Gemini.');
  }

  return generated;
}
