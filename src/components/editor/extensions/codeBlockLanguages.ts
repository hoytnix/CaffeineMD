import { SupportedSandboxLang } from '@/src/lib/sandbox/types';

export const RUNNABLE_LANGUAGES = [
  'javascript', 'js',
  'typescript', 'ts',
  'python', 'py',
  'sql', 'sqlite',
  'html', 'svg',
  'lua',
  'bash', 'sh', 'shell', 'zsh',
  'json',
  'rust', 'rs',
  'go', 'golang',
  'c',
  'cpp', 'c++',
  'math',
];

export const LANGUAGES = [
  'plaintext',
  'javascript',
  'typescript',
  'python',
  'sql',
  'html',
  'svg',
  'lua',
  'bash',
  'json',
  'rust',
  'go',
  'cpp',
  'c',
  'css',
  'markdown',
  'yaml',
];

export function normalizeSandboxLang(rawLang: string): SupportedSandboxLang | null {
  const l = (rawLang || '').toLowerCase().trim();
  if (['javascript', 'js'].includes(l)) return 'javascript';
  if (['typescript', 'ts'].includes(l)) return 'typescript';
  if (['python', 'py'].includes(l)) return 'python';
  if (['sql', 'sqlite'].includes(l)) return 'sql';
  if (['html', 'svg'].includes(l)) return 'html';
  if (l === 'lua') return 'lua';
  if (['bash', 'sh', 'shell', 'zsh'].includes(l)) return 'bash';
  if (l === 'json') return 'json';
  if (['rust', 'rs'].includes(l)) return 'rust';
  if (['go', 'golang'].includes(l)) return 'go';
  if (['cpp', 'c++'].includes(l)) return 'cpp';
  if (l === 'c') return 'c';
  if (l === 'math') return 'math';
  return null;
}
