import * as yaml from 'js-yaml';
import { EisenhowerQuadrant } from '../storage/db';

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

export interface ParsedFrontmatterResult extends NoteProperties {
  data: NoteProperties;
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

/**
 * Extracts and parses YAML frontmatter, automatically merging missing keys with DEFAULT_NOTE_PROPERTIES
 */
export function parseFrontmatter(rawTextOrYaml: string): ParsedFrontmatterResult {
  let parsed: any = {};
  const match = rawTextOrYaml.match(FRONTMATTER_REGEX);
  const yamlContent = match
    ? match[1]
    : rawTextOrYaml.startsWith('---')
    ? rawTextOrYaml.replace(/^---\r?\n?/, '').replace(/\r?\n?---[\s\S]*$/, '')
    : rawTextOrYaml;

  try {
    const loaded = yaml.load(yamlContent);
    if (loaded && typeof loaded === 'object' && !Array.isArray(loaded)) {
      parsed = loaded;
    }
  } catch (err) {
    console.warn('Failed to parse YAML frontmatter:', err);
  }

  const tags: string[] = [];
  if (Array.isArray(parsed.tags)) {
    parsed.tags.forEach((t: any) => {
      if (typeof t === 'string' && t.trim()) {
        tags.push(t.trim().replace(/^#/, ''));
      }
    });
  } else if (typeof parsed.tags === 'string' && parsed.tags.trim()) {
    parsed.tags.split(',').forEach((t: string) => {
      if (t.trim()) tags.push(t.trim().replace(/^#/, ''));
    });
  }

  const cleanBody = match ? rawTextOrYaml.slice(match[0].length) : rawTextOrYaml;

  const result: NoteProperties = {
    ...DEFAULT_NOTE_PROPERTIES,
    ...parsed,
    title: parsed.title !== undefined && parsed.title !== null ? String(parsed.title).trim() : DEFAULT_NOTE_PROPERTIES.title,
    tags,
    status: parsed.status ? String(parsed.status).trim() : DEFAULT_NOTE_PROPERTIES.status,
    author: parsed.author !== undefined && parsed.author !== null ? String(parsed.author) : DEFAULT_NOTE_PROPERTIES.author,
    eisenhower: normalizeEisenhower(parsed.eisenhower),
  };

  return {
    ...result,
    data: result,
    content: cleanBody,
  };
}

/**
 * Parses raw markdown text, extracting YAML frontmatter, tags, and WikiLinks
 */
export function parseMarkdownContent(rawText: string, fallbackTitle = 'Untitled'): ParsedMarkdownNote {
  let body = rawText;
  let frontmatter: NoteProperties = { ...DEFAULT_NOTE_PROPERTIES };
  const tagsSet = new Set<string>();

  // 1. Extract YAML frontmatter
  const match = rawText.match(FRONTMATTER_REGEX);
  if (match) {
    frontmatter = parseFrontmatter(match[0]);
    body = rawText.slice(match[0].length);
  }

  // 2. Extract tags from frontmatter
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

  // 3. Extract WikiLinks: [[Target]] or [[Target|Alias]]
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

  // 4. Determine title
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
 * Re-serializes frontmatter and markdown body into standard raw file content
 */
export function serializeMarkdownWithFrontmatter(
  body: string,
  frontmatter: Record<string, any>
): string {
  const cleanFrontmatter: Record<string, any> = {
    ...DEFAULT_NOTE_PROPERTIES,
  };

  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== undefined && value !== null) {
      cleanFrontmatter[key] = value;
    }
  }

  // Standardize title and eisenhower
  if (cleanFrontmatter.eisenhower) {
    cleanFrontmatter.eisenhower = normalizeEisenhower(cleanFrontmatter.eisenhower);
  }

  try {
    const yamlString = yaml.dump(cleanFrontmatter, {
      lineWidth: -1,
      forceQuotes: false,
    });
    return `---\n${yamlString.trim()}\n---\n\n${body.replace(/^\n+/, '')}`;
  } catch (e) {
    return body;
  }
}
