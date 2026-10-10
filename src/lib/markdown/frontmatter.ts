import * as yaml from 'js-yaml';
import { EisenhowerQuadrant } from '../storage/db';

export interface ParsedMarkdownNote {
  title: string;
  frontmatter: Record<string, any>;
  eisenhower?: EisenhowerQuadrant;
  body: string;
  tags: string[];
  wikiLinks: Array<{
    target: string;
    alias?: string;
    raw: string;
  }>;
}

const FRONTMATTER_REGEX = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;

/**
 * Parses raw markdown text, extracting YAML frontmatter, tags, and WikiLinks
 */
export function parseMarkdownContent(rawText: string, fallbackTitle = 'Untitled'): ParsedMarkdownNote {
  let body = rawText;
  let frontmatter: Record<string, any> = {};
  const tagsSet = new Set<string>();

  // 1. Extract YAML frontmatter
  const match = rawText.match(FRONTMATTER_REGEX);
  if (match) {
    const yamlString = match[1];
    try {
      const parsed = yaml.load(yamlString);
      if (parsed && typeof parsed === 'object') {
        frontmatter = parsed as Record<string, any>;
      }
    } catch (err) {
      console.warn('Failed to parse YAML frontmatter:', err);
    }
    body = rawText.slice(match[0].length);
  }

  // 2. Extract tags from frontmatter
  if (Array.isArray(frontmatter.tags)) {
    frontmatter.tags.forEach((t: any) => {
      if (typeof t === 'string' && t.trim()) {
        tagsSet.add(t.trim().replace(/^#/, ''));
      }
    });
  } else if (typeof frontmatter.tags === 'string') {
    frontmatter.tags.split(',').forEach((t: string) => {
      if (t.trim()) tagsSet.add(t.trim().replace(/^#/, ''));
    });
  }

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
  if (frontmatter.title && typeof frontmatter.title === 'string') {
    title = frontmatter.title.trim();
  } else {
    // Try first H1 from markdown body: # Heading
    const firstH1 = body.match(/^#\s+(.*)$/m);
    if (firstH1 && firstH1[1]) {
      title = firstH1[1].trim();
    }
  }

  return {
    title,
    frontmatter,
    eisenhower: (frontmatter.eisenhower as EisenhowerQuadrant) || undefined,
    body,
    tags: Array.from(tagsSet),
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
  const cleanFrontmatter: Record<string, any> = {};

  for (const [key, value] of Object.entries(frontmatter)) {
    if (value !== undefined && value !== null && value !== '') {
      cleanFrontmatter[key] = value;
    }
  }

  if (Object.keys(cleanFrontmatter).length === 0) {
    return body;
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
