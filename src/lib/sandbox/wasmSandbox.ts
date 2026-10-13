import { ExecutionRequest, ExecutionResponse } from './types';

class WasmSandboxManager {
  private worker: Worker | null = null;
  private pendingRequests = new Map<
    string,
    {
      resolve: (res: ExecutionResponse) => void;
      reject: (err: any) => void;
      timer: ReturnType<typeof setTimeout>;
      startTime: number;
      outputs: ExecutionResponse['outputs'];
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

        if (type === 'output') {
          req.outputs.push(payload);
        } else if (type === 'complete') {
          clearTimeout(req.timer);
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
    code: string
  ): Promise<ExecutionResponse> {
    if (!this.worker) this.initWorker();
    const id = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        // Hard kill on infinite loops (5000ms protection limit)
        if (this.worker) {
          try {
            this.worker.terminate();
          } catch {}
        }
        this.worker = null;
        this.initWorker();

        const req = this.pendingRequests.get(id);
        if (req) {
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
        }
      }, 5000);

      this.pendingRequests.set(id, {
        resolve,
        reject,
        timer,
        startTime: performance.now(),
        outputs: [],
      });

      if (this.worker) {
        this.worker.postMessage({ id, language, code });
      } else {
        clearTimeout(timer);
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
}

export const wasmSandbox = new WasmSandboxManager();
