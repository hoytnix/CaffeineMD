# Polyglot WASM Code Execution Sandbox

This document details CaffeineMD's client-side, WebAssembly-powered multi-language execution sandbox, Web Worker isolation architecture, persistent runtime caching engine, and editor integration.

---

## 1. Architecture & Security Model

CaffeineMD enables secure, zero-cloud code evaluation directly inside Markdown code blocks:

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                    MAIN THREAD                                         │
│                                                                                        │
│   CodeBlockView.tsx ──► executeCodeBlock() ──► WasmSandboxManager (wasmSandbox.ts)     │
│                                                          │                             │
│                                                 postMessage(request)                   │
└──────────────────────────────────────────────────────────┼─────────────────────────────┘
                                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                           DEDICATED WEB WORKER (sandboxWorker.ts)                      │
│                                                                                        │
│   ┌────────────────────────────────────────────────────────────────────────────────┐   │
│   │                         Language Runner Dispatcher                             │   │
│   ├──────────────┬──────────────┬──────────────┬──────────────┬────────────────────┤   │
│   │ pythonRunner │  sqlRunner   │  jsTsRunner  │  luaRunner   │ compiledRunner     │   │
│   │  (Pyodide)   │   (sql.js)   │ (TypeScript) │  (Fengari)   │ (CompilerExplorer) │   │
│   └──────────────┴──────────────┴──────────────┴──────────────┴────────────────────┘   │
│                                          │                                             │
│               Intercept Console Streams (stdout, stderr, result)                       │
│                                          ▼                                             │
│                           5000ms Execution Watchdog                                    │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.1 Opt-in Sandbox Setting
- **Default State**: `codeExecutionSandboxEnabled` defaults to `false` in `workspaceStore.ts`.
- **Rationale**: Downloading multi-megabyte WASM runtimes (e.g., Pyodide or TypeScript) on initial page load degrades launch performance. With the sandbox disabled, CaffeineMD initializes instantaneously.
- **Activation**: Enabled via `CodeExecutionSandboxSection.tsx` in Settings or the prompt modal when clicking "Run" on any code block.

