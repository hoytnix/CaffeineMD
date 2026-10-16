import * as yaml from 'js-yaml';
import type { EisenhowerQuadrant } from '../storage/db';

export interface NoteProperties {
  title: string;
  tags: string[];
  status: 'Draft' | 'In Progress' | 'Completed' | 'Archived' | string;
  author: string;
  eisenhower: 'Urgent & Immediate' | 'Urgent & Not Immediate' | 'Not Urgent & Immediate' | 'Not Urgent & Not Immediate';
  [key: string]: any;
}

export const DEFAULT_NOTE_PROPERTIES: NoteProperties = {
  title: '',
  tags: [],
  status: 'Draft',
  author: '',
  eisenhower: 'Not Urgent & Not Immediate',
};

export interface ParsedMarkdownNote {
  title: string;
  frontmatter: NoteProperties;
  eisenhower?: EisenhowerQuadrant;
  body: string;
  tags: string[];
  wikiLinks: Array<{
    target: string;
    alias?: string;
    raw: string;
  }>;
}

export const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
export const CORRUPTED_FRONTMATTER_REGEX = /^---\r?\n\r?\n(title:\s[\s\S]*?)\r?\n\r?\n---\r?\n+/;

export type FrontmatterData = NoteProperties | Record<string, any>;

export interface ParsedFrontmatterResult extends NoteProperties {
  data: NoteProperties;
  meta: NoteProperties;
  content: string;
}

/**
 * Normalizes an Eisenhower quadrant string to one of the canonical display names if possible
 */
export function normalizeEisenhower(raw?: any): 'Urgent & Immediate' | 'Urgent & Not Immediate' | 'Not Urgent & Immediate' | 'Not Urgent & Not Immediate' {
  if (!raw) return 'Not Urgent & Not Immediate';
  const s = String(raw).trim();
  if (s === 'Urgent & Immediate' || s === 'urgent_immediate' || s === 'urgent_important') {
    return 'Urgent & Immediate';
  }
  if (s === 'Urgent & Not Immediate' || s === 'urgent_not_immediate' || s === 'not_urgent_important') {
    return 'Urgent & Not Immediate';
  }
  if (s === 'Not Urgent & Immediate' || s === 'not_urgent_immediate' || s === 'urgent_not_important') {
    return 'Not Urgent & Immediate';
  }
  return 'Not Urgent & Not Immediate';
}

export const RESERVED_FRONTMATTER_KEYS = new Set([
  'data',
  'meta',
  'content',
  '_raw',
  '_id',
  'body',
]);

export function filterVisibleFrontmatter(
  properties: Record<string, unknown>
): Record<string, unknown> {
  if (!properties || typeof properties !== 'object') return {};
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(properties)) {
    if (!RESERVED_FRONTMATTER_KEYS.has(key.toLowerCase())) {
      filtered[key] = value;
    }
  }
  return filtered;
}

export const filterDisplayFrontmatter = filterVisibleFrontmatter;

/**
 * Sanitizes frontmatter meta so it contains only flat primitives or string arrays,
 * eliminating nested meta/frontmatter objects.
 */
function sanitizeMetaRecord(meta: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(meta || {})) {
    if (RESERVED_FRONTMATTER_KEYS.has(key.toLowerCase()) || key === 'frontmatter') {
      continue;
    }
    if (val === null || val === undefined) {
      continue;
    }
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      sanitized[key] = val;
    } else if (Array.isArray(val)) {
      sanitized[key] = val
        .filter((item) => item !== null && item !== undefined && typeof item !== 'object')
        .map((item) => String(item).trim());
    }
  }
  delete sanitized.meta;
  delete sanitized.frontmatter;
  return sanitized;
}

/**
 * Extracts and parses YAML frontmatter in an idempotent, self-healing loop.
 * Strips all stacked duplicate and corrupted frontmatter headers, merging
 * extracted key-value pairs (oldest to newest) and sanitizing meta properties.
 */
