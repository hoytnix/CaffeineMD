let pyodideInstance: any = null;
let pyodideInitPromise: Promise<any> | null = null;

async function getPyodide(id: string) {
  if (pyodideInstance) return pyodideInstance;

  if (pyodideInitPromise) {
    return await pyodideInitPromise;
  }

  self.postMessage({
    type: 'status',
    id,
    payload: { status: 'loading_runtime', text: 'Downloading Pyodide WASM runtime (~20MB)...' },
  });

  pyodideInitPromise = (async () => {
    // Dynamic import for ES Module workers
    // @ts-ignore
    const pyodideModule = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.mjs');
    const instance = await pyodideModule.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
    });
    pyodideInstance = instance;
    return instance;
  })();

  try {
    const instance = await pyodideInitPromise;
    self.postMessage({
      type: 'status',
      id,
      payload: { status: 'ready', text: 'Pyodide runtime initialized' },
    });
    return instance;
  } catch (err) {
    pyodideInitPromise = null;
    throw err;
  }
}

self.onmessage = async (e: MessageEvent) => {
  const { id, language, code } = e.data;

  const emitOutput = (type: 'stdout' | 'stderr' | 'result' | 'error', text: string) => {
    self.postMessage({
      type: 'output',
      id,
      payload: { type, text: String(text), timestamp: Date.now() },
    });
  };

  try {
    if (language === 'python') {
      const pyodide = await getPyodide(id);

      // Signal manager that runtime is ready and code execution is starting
      self.postMessage({ type: 'execution_started', id });

      pyodide.setStdout({ batched: (msg: string) => emitOutput('stdout', msg) });
      pyodide.setStderr({ batched: (msg: string) => emitOutput('stderr', msg) });

      const pyResult = await pyodide.runPythonAsync(code);
      if (pyResult !== undefined && pyResult !== null) {
        emitOutput('result', String(pyResult));
      }
      self.postMessage({ type: 'complete', id, payload: { success: true } });

    } else if (language === 'javascript' || language === 'typescript') {
      self.postMessage({ type: 'execution_started', id });

      const customConsole = {
        log: (...args: any[]) =>
          emitOutput('stdout', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        error: (...args: any[]) =>
          emitOutput('stderr', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        warn: (...args: any[]) =>
          emitOutput('stderr', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
        info: (...args: any[]) =>
          emitOutput('stdout', args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' ')),
      };

      // Strip simple TypeScript type annotations if present
      let executableCode = code;
      if (language === 'typescript') {
        executableCode = executableCode
          .replace(/:\s*(string|number|boolean|any|void|unknown|never|object)\b/g, '')
          .replace(/interface\s+[A-Za-z0-9_]+\s*\{[^}]*\}/g, '')
          .replace(/type\s+[A-Za-z0-9_]+\s*=[^;]+;/g, '');
      }

      let result: any;
      try {
        const fn = new Function('console', `"use strict";\n${executableCode}`);
        result = fn(customConsole);
      } catch (innerErr: any) {
        if (/return/i.test(innerErr?.message || '')) {
          const fn = new Function('console', `"use strict";\nreturn (${executableCode});`);
          result = fn(customConsole);
        } else {
          throw innerErr;
        }
      }

      if (result !== undefined) {
        emitOutput('result', typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result));
      }
      self.postMessage({ type: 'complete', id, payload: { success: true } });

    } else if (language === 'math') {
      self.postMessage({ type: 'execution_started', id });
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

      const evalResult = Function(`"use strict"; return (${cleanMath});`)();
      emitOutput('result', String(evalResult));
      self.postMessage({ type: 'complete', id, payload: { success: true } });
    } else {
      emitOutput('error', `Unsupported sandbox language: ${language}`);
      self.postMessage({ type: 'complete', id, payload: { success: false } });
    }
  } catch (err: any) {
    emitOutput('error', err?.message || String(err));
    self.postMessage({ type: 'complete', id, payload: { success: false } });
  }
};
