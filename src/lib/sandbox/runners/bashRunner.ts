import { RunnerContext, RunnerResult } from './types';

interface ShellEnv {
  vars: Record<string, string>;
}

function expandVars(str: string, env: ShellEnv): string {
  // Arithmetic expansion: $(( 1 + 2 ))
  let res = str.replace(/\$\(\(\s*([^)]+?)\s*\)\)/g, (_m, expr) => {
    try {
      const clean = expr.replace(/([A-Za-z_][A-Za-z0-9_]*)/g, (v: string) => env.vars[v] || '0');
      return String(Function(`"use strict"; return (${clean});`)());
    } catch {
      return '0';
    }
  });

  // Variable expansion: ${VAR} or $VAR
  res = res.replace(/\$\{([A-Za-z0-9_]+)\}/g, (_m, v) => env.vars[v] ?? '');
  res = res.replace(/\$([A-Za-z0-9_]+)/g, (_m, v) => env.vars[v] ?? '');
  return res;
}

function runPipelineCommand(cmdStr: string, input: string, env: ShellEnv): { stdout: string; stderr: string } {
  const parts = cmdStr.trim().split(/\s+/);
  const cmd = parts[0];
  const args = parts.slice(1);

  if (cmd.includes('=') && !cmd.startsWith('export')) {
    const idx = cmd.indexOf('=');
    const key = cmd.substring(0, idx);
    let val = cmd.substring(idx + 1);
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    env.vars[key] = expandVars(val, env);
    return { stdout: '', stderr: '' };
  }

  switch (cmd) {
    case 'echo': {
      let flagN = false;
      let textArgs = args;
      if (args[0] === '-n') {
        flagN = true;
        textArgs = args.slice(1);
      }
      const raw = textArgs.join(' ').replace(/^["']|["']$/g, '');
      return { stdout: raw + (flagN ? '' : '\n'), stderr: '' };
    }
    case 'printf': {
      const fmt = (args[0] || '').replace(/\\n/g, '\n').replace(/\\t/g, '\t');
      return { stdout: fmt, stderr: '' };
    }
    case 'export': {
      const pair = args.join(' ');
      const [k, ...rest] = pair.split('=');
      if (k) env.vars[k.trim()] = expandVars(rest.join('=').replace(/^["']|["']$/g, ''), env);
      return { stdout: '', stderr: '' };
    }
    case 'cat':
      return { stdout: input || (args.length ? args.join(' ') + '\n' : ''), stderr: '' };
    case 'pwd':
      return { stdout: env.vars.PWD || '/workspace\n', stderr: '' };
    case 'date':
      return { stdout: new Date().toUTCString() + '\n', stderr: '' };
    case 'grep': {
      const isInv = args.includes('-v');
      const isCase = args.includes('-i');
      const patternArg = args.filter((a) => !a.startsWith('-'))[0] || '';
      const reg = new RegExp(patternArg, isCase ? 'i' : '');
      const lines = input.split('\n').filter((l) => (isInv ? !reg.test(l) : reg.test(l)));
      return { stdout: lines.join('\n') + (lines.length ? '\n' : ''), stderr: '' };
    }
    case 'sort': {
      const isNum = args.includes('-n');
      const isRev = args.includes('-r');
      const lines = input.split('\n').filter(Boolean);
      lines.sort((a, b) => (isNum ? parseFloat(a) - parseFloat(b) : a.localeCompare(b)));
      if (isRev) lines.reverse();
      if (args.includes('-u')) return { stdout: Array.from(new Set(lines)).join('\n') + '\n', stderr: '' };
      return { stdout: lines.join('\n') + '\n', stderr: '' };
    }
    case 'uniq': {
      const lines = input.split('\n').filter(Boolean);
      const res: string[] = [];
      for (let i = 0; i < lines.length; i++) {
        if (i === 0 || lines[i] !== lines[i - 1]) res.push(lines[i]);
      }
      return { stdout: res.join('\n') + '\n', stderr: '' };
    }
    case 'wc': {
      const isLines = args.includes('-l');
      const lines = input.split('\n').filter(Boolean);
      return { stdout: (isLines ? `${lines.length}` : `${lines.length} lines`) + '\n', stderr: '' };
    }
    case 'head': {
      const n = parseInt(args[args.indexOf('-n') + 1] || '10', 10);
      return { stdout: input.split('\n').slice(0, n).join('\n') + '\n', stderr: '' };
    }
    case 'tail': {
      const n = parseInt(args[args.indexOf('-n') + 1] || '10', 10);
      const lines = input.split('\n').filter(Boolean);
      return { stdout: lines.slice(-n).join('\n') + '\n', stderr: '' };
    }
    case 'cut': {
      const dIdx = args.indexOf('-d');
      const fIdx = args.indexOf('-f');
      const delim = dIdx !== -1 ? args[dIdx + 1] || '\t' : '\t';
      const fNum = fIdx !== -1 ? parseInt(args[fIdx + 1] || '1', 10) - 1 : 0;
      const lines = input.split('\n').map((l) => l.split(delim)[fNum] ?? '');
      return { stdout: lines.join('\n') + '\n', stderr: '' };
    }
    case 'jq': {
      try {
        const obj = JSON.parse(input || '{}');
        const filter = args[0] || '.';
        if (filter === '.') return { stdout: JSON.stringify(obj, null, 2) + '\n', stderr: '' };
        if (filter.startsWith('.')) {
          const key = filter.slice(1);
          return { stdout: JSON.stringify(obj[key] ?? null, null, 2) + '\n', stderr: '' };
        }
        return { stdout: JSON.stringify(obj, null, 2) + '\n', stderr: '' };
      } catch (e: any) {
        return { stdout: '', stderr: `jq error: ${e.message}\n` };
      }
    }
    default:
      if (!cmd) return { stdout: '', stderr: '' };
      return { stdout: `[bash] ${cmd}: command executed\n`, stderr: '' };
  }
}

export async function runBash(code: string, ctx: RunnerContext): Promise<RunnerResult> {
  ctx.progress('runtime-ready', 'Executing POSIX shell script...');
  const env: ShellEnv = {
    vars: { USER: 'caffeinemd', HOME: '/home/user', PWD: '/notes', SHELL: '/bin/bash' },
  };

  const rawLines = code.split('\n');
  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i].trim();
    if (!raw || raw.startsWith('#')) continue;

    // Handle for loops: for x in a b c; do ...; done
    const forMatch = raw.match(/^for\s+([A-Za-z0-9_]+)\s+in\s+([^;]+);\s*do/);
    if (forMatch) {
      const loopVar = forMatch[1];
      const items = forMatch[2].trim().split(/\s+/);
      const loopBody: string[] = [];
      i++;
      while (i < rawLines.length && !rawLines[i].trim().startsWith('done')) {
        loopBody.push(rawLines[i]);
        i++;
      }
      for (const item of items) {
        env.vars[loopVar] = item;
        for (const bLine of loopBody) {
          const expLine = expandVars(bLine.trim(), env);
          const out = runPipeline(expLine, env);
          if (out.stdout) ctx.emit('stdout', out.stdout.trimEnd());
          if (out.stderr) ctx.emit('stderr', out.stderr.trimEnd());
        }
      }
      continue;
    }

    const expanded = expandVars(raw, env);
    const result = runPipeline(expanded, env);
    if (result.stdout) ctx.emit('stdout', result.stdout.trimEnd());
    if (result.stderr) ctx.emit('stderr', result.stderr.trimEnd());
  }

  return { success: true };
}

function runPipeline(line: string, env: ShellEnv): { stdout: string; stderr: string } {
  const pipes = line.split('|').map((p) => p.trim());
  let currentIn = '';
  let finalErr = '';

  for (const p of pipes) {
    const res = runPipelineCommand(p, currentIn, env);
    currentIn = res.stdout;
    if (res.stderr) finalErr += res.stderr;
  }

  return { stdout: currentIn, stderr: finalErr };
}
