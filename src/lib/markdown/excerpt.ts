/**
 * Strips markdown and frontmatter syntax to create a clean plaintext excerpt
 */
export function extractCleanExcerpt(content: string, maxLength = 400): string {
  if (!content) return '';

  // 1. Strip YAML frontmatter
  let clean = content.replace(/^---[\s\S]*?---\r?\n?/g, '');

  // 2. Strip fenced code blocks
  clean = clean.replace(/```[\s\S]*?```/g, '');

  // 3. Strip inline code
  clean = clean.replace(/`[^`\n]+`/g, '');

  // 4. Strip markdown image tags
  clean = clean.replace(/!\[([^\]]*)\]\([^)]*\)/g, '');

  // 5. Convert markdown links [text](url) -> text
  clean = clean.replace(/\[([^\]]+)\]\([^)]*\)/g, '$1');

  // 6. Convert WikiLinks [[Target|Alias]] -> Alias or Target
  clean = clean.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_, target, alias) => alias || target);

  // 7. Strip headings, blockquotes, list markers
  clean = clean.replace(/^#{1,6}\s+/gm, '');
  clean = clean.replace(/^>\s+/gm, '');
  clean = clean.replace(/^-\s+\[[ xX]\]\s+/gm, '');
  clean = clean.replace(/^[-*]\s+/gm, '');
  clean = clean.replace(/^\d+\.\s+/gm, '');

  // 8. Strip emphasis formatting
  clean = clean.replace(/\*\*(.*?)\*\*/g, '$1');
  clean = clean.replace(/\*(.*?)\*/g, '$1');
  clean = clean.replace(/~~(.*?)~~/g, '$1');

  // 9. Normalize whitespace
  clean = clean.replace(/\s+/g, ' ').trim();

  if (clean.length > maxLength) {
    return clean.slice(0, maxLength).trim() + '...';
  }
  return clean;
}
