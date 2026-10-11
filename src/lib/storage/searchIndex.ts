import { VaultFile } from './schema';

/**
 * Tokenize text into lowercase alphanumeric tokens
 */
export function tokenizeText(text: string): string[] {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_\-]/gu, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 0);
}

/**
 * Generate character or word n-grams for fuzzy sub-token matching
 */
export function generateNGrams(text: string, n = 3): string[] {
  const clean = text.toLowerCase().trim();
  if (clean.length < n) return [clean];
  const ngrams: string[] = [];
  for (let i = 0; i <= clean.length - n; i++) {
    ngrams.push(clean.substring(i, i + n));
  }
  return ngrams;
}

/**
 * Score a single document against query tokens with field weighting:
 * - Exact title match: 100 points
 * - Title token match: 40 points
 * - Tag match: 30 points
 * - Content token match: 5 points
 */
export function scoreDocument(
  queryTokens: string[],
  note: VaultFile
): number {
  if (queryTokens.length === 0) return 0;

  const titleLower = (note.title || note.name || '').toLowerCase();
  const titleTokens = tokenizeText(titleLower);
  const tagsLower = (note.tags || []).map((t) => t.toLowerCase());
  const contentLower = (note.content || '').toLowerCase();

  let score = 0;

  for (const qToken of queryTokens) {
    // Exact title phrase match
    if (titleLower === qToken) {
      score += 100;
    } else if (titleLower.includes(qToken)) {
      score += 50;
    }

    // Title token match
    if (titleTokens.includes(qToken)) {
      score += 40;
    }

    // Tag match
    if (tagsLower.includes(qToken) || tagsLower.some((t) => t.includes(qToken))) {
      score += 30;
    }

    // Content match
    if (contentLower.includes(qToken)) {
      score += 5;
    }
  }

  return score;
}

/**
 * Query a collection of notes with token scoring and sort by highest relevance
 */
export function searchNotesQuery(
  query: string,
  notes: VaultFile[]
): VaultFile[] {
  const trimmed = query.trim();
  if (!trimmed) return notes;

  const queryTokens = tokenizeText(trimmed);
  if (queryTokens.length === 0) return notes;

  const scored: Array<{ note: VaultFile; score: number }> = [];

  for (const note of notes) {
    if (note.isTrash) continue;
    const score = scoreDocument(queryTokens, note);
    if (score > 0) {
      scored.push({ note, score });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || b.note.updatedAt - a.note.updatedAt)
    .map((s) => s.note);
}
