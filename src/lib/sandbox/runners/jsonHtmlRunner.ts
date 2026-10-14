import { RunnerContext, RunnerResult } from './types';

export async function runHtmlSvg(code: string, ctx: RunnerContext): Promise<RunnerResult> {
  ctx.progress('runtime-ready', 'Rendering HTML/SVG preview...');
  ctx.emit('stdout', `[HTML/SVG live preview active: ${code.length} bytes]`);
  ctx.emit('result', 'Preview ready');
  return {
    success: true,
    htmlPreview: code,
  };
}

export async function runJson(code: string, ctx: RunnerContext): Promise<RunnerResult> {
  ctx.progress('runtime-ready', 'Parsing & validating JSON...');

  try {
    const parsed = JSON.parse(code);
    const pretty = JSON.stringify(parsed, null, 2);

    let stats = '';
    if (Array.isArray(parsed)) {
      stats = `JSON Array: ${parsed.length} items`;
    } else if (typeof parsed === 'object' && parsed !== null) {
      const keys = Object.keys(parsed);
      stats = `JSON Object: ${keys.length} keys (${keys.slice(0, 8).join(', ')}${keys.length > 8 ? '...' : ''})`;
    } else {
      stats = `JSON Primitive (${typeof parsed}): ${String(parsed)}`;
    }

    ctx.emit('stdout', pretty);
    ctx.emit('result', `Valid JSON (${stats})`);
    return { success: true };
  } catch (err: any) {
    const message = err?.message || String(err);
    ctx.emit('error', `JSON SyntaxError: ${message}`);
    return { success: false, error: message };
  }
}
