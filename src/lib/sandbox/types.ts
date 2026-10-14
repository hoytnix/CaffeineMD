export type SandboxLanguage =
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'sql'
  | 'html'
  | 'lua'
  | 'bash'
  | 'json'
  | 'rust'
  | 'go'
  | 'cpp'
  | 'c'
  | 'math';

export type SupportedSandboxLang = SandboxLanguage;

export type SandboxStatus = 'idle' | 'loading_runtime' | 'executing' | 'ready';

export interface ExecutionRequest {
  id: string;
  language: SandboxLanguage;
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
  htmlPreview?: string;
}

export type SandboxResult = ExecutionResponse;

export interface WorkerProgressMessage {
  id: string;
  status: 'runtime-loading' | 'runtime-ready';
  text?: string;
}

export type EmitFn = (type: 'stdout' | 'stderr' | 'result' | 'error', text: string) => void;

export type ProgressFn = (status: 'runtime-loading' | 'runtime-ready', text?: string) => void;

export interface RunnerContext {
  id: string;
  emit: EmitFn;
  progress: ProgressFn;
}

export interface RunnerResult {
  success: boolean;
  htmlPreview?: string;
  error?: string;
}