export function parseFrontmatter(rawTextOrYaml: string): ParsedFrontmatterResult {
  let content = rawTextOrYaml || '';
  const extractedBlocks: Record<string, any>[] = [];

  let matched = true;
  while (matched) {
    matched = false;

    // 1. Check corrupted Tiptap-serialized frontmatter block
    const corruptedMatch = content.match(CORRUPTED_FRONTMATTER_REGEX);
    if (corruptedMatch) {
      try {
        const rawYaml = corruptedMatch[1].replace(/\r/g, '').replace(/\n\s*\n/g, '\n');
        const loaded = yaml.load(rawYaml);
        if (loaded && typeof loaded === 'object' && !Array.isArray(loaded)) {
          extractedBlocks.push(loaded as Record<string, any>);
        }
      } catch (err) {
        console.warn('Failed to parse corrupted YAML block:', err);
      }
      content = content.slice(corruptedMatch[0].length);
      matched = true;
      continue;
    }

    // 2. Check standard YAML frontmatter block
    const standardMatch = content.match(FRONTMATTER_REGEX);
    if (standardMatch) {
      try {
        const loaded = yaml.load(standardMatch[1]);
        if (loaded && typeof loaded === 'object' && !Array.isArray(loaded)) {
          extractedBlocks.push(loaded as Record<string, any>);
        }
      } catch (err) {
        console.warn('Failed to parse YAML frontmatter block:', err);
      }
      content = content.slice(standardMatch[0].length);
      matched = true;
      continue;
    }
  }

  // Fallback for standalone YAML content without ending delimiter
  if (extractedBlocks.length === 0 && rawTextOrYaml && rawTextOrYaml.trim().startsWith('---')) {
    try {
      const yamlContent = rawTextOrYaml.replace(/^---\r?\n?/, '').replace(/\r?\n?---[\s\S]*$/, '');
      const loaded = yaml.load(yamlContent);
      if (loaded && typeof loaded === 'object' && !Array.isArray(loaded)) {
        extractedBlocks.push(loaded as Record<string, any>);
        content = '';
      }
    } catch {}
  }

  // Merge extracted key-value pairs oldest to newest (bottom-most to top-most)
  let mergedParsed: Record<string, any> = {};
  for (let i = extractedBlocks.length - 1; i >= 0; i--) {
    mergedParsed = { ...mergedParsed, ...extractedBlocks[i] };
  }

  const sanitized = sanitizeMetaRecord(mergedParsed);

  const tags: string[] = [];
  if (Array.isArray(sanitized.tags)) {
    sanitized.tags.forEach((t: any) => {
      if (typeof t === 'string' && t.trim()) {
        tags.push(t.trim().replace(/^#/, ''));
      }
    });
  } else if (typeof sanitized.tags === 'string' && sanitized.tags.trim()) {
    sanitized.tags.split(',').forEach((t: string) => {
      if (t.trim()) tags.push(t.trim().replace(/^#/, ''));
    });
  }

  const result: NoteProperties = {
    ...DEFAULT_NOTE_PROPERTIES,
    ...sanitized,
    title:
      sanitized.title !== undefined && sanitized.title !== null
        ? String(sanitized.title).trim()
        : DEFAULT_NOTE_PROPERTIES.title,
    tags,
    status: sanitized.status ? String(sanitized.status).trim() : DEFAULT_NOTE_PROPERTIES.status,
    author:
      sanitized.author !== undefined && sanitized.author !== null
        ? String(sanitized.author)
        : DEFAULT_NOTE_PROPERTIES.author,
    eisenhower: normalizeEisenhower(sanitized.eisenhower),
  };

  return {
    ...result,
    data: result,
    meta: result,
    content,
  };
}

/**
 * Parses raw markdown text, extracting YAML frontmatter, tags, and WikiLinks
 */
export function parseMarkdownContent(rawText: string, fallbackTitle = 'Untitled'): ParsedMarkdownNote {
  const parsedFm = parseFrontmatter(rawText || '');
  let body = parsedFm.content;
  let frontmatter: NoteProperties = parsedFm.data;
  const tagsSet = new Set<string>();

  // 1. Extract tags from frontmatter
  frontmatter.tags.forEach((t) => tagsSet.add(t));

  // Exclude code blocks and inline code when extracting tags and WikiLinks
  const bodyWithoutCode = body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`[^`\n]+`/g, '');

  // Also extract inline #hashtags from body
  const inlineTagMatches = bodyWithoutCode.matchAll(/(?:^|\s)#([a-zA-Z0-9_\-\/]+)(?=\s|$|[.,;:!?])/g);
  for (const tagMatch of inlineTagMatches) {
    if (tagMatch[1]) {
      tagsSet.add(tagMatch[1]);
    }
  }

  // 2. Extract WikiLinks: [[Target]] or [[Target|Alias]]
  const wikiLinks: Array<{ target: string; alias?: string; raw: string }> = [];
  const wikiLinkMatches = bodyWithoutCode.matchAll(/\[\[(.*?)\]\]/g);
  for (const wlMatch of wikiLinkMatches) {
    const rawContent = wlMatch[1]?.trim();
    if (!rawContent) continue;

    if (rawContent.includes('|')) {
      const [target, alias] = rawContent.split('|').map((s) => s.trim());
      wikiLinks.push({ target, alias, raw: wlMatch[0] });
    } else {
      wikiLinks.push({ target: rawContent, raw: wlMatch[0] });
    }
  }

  // 3. Determine title
  let title = fallbackTitle;
  if (frontmatter.title && typeof frontmatter.title === 'string' && frontmatter.title.trim()) {
    title = frontmatter.title.trim();
  } else {
    // Try first H1 from markdown body: # Heading
    const firstH1 = body.match(/^#\s+(.*)$/m);
    if (firstH1 && firstH1[1]) {
      title = firstH1[1].trim();
    }
  }

  // Guarantee frontmatter title is populated
  if (!frontmatter.title) {
    frontmatter.title = title;
  }

  const allTags = Array.from(tagsSet);
  if (allTags.length > 0 && frontmatter.tags.length === 0) {
    frontmatter.tags = allTags;
  }

  return {
    title,
    frontmatter,
    eisenhower: (frontmatter.eisenhower as EisenhowerQuadrant) || undefined,
    body,
    tags: allTags,
    wikiLinks,
  };
}

/**
 * Idempotently serializes frontmatter and markdown body into standard raw file content.
 * Guarantees that any existing frontmatter on body is stripped first, preventing duplicate headers.
 */
export function serializeFrontmatter(
  meta: FrontmatterData,
  body: string
): string {
  // Always strip any existing frontmatter from body first!
  const { content: cleanBody } = parseFrontmatter(body || '');
  const sanitized = sanitizeMetaRecord(meta || {});

  const cleanFrontmatter: NoteProperties = {
    ...DEFAULT_NOTE_PROPERTIES,
    ...sanitized,
    title:
      sanitized.title !== undefined && sanitized.title !== null
        ? String(sanitized.title).trim()
        : DEFAULT_NOTE_PROPERTIES.title,
    tags: Array.isArray(sanitized.tags) ? sanitized.tags : [],
    status: sanitized.status ? String(sanitized.status).trim() : DEFAULT_NOTE_PROPERTIES.status,
    author:
      sanitized.author !== undefined && sanitized.author !== null
        ? String(sanitized.author)
        : DEFAULT_NOTE_PROPERTIES.author,
    eisenhower: normalizeEisenhower(sanitized.eisenhower),
  };

  try {
    const yamlString = yaml.dump(cleanFrontmatter, {
      lineWidth: -1,
      forceQuotes: false,
    });
    const trimmedBody = cleanBody.replace(/^\n+/, '');
    return trimmedBody.length > 0
      ? `---\n${yamlString.trim()}\n---\n\n${trimmedBody}`
      : `---\n${yamlString.trim()}\n---\n`;
  } catch (e) {
    return cleanBody;
  }
}

/**
 * Re-serializes frontmatter and markdown body into standard raw file content.
 * Delegates to serializeFrontmatter for idempotent, self-healing frontmatter handling.
 */
export function serializeMarkdownWithFrontmatter(
  body: string,
  frontmatter: Record<string, any>
): string {
  return serializeFrontmatter(frontmatter, body);
}
