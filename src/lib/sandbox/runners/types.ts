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
