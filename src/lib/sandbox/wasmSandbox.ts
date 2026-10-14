import { ExecutionOutputItem, ExecutionRequest, ExecutionResponse } from './types';

interface PendingRequest {
  resolve: (res: ExecutionResponse) => void;
  reject: (err: any) => void;
  initTimer: ReturnType<typeof setTimeout> | null;
  execTimer: ReturnType<typeof setTimeout> | null;
  startTime: number;
  outputs: ExecutionOutputItem[];
  onOutput?: (output: ExecutionOutputItem) => void;
  runtimeReady: boolean;
}

class WasmSandboxManager {
  private activeWorker: Worker | null = null;
  private pendingRequests = new Map<string, PendingRequest>();

  constructor() {
    this.ensureWorker();
  }

  private ensureWorker(): Worker | null {
    if (typeof window === 'undefined') return null;
    if (this.activeWorker) return this.activeWorker;

    try {
      this.activeWorker = new Worker(new URL('./sandboxWorker.ts', import.meta.url), {
        type: 'module',
      });

      this.activeWorker.onmessage = (event: MessageEvent) => {
        const { type, id, status, payload } = event.data;
        const req = this.pendingRequests.get(id);
        if (!req) return;

        // Handle runtime loading status
        if (status === 'runtime-loading' || type === 'status') {
          const item: ExecutionOutputItem = {
            type: 'status',
            text: payload?.text || 'Loading runtime...',
            timestamp: Date.now(),
          };
          req.outputs.push(item);
          req.onOutput?.(item);
        }

        // Start execution watchdog only when runtime is ready
        if (status === 'runtime-ready' || type === 'execution_started') {
          req.runtimeReady = true;
          if (req.initTimer) {
            clearTimeout(req.initTimer);
            req.initTimer = null;
          }
          req.startTime = performance.now();

          if (req.execTimer) clearTimeout(req.execTimer);
          req.execTimer = setTimeout(() => {
            // User code infinite loop detected after runtime loaded
            if (this.activeWorker) {
              try {
                this.activeWorker.terminate();
              } catch {}
              this.activeWorker = null;
            }
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
            htmlPreview: payload?.htmlPreview,
          });
        }
      };

      this.activeWorker.onerror = (err: ErrorEvent) => {
        console.error('Sandbox Worker Error:', err);
      };
    } catch (err) {
      console.warn('Failed to initialize Sandbox Worker:', err);
      this.activeWorker = null;
    }

    return this.activeWorker;
  }

  public async runCode(
    language: ExecutionRequest['language'],
    code: string,
    onOutput?: (output: ExecutionOutputItem) => void
  ): Promise<ExecutionResponse> {
    const worker = this.ensureWorker();
    const id = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return new Promise((resolve, reject) => {
      // 60-second grace window for CDN package downloads (not armed against code execution)
      const initTimer = setTimeout(() => {
        const req = this.pendingRequests.get(id);
        if (req && !req.runtimeReady) {
          if (this.activeWorker) {
            try {
              this.activeWorker.terminate();
            } catch {}
            this.activeWorker = null;
          }
          this.pendingRequests.delete(id);
          req.resolve({
            id,
            success: false,
            outputs: [
              ...req.outputs,
              {
                type: 'error',
                text: 'Runtime initialization timed out (failed to fetch WASM/CDN assets)',
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
        runtimeReady: false,
      });

      if (worker) {
        worker.postMessage({ id, language, code });
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
