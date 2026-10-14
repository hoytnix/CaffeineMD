import { NextRequest, NextResponse } from 'next/server';
import { generateStructuredGeminiOutput } from '@/src/lib/ai/geminiClient';
import {
  THEME_SYSTEM_INSTRUCTION,
  THEME_RESPONSE_SCHEMA,
  AI_THEME_CANDIDATE_MODELS,
  GeneratedThemePalette,
} from '@/src/lib/themes/aiThemeService';

export async function POST(req: NextRequest) {
  try {
    const { prompt, apiKey } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'A theme description prompt is required.' },
        { status: 400 }
      );
    }

    const resolvedKey =
      (typeof apiKey === 'string' && apiKey.trim()) ||
      process.env.GEMINI_API_KEY ||
      '';

    if (!resolvedKey) {
      return NextResponse.json(
        { error: 'Gemini BYOK API key is required.' },
        { status: 400 }
      );
    }

    const result = await generateStructuredGeminiOutput<GeneratedThemePalette>({
      apiKey: resolvedKey,
      prompt: `Design a cohesive theme palette based on this user vibe: "${prompt.trim()}". Return JSON according to the schema.`,
      systemInstruction: THEME_SYSTEM_INSTRUCTION,
      responseSchema: THEME_RESPONSE_SCHEMA,
      candidateModels: AI_THEME_CANDIDATE_MODELS,
    });

    if (result.error || !result.data) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate theme with Gemini' },
        { status: 500 }
      );
    }

    return NextResponse.json(result.data);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to generate theme with Gemini';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
