import { RunnerContext, RunnerResult } from './types';

let sqlJsModule: any = null;
let sqlInitPromise: Promise<any> | null = null;
let sqliteDb: any = null;

async function getSqlDb(ctx: RunnerContext): Promise<any> {
  if (sqliteDb) return sqliteDb;

  if (!sqlJsModule) {
    if (!sqlInitPromise) {
      ctx.progress('runtime-loading', 'Downloading SQLite WASM runtime (~1.5MB)...');
      sqlInitPromise = (async () => {
        const resp = await fetch('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js');
        const text = await resp.text();
        const mod = { exports: {} as any };
        const fn = new Function('module', 'exports', 'window', 'self', text);
        fn(mod, mod.exports, self, self);
        const initSqlJs = mod.exports;
        const SQL = await initSqlJs({
          locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`,
        });
        sqlJsModule = SQL;
        return SQL;
      })();
    }
    await sqlInitPromise;
  }

  sqliteDb = new sqlJsModule.Database();
  return sqliteDb;
}

function formatSqlTable(columns: string[], values: any[][]): string {
  if (columns.length === 0) return '(empty result set)';
  const colWidths = columns.map((col, idx) => {
    let max = col.length;
    for (const row of values) {
      const cellStr = row[idx] === null ? 'NULL' : String(row[idx]);
      if (cellStr.length > max) max = cellStr.length;
    }
    return Math.max(max, 3);
  });

  const header = '| ' + columns.map((col, i) => col.padEnd(colWidths[i])).join(' | ') + ' |';
  const divider = '|-' + colWidths.map((w) => '-'.repeat(w)).join('-|-') + '-|';
  const rows = values.map((row) =>
    '| ' + row.map((cell, i) => (cell === null ? 'NULL' : String(cell)).padEnd(colWidths[i])).join(' | ') + ' |'
  );

  const countSummary = `\n(${values.length} ${values.length === 1 ? 'row' : 'rows'})`;
  return [header, divider, ...rows].join('\n') + countSummary;
}

export async function runSql(code: string, ctx: RunnerContext): Promise<RunnerResult> {
  const db = await getSqlDb(ctx);

  ctx.progress('runtime-ready', 'Executing SQLite query...');

  const results = db.exec(code);

  if (results && results.length > 0) {
    for (const res of results) {
      const formatted = formatSqlTable(res.columns || [], res.values || []);
      ctx.emit('stdout', formatted);
      ctx.emit('result', `${res.values?.length || 0} rows returned`);
    }
  } else {
    const rowsModified = typeof db.getRowsModified === 'function' ? db.getRowsModified() : 0;
    const msg = `Query executed successfully. (${rowsModified} row${rowsModified === 1 ? '' : 's'} affected)`;
    ctx.emit('stdout', msg);
    ctx.emit('result', msg);
  }

  return { success: true };
}

export function resetSqlDb(): void {
  if (sqliteDb) {
    try {
      sqliteDb.close();
    } catch {}
    sqliteDb = null;
  }
}
