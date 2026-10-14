import { RunnerContext, RunnerResult } from './types';

const COMPILER_MAP: Record<string, string> = {
  rust: 'nightly',
  rs: 'nightly',
  go: 'gltip',
  golang: 'gltip',
  c: 'cg141',
  cpp: 'g141',
  'c++': 'g141',
};

export async function runCompiledLanguage(
  lang: string,
  code: string,
  ctx: RunnerContext
): Promise<RunnerResult> {
  const compilerId = COMPILER_MAP[lang.toLowerCase()] || 'g141';

  ctx.progress('runtime-loading', `Compiling via Compiler Explorer (${compilerId})...`);

  const userArguments = compilerId === 'g141' || compilerId === 'cg141' ? '-O2' : '';

  const response = await fetch(`https://godbolt.org/api/compiler/${compilerId}/compile`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      source: code,
      options: {
        userArguments,
        executeParameters: { args: [], stdin: '' },
        compilerOptions: { executorRequest: true },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Compiler Explorer API returned HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  ctx.progress('runtime-ready', 'Execution output ready');

  // Parse build/compilation errors or warnings
  const buildStderr = (data.buildResult?.stderr || []).map((x: any) => x.text ?? String(x)).join('\n');
  const buildStdout = (data.buildResult?.stdout || []).map((x: any) => x.text ?? String(x)).join('\n');

  if (buildStderr) {
    ctx.emit('stderr', buildStderr);
  } else if (buildStdout) {
    ctx.emit('stdout', buildStdout);
  }

  // Parse execution results
  const execResult = data.execResult || data;
  const stdoutLines = (execResult.stdout || []).map((x: any) => x.text ?? String(x)).join('\n');
  const stderrLines = (execResult.stderr || []).map((x: any) => x.text ?? String(x)).join('\n');

  if (stdoutLines) {
    ctx.emit('stdout', stdoutLines);
  }
  if (stderrLines) {
    ctx.emit('stderr', stderrLines);
  }

  const exitCode = execResult.code ?? data.code;
  if (exitCode !== undefined && exitCode !== 0) {
    ctx.emit('stderr', `Process exited with code ${exitCode}`);
  }

  return {
    success: (data.buildResult?.code === 0 || !data.buildResult) && exitCode === 0,
  };
}
