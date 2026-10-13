let pyodideInstance: any = null;

async function getPyodide() {
  if (!pyodideInstance) {
    let loadFn: any = (self as any).loadPyodide;
    if (!loadFn && typeof (self as any).importScripts === 'function') {
      try {
        (self as any).importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js');
        loadFn = (self as any).loadPyodide;
      } catch {
        // Fallback to dynamic module import
      }
    }
    if (!loadFn) {
      // Load ES Module pyodide
      // @ts-ignore
      const mod = await import('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.mjs');
      loadFn = mod.loadPyodide;
    }
    pyodideInstance = await loadFn({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
    });
  }
  return pyodideInstance;
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
    if (language === 'javascript' || language === 'typescript') {
      // Sandboxed JS Execution with captured console
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

      // Check if code has return statement or is an expression
      let result: any;
      try {
        const fn = new Function('console', `"use strict";\n${executableCode}`);
        result = fn(customConsole);
      } catch (innerErr: any) {
        // If "illegal return statement" or simple expression, try returning expression directly
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

    } else if (language === 'python') {
      const pyodide = await getPyodide();
      pyodide.setStdout({ batched: (msg: string) => emitOutput('stdout', msg) });
      pyodide.setStderr({ batched: (msg: string) => emitOutput('stderr', msg) });

      const pyResult = await pyodide.runPythonAsync(code);
      if (pyResult !== undefined) {
        emitOutput('result', String(pyResult));
      }
      self.postMessage({ type: 'complete', id, payload: { success: true } });

    } else if (language === 'math') {
      // Evaluate mathematical expression safely
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
