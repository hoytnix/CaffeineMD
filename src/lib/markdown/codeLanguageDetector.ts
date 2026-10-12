import { createLowlight, all } from 'lowlight';

const lowlightInstance = createLowlight(all);

const COMMON_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'rust',
  'go',
  'bash',
  'json',
  'yaml',
  'xml',
  'css',
  'sql',
  'markdown',
];

/**
 * Automatically detect programming language from code snippet text.
 */
export function detectCodeLanguage(code: string): string {
  if (!code || !code.trim()) return 'plaintext';
  try {
    const res = lowlightInstance.highlightAuto(code, { subset: COMMON_LANGUAGES });
    const lang = res?.data?.language;
    if (lang && lang !== 'plaintext') {
      return lang === 'xml' ? 'html' : lang;
    }
    const full = lowlightInstance.highlightAuto(code);
    return full?.data?.language || 'plaintext';
  } catch {
    return 'plaintext';
  }
}
