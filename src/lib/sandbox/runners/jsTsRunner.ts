import { RunnerContext, RunnerResult } from './types';

let tsInstance: any = null;
let tsPromise: Promise<any> | null = null;

async function getTsCompiler(ctx: RunnerContext): Promise<any> {
  if (tsInstance) return tsInstance;
  if (tsPromise) return await tsPromise;

  ctx.progress('runtime-loading', 'Loading TypeScript compiler (~2.5MB)...');

  tsPromise = (async () => {
    try {
      const resp = await fetch('https://cdn.jsdelivr.net/npm/typescript@5.6.3/lib/typescript.min.js');
      const text = await resp.text();
      const mod = { exports: {} as any };
      // Evaluate within worker global context
      const fn = new Function('module', 'exports', 'window', 'self', text);
      fn(mod, mod.exports, self, self);
      tsInstance = mod.exports || (self as any).ts;
      return tsInstance;
    } catch (err) {
      tsPromise = null;
      console.warn('Failed to load online TypeScript compiler, falling back to local type stripper', err);
      return null;
    }
  })();

  return await tsPromise;
}

function stripTypesFallback(code: string): string {
  return code
    .replace(/interface\s+[A-Za-z0-9_]+(?:\s*<[^>]+>)?\s*\{[^}]*\}/g, '')
    .replace(/type\s+[A-Za-z0-9_]+(?:\s*<[^>]+>)?\s*=[^;]+;/g, '')
    .replace(/enum\s+([A-Za-z0-9_]+)\s*\{([^}]*)\}/g, (_m, name, body) => {
      const items = body.split(',').map((item: string) => {
        const [k, v] = item.split('=').map((s: string) => s.trim());
        return k ? `  ${k}: ${v || JSON.stringify(k)},` : '';
      }).join('\n');
      return `const ${name} = {\n${items}\n};`;
    })
    .replace(/\bas\s+[A-Za-z0-9_<>[\]|&]+/g, '')
    .replace(/<[A-Za-z0-9_,\s]+>(?=\()/g, '')
    .replace(/:\s*(string|number|boolean|any|void|unknown|never|object|[A-Z][A-Za-z0-9_]*)(?:\[\])?(?=[,);=\s])/g, '');
}

function formatArg(arg: any): string {
  if (typeof arg === 'object' && arg !== null) {
    try {
      return JSON.stringify(arg, null, 2);
    } catch {
      return String(arg);
    }
  }
  return String(arg);
}

function formatTable(data: any): string {
  if (Array.isArray(data)) {
    if (data.length === 0) return '[] (empty table)';
    if (typeof data[0] === 'object' && data[0] !== null) {
      const keys = Array.from(new Set(data.flatMap((d) => Object.keys(d))));
      const header = `(index) | ` + keys.join(' | ');
      const div = `--------|` + keys.map((k) => '-'.repeat(Math.max(k.length + 2, 4))).join('|');
      const rows = data.map((d, i) => `${i}       | ` + keys.map((k) => String(d[k] ?? '')).join(' | '));
      return [header, div, ...rows].join('\n');
    }
  }
  return formatArg(data);
}

export async function runJsTs(
  language: 'javascript' | 'typescript' | 'math',
  code: string,
  ctx: RunnerContext
): Promise<RunnerResult> {
  let executableCode = code;

  if (language === 'typescript') {
    const ts = await getTsCompiler(ctx);
    if (ts?.transpileModule) {
      executableCode = ts.transpileModule(code, {
        compilerOptions: { module: ts.ModuleKind?.None || 0, target: ts.ScriptTarget?.ES2022 || 9 },
      }).outputText;
    } else {
      executableCode = stripTypesFallback(code);
    }
  } else if (language === 'math') {
    const cleanMath = code
      .replace(/Math\./g, '__MATH__')
      .replace(/[^0-9+\-*/().^% eE,sqrtabcsincolgtanpi\s]/gi, '')
      .replace(/__MATH__/g, 'Math.')
      .replace(/\bpi\b/gi, 'Math.PI')
      .replace(/\bsqrt\b/gi, 'Math.sqrt')
      .replace(/\bsin\b/gi, 'Math.sin')
      .replace(/\bcos\b/gi, 'Math.cos')
      .replace(/\btan\b/gi, 'Math.tan')
      .replace(/\babs\b/gi, 'Math.abs')
      .replace(/\blog\b/gi, 'Math.log');
    executableCode = `return (${cleanMath});`;
  }

  ctx.progress('runtime-ready', 'Executing script...');

  const customConsole = {
    log: (...args: any[]) => ctx.emit('stdout', args.map(formatArg).join(' ')),
    warn: (...args: any[]) => ctx.emit('stderr', args.map(formatArg).join(' ')),
    error: (...args: any[]) => ctx.emit('stderr', args.map(formatArg).join(' ')),
    info: (...args: any[]) => ctx.emit('stdout', args.map(formatArg).join(' ')),
    table: (data: any) => ctx.emit('stdout', formatTable(data)),
  };

  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  let result: any;

  try {
    const fn = new AsyncFunction('console', `"use strict";\n${executableCode}`);
    result = await fn(customConsole);
  } catch (err: any) {
    // If syntax/runtime error was caused by missing return on single expression, try wrapping
    if (!executableCode.includes('return') && !/^\s*(const|let|var|function|class)\s/.test(executableCode)) {
      try {
        const wrapFn = new AsyncFunction('console', `"use strict";\nreturn (${executableCode});`);
        result = await wrapFn(customConsole);
      } catch {
        throw err;
      }
    } else {
      throw err;
    }
  }

  if (result !== undefined) {
    ctx.emit('result', typeof result === 'object' && result !== null ? JSON.stringify(result, null, 2) : String(result));
  }

  return { success: true };
}
