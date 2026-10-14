import { RunnerContext, RunnerResult } from './types';

let pyodideInstance: any = null;
let pyodidePromise: Promise<any> | null = null;

async function getPyodide(ctx: RunnerContext): Promise<any> {
  if (pyodideInstance) return pyodideInstance;
  if (pyodidePromise) return await pyodidePromise;

  ctx.progress('runtime-loading', 'Downloading Pyodide WASM runtime (~20MB)...');

  pyodidePromise = (async () => {
    // Dynamic import of Pyodide ES module in Web Worker
    // @ts-ignore
    const pyodideModule = await import(/* webpackIgnore: true */ 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.mjs');
    const instance = await pyodideModule.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/',
    });
    pyodideInstance = instance;
    return instance;
  })();

  try {
    const instance = await pyodidePromise;
    return instance;
  } catch (err) {
    pyodidePromise = null;
    throw err;
  }
}

export async function runPython(code: string, ctx: RunnerContext): Promise<RunnerResult> {
  const pyodide = await getPyodide(ctx);

  // Automatically load required packages imported in the script (e.g. numpy, pandas)
  try {
    await pyodide.loadPackagesFromImports(code);
  } catch (pkgErr: any) {
    ctx.emit('stderr', `Warning loading packages: ${pkgErr?.message || pkgErr}`);
  }

  // Bind stdout and stderr for current execution
  pyodide.setStdout({ batched: (msg: string) => ctx.emit('stdout', msg) });
  pyodide.setStderr({ batched: (msg: string) => ctx.emit('stderr', msg) });

  // Signal runtime-ready right before user code starts
  ctx.progress('runtime-ready', 'Pyodide runtime ready');

  const pyResult = await pyodide.runPythonAsync(code);

  if (pyResult !== undefined && pyResult !== null) {
    const strResult = String(pyResult);
    if (strResult !== 'None') {
      ctx.emit('stdout', strResult);
      ctx.emit('result', strResult);
    }
  }

  return { success: true };
}
