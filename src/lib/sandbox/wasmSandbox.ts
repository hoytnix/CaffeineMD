import { ExecutionOutputItem, ExecutionRequest, ExecutionResponse } from './types';

class WasmSandboxManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (res: ExecutionResponse) => void;
      reject: (err: any) => void;
      initTimer: ReturnType<typeof setTimeout> | null;
      execTimer: ReturnType<typeof setTimeout> | null;
      startTime: number;
      outputs: ExecutionResponse['outputs'];
      onOutput?: (output: ExecutionOutputItem) => void;
    }
  >();

  constructor() {
    this.initWorker();
  }

  private initWorker() {
    if (typeof window === 'undefined') return;
    try {
      this.worker = new Worker(new URL('./sandboxWorker.ts', import.meta.url), {
        type: 'module',
      });

      this.worker.onmessage = (event: MessageEvent) => {
        const { type, id, payload } = event.data;
        const req = this.pendingRequests.get(id);
        if (!req) return;

        if (type === 'status') {
          const item: ExecutionOutputItem = {
            type: 'status',
            text: payload.text,
            timestamp: Date.now(),
          };
          req.outputs.push(item);
          req.onOutput?.(item);
        } else if (type === 'execution_started') {
          // Disarm runtime init timer
          if (req.initTimer) clearTimeout(req.initTimer);
          req.startTime = performance.now();

          // Arm strict 5000ms code-execution watchdog only when code begins running
          req.execTimer = setTimeout(() => {
            if (this.worker) {
              try {
                this.worker.terminate();
              } catch {}
            }
            this.initWorker();
            this.pendingRequests.delete(id);
            req.resolve({
              id,
              success: false,
              outputs: [
                ...req.outputs,
                {
                  type: 'error',
                  text: 'Execution timed out (5.0s limit exceeded)',
                  timestamp: Date.now(),
                },
              ],
              executionTimeMs: 5000,
            });
          }, 5000);
        } else if (type === 'output') {
          req.outputs.push(payload);
          req.onOutput?.(payload);
        } else if (type === 'complete') {
          if (req.initTimer) clearTimeout(req.initTimer);
          if (req.execTimer) clearTimeout(req.execTimer);

          const executionTimeMs = Math.round(performance.now() - req.startTime);
          this.pendingRequests.delete(id);
          req.resolve({
            id,
            success: Boolean(payload?.success),
            outputs: req.outputs,
            executionTimeMs,
          });
        }
      };

      this.worker.onerror = (err: ErrorEvent) => {
        console.error('Sandbox Worker Error:', err);
      };
    } catch (err) {
      console.warn('Failed to initialize Sandbox Worker:', err);
      this.worker = null;
    }
  }

  public async runCode(
    language: ExecutionRequest['language'],
    code: string,
    onOutput?: (output: ExecutionOutputItem) => void
  ): Promise<ExecutionResponse> {
    if (!this.worker) this.initWorker();
    const id = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return new Promise((resolve, reject) => {
      // 60-second grace window for CDN package downloads
      const initTimer = setTimeout(() => {
        const req = this.pendingRequests.get(id);
        if (req) {
          if (this.worker) {
            try {
              this.worker.terminate();
            } catch {}
          }
          this.initWorker();
          this.pendingRequests.delete(id);
          req.resolve({
            id,
            success: false,
            outputs: [
              ...req.outputs,
              {
                type: 'error',
                text: 'Runtime initialization timed out (failed to fetch Pyodide CDN assets)',
                timestamp: Date.now(),
              },
            ],
            executionTimeMs: 60000,
          });
        }
      }, 60000);

      this.pendingRequests.set(id, {
        resolve,
        reject,
        initTimer,
        execTimer: null,
        startTime: performance.now(),
        outputs: [],
        onOutput,
      });

      if (this.worker) {
        this.worker.postMessage({ id, language, code });
      } else {
        clearTimeout(initTimer);
        this.pendingRequests.delete(id);
        resolve({
          id,
          success: false,
          outputs: [{ type: 'error', text: 'Web Worker not available in this environment', timestamp: Date.now() }],
          executionTimeMs: 0,
        });
      }
    });
  }

  public async preloadPythonRuntime(): Promise<void> {
    try {
      await this.runCode('python', 'pass');
    } catch {}
  }
}

export const wasmSandbox = new WasmSandboxManager();
