import { GoogleGenAI, type Schema } from '@google/genai';
import { z } from 'zod';

export const DEFAULT_GEMINI_MODELS = [
  'gemini-3.5-flash-lite',
  'gemini-3.8-flash',
  'gemini-3.7-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-pro',
];

export interface GeminiStructuredRequest<T> {
  apiKey: string;
  prompt: string;
  systemInstruction?: string;
  responseSchema?: Schema;
  zodValidator?: z.ZodType<T>;
  model?: string;
  candidateModels?: string[];
  temperature?: number;
}

export function cleanJsonResponse(rawText: string): string {
  if (!rawText) return '';
  return rawText
    .replace(/^```(?:json)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();
}

export async function generateStructuredGeminiOutput<T>({
  apiKey,
  prompt,
  systemInstruction,
  responseSchema,
  zodValidator,
  model,
  candidateModels,
  temperature,
}: GeminiStructuredRequest<T>): Promise<{ data: T | null; error: string | null }> {
  const trimmedKey = apiKey?.trim();
  if (!trimmedKey) {
    return { data: null, error: 'Gemini BYOK API key is required.' };
  }

  const modelsToTry = model ? [model] : candidateModels || DEFAULT_GEMINI_MODELS;
  let lastError: unknown = null;

  try {
    const ai = new GoogleGenAI({
      apiKey: trimmedKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });

    for (const currentModel of modelsToTry) {
      try {
        const response = await ai.models.generateContent({
          model: currentModel,
          contents: prompt,
          config: {
            ...(systemInstruction ? { systemInstruction } : {}),
            responseMimeType: 'application/json',
            ...(responseSchema ? { responseSchema } : {}),
            ...(temperature !== undefined ? { temperature } : {}),
          },
        });

        const rawText = cleanJsonResponse(response.text ?? '');
        if (!rawText) continue;

        const parsed = JSON.parse(rawText);
        const data = zodValidator ? zodValidator.parse(parsed) : (parsed as T);
        return { data, error: null };
      } catch (err) {
        lastError = err;
        console.warn(`Gemini model ${currentModel} failed, trying fallback:`, err instanceof Error ? err.message : err);
      }
    }
  } catch (err) {
    lastError = err;
  }

  const message = lastError instanceof Error ? lastError.message : 'Gemini structured generation failed';
  return { data: null, error: message };
}
