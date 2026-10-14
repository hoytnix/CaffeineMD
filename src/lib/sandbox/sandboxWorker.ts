import { runPython } from './runners/pythonRunner';
import { runJsTs } from './runners/jsTsRunner';
import { runSql } from './runners/sqlRunner';
import { runLua } from './runners/luaRunner';
import { runBash } from './runners/bashRunner';
import { runHtmlSvg, runJson } from './runners/jsonHtmlRunner';
import { runCompiledLanguage } from './runners/compiledRunner';
import { RunnerContext, RunnerResult } from './runners/types';

self.onmessage = async (e: MessageEvent) => {
  const { id, language, code } = e.data;
  const lang = (language || '').toLowerCase().trim();

  const emit = (type: 'stdout' | 'stderr' | 'result' | 'error', text: string) => {
    self.postMessage({
      type: 'output',
      id,
      payload: { type, text: String(text), timestamp: Date.now() },
    });
  };

  const progress = (status: 'runtime-loading' | 'runtime-ready', text?: string) => {
    self.postMessage({
      id,
      status,
      type: status === 'runtime-ready' ? 'execution_started' : 'status',
      payload: {
        status,
        text: text || (status === 'runtime-loading' ? 'Loading runtime...' : 'Runtime ready'),
      },
    });
  };

  const ctx: RunnerContext = { id, emit, progress };

  try {
    let result: RunnerResult;

    if (lang === 'python' || lang === 'py') {
      result = await runPython(code, ctx);
    } else if (lang === 'javascript' || lang === 'js') {
      result = await runJsTs('javascript', code, ctx);
    } else if (lang === 'typescript' || lang === 'ts') {
      result = await runJsTs('typescript', code, ctx);
    } else if (lang === 'math') {
      result = await runJsTs('math', code, ctx);
    } else if (lang === 'sql' || lang === 'sqlite') {
      result = await runSql(code, ctx);
    } else if (lang === 'lua') {
      result = await runLua(code, ctx);
    } else if (['bash', 'sh', 'shell', 'zsh'].includes(lang)) {
      result = await runBash(code, ctx);
    } else if (lang === 'html' || lang === 'svg') {
      result = await runHtmlSvg(code, ctx);
    } else if (lang === 'json') {
      result = await runJson(code, ctx);
    } else if (['rust', 'rs', 'go', 'golang', 'c', 'cpp', 'c++'].includes(lang)) {
      result = await runCompiledLanguage(lang, code, ctx);
    } else {
      emit('error', `Unsupported sandbox language: ${lang}`);
      result = { success: false };
    }

    self.postMessage({
      type: 'complete',
      id,
      payload: { success: result.success, htmlPreview: result.htmlPreview },
    });
  } catch (err: any) {
    emit('error', err?.message || String(err));
    self.postMessage({
      type: 'complete',
      id,
      payload: { success: false },
    });
  }
};