### 1.2 Web Worker Isolation & Watchdog Guard
- Execution occurs exclusively inside a standalone Web Worker ([`sandboxWorker.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/sandboxWorker.ts)).
- **Main Thread Protection**: Code running inside the worker cannot freeze the user interface or access the parent DOM, cookies, or IndexedDB storage.
- **Two-Tier Watchdog**:
  1. *Initialization Watchdog*: Allows sufficient time for runtime download and WASM compilation.
  2. *Execution Watchdog (5000ms)*: Once code begins executing (`runtime-ready`), a strict 5000ms timer runs. If user code contains an infinite loop (e.g., `while(true){}`), the manager terminates the worker via `worker.terminate()`, flags the output with a timeout error, and respawns a clean worker automatically.

---

## 2. Persistent Runtime Cache Engine

Located in [`src/lib/sandbox/runtimeCache.ts`](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/runtimeCache.ts):

### 2.1 The Problem
Downloading language compilers (TypeScript ~2.5MB, SQLite WASM ~1.6MB, Fengari ~800KB, Pyodide) repeatedly on every session wastes bandwidth and causes frustrating execution delays.

### 2.2 Browser Cache API Solution
- Uses the standard browser `caches.open('caffeinemd-sandbox-runtime-v1')` API.
- **`fetchWithRuntimeCache(url, init)`**:
  1. Checks if the requested asset URL is already cached in `caffeinemd-sandbox-runtime-v1`.
  2. If cached, serves the cached `Response` instantly with zero network latency.
  3. If missing, fetches from the CDN, clones the stream, stores it in Cache Storage, and returns the response.
- **Preloading (`preloadSandboxRuntimes(onProgress)`)**:
  - Exposes a 1-click "Download & Cache Runtimes" action in Settings, fetching core compilers with live percentage progress tracking.
- **Cache Management**:
  - `isRuntimeCached()`: Verifies if assets are ready offline.
  - `clearSandboxRuntimeCache()`: Purges cached binaries to free browser storage.

---

## 3. Language Runners

Runners reside in [`src/lib/sandbox/runners/`](file:///home/oloty/Dev/CaffeineMD/src/lib/sandbox/runners/):

| Runner | Languages | Engine / Strategy | Capabilities & Constraints |
| :--- | :--- | :--- | :--- |
| **`pythonRunner.ts`** | `python`, `py` | [Pyodide](https://pyodide.org/) WebAssembly | MicroPython/CPython in WASM. Auto-loads micropip packages on demand. |
| **`jsTsRunner.ts`** | `javascript`, `typescript`, `ts`, `js` | TypeScript Compiler + `AsyncFunction` | Transpiles TS to JS via cached `typescript.min.js`, intercepts `console.log/warn/error`. |
| **`sqlRunner.ts`** | `sql`, `sqlite` | [sql.js](https://sql.js.org/) (SQLite WASM) | In-memory relational database. Executes DDL/DML and formats result sets as Markdown/HTML tables. |
| **`luaRunner.ts`** | `lua` | [Fengari](https://fengari.io/) Lua 5.3 WASM | Complete Lua VM. Redirects `print()` outputs to execution streams. |
| **`bashRunner.ts`** | `bash`, `sh`, `shell` | Client-Side POSIX Emulator | Emulates standard POSIX utilities (`echo`, `grep`, `awk`, `cat`, pipes, arithmetic). |
| **`jsonHtmlRunner.ts`**| `json`, `html`, `svg` | Client Parser & Safe Preview | Validates and formats JSON structures; renders live preview for HTML/SVG fragments. |
| **`compiledRunner.ts`**| `rust`, `cpp`, `c`, `go` | [Compiler Explorer](https://godbolt.org/) REST API | Compiles source online via Godbolt and returns assembly or simulated stdout. |

### 3.1 Adding a New Language Runner

To integrate a new language runner (e.g., Ruby via ruby.wasm):
1. Create `src/lib/sandbox/runners/rubyRunner.ts` implementing `LanguageRunner`:
   ```ts
   import { LanguageRunner, RunnerExecutionContext } from './types';
   import { fetchWithRuntimeCache } from '../runtimeCache';

   export const rubyRunner: LanguageRunner = {
     language: 'ruby',
     async execute(code: string, context: RunnerExecutionContext) {
       context.emitStatus('Initializing Ruby WASM...');
       const resp = await fetchWithRuntimeCache('https://cdn.jsdelivr.net/.../ruby.wasm');
       // Instantiate and execute code...
       return { success: true, output: 'Result' };
     }
   };
   ```
2. Register the runner in `src/lib/sandbox/sandboxWorker.ts` in the runner switch map.
3. Add the compiler asset to `RUNTIME_ASSETS` in `runtimeCache.ts` if offline caching is desired.

---

## 4. Editor Integration

### 4.1 CodeBlockView (`CodeBlockView.tsx`)
- Registered as Tiptap's React Node View for `codeBlock`.
- Renders code block chrome:
  - Language selector dropdown with automatic language detection (`detectCodeLanguage`).
  - Copy code button (`⌘C`).
  - **Run Button**: Triggered via button click or `Shift+Enter` inside the block.
  - Duration pill showing execution time (e.g., `124ms`).

### 4.2 Output Drawer (`CodeBlockOutputDrawer.tsx`)
- Appears docked immediately below the code block upon execution.
- Features:
  - Color-coded output tabs: `stdout` (normal output), `stderr` (errors), `table` (formatted SQL results).
  - Status messages (e.g., "Downloading runtime...") that cleanly self-dismiss once execution completes without leaving stale loading text.
  - **"Insert Output Below"**: Appends execution results directly into the note as a Markdown quote or table.
