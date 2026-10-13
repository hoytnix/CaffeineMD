export type SupportedSandboxLang = 'javascript' | 'typescript' | 'python' | 'math';

export type SandboxStatus = 'idle' | 'loading_runtime' | 'executing' | 'ready';

export interface ExecutionRequest {
  id: string;
  language: SupportedSandboxLang;
  code: string;
}

export interface ExecutionOutputItem {
  type: 'stdout' | 'stderr' | 'result' | 'error' | 'status';
  text: string;
  timestamp: number;
}

export interface ExecutionResponse {
  id: string;
  success: boolean;
  outputs: ExecutionOutputItem[];
  executionTimeMs: number;
}
