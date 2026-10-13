export type SupportedSandboxLang = 'javascript' | 'typescript' | 'python' | 'math';

export interface ExecutionRequest {
  id: string;
  language: SupportedSandboxLang;
  code: string;
}

export interface ExecutionOutputItem {
  type: 'stdout' | 'stderr' | 'result' | 'error';
  text: string;
  timestamp: number;
}

export interface ExecutionResponse {
  id: string;
  success: boolean;
  outputs: ExecutionOutputItem[];
  executionTimeMs: number;
}
