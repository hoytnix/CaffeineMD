import { RunnerContext, RunnerResult } from './types';

let fengariModule: any = null;
let fengariPromise: Promise<any> | null = null;

async function getFengari(ctx: RunnerContext): Promise<any> {
  if (fengariModule) return fengariModule;
  if (fengariPromise) return await fengariPromise;

  ctx.progress('runtime-loading', 'Loading Fengari Lua 5.3 runtime (~800KB)...');

  fengariPromise = (async () => {
    const resp = await fetch('https://cdn.jsdelivr.net/npm/fengari-web@0.1.4/dist/fengari-web.js');
    const text = await resp.text();
    const sandboxContext: Record<string, any> = {
      window: self,
      self,
      document: { querySelectorAll: () => [] },
      HTMLDocument: function () {},
      HTMLElement: function () {},
      MutationObserver: class {
        observe() {}
        disconnect() {}
      },
      module: { exports: {} },
      exports: {},
    };
    const fn = new Function(
      'window',
      'self',
      'document',
      'HTMLDocument',
      'HTMLElement',
      'MutationObserver',
      'module',
      'exports',
      text
    );
    fn(
      sandboxContext.window,
      sandboxContext.self,
      sandboxContext.document,
      sandboxContext.HTMLDocument,
      sandboxContext.HTMLElement,
      sandboxContext.MutationObserver,
      sandboxContext.module,
      sandboxContext.exports
    );
    fengariModule = sandboxContext.module.exports || (self as any).fengari;
    return fengariModule;
  })();

  return await fengariPromise;
}

export async function runLua(code: string, ctx: RunnerContext): Promise<RunnerResult> {
  const fengari = await getFengari(ctx);
  const { lua, lauxlib, lualib, to_luastring, to_jsstring } = fengari;

  ctx.progress('runtime-ready', 'Executing Lua script...');

  const L = lauxlib.luaL_newstate();
  lualib.luaL_openlibs(L);

  // Hook standard Lua 'print' function into runner stdout
  lua.lua_register(L, to_luastring('print'), (L_state: any) => {
    const n = lua.lua_gettop(L_state);
    const parts: string[] = [];
    for (let i = 1; i <= n; i++) {
      if (lua.lua_isstring(L_state, i)) {
        parts.push(lua.lua_tojsstring(L_state, i));
      } else {
        parts.push(to_jsstring(lauxlib.luaL_tolstring(L_state, i)));
        lua.lua_pop(L_state, 1);
      }
    }
    ctx.emit('stdout', parts.join('\t'));
    return 0;
  });

  const status = lauxlib.luaL_dostring(L, to_luastring(code));
  if (status !== lua.LUA_OK) {
    const errMsg = lua.lua_tojsstring(L, -1);
    throw new Error(errMsg || 'Lua execution error');
  }

  return { success: true };
}
