'use client';

import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { Copy, Check, Play, Loader2 } from 'lucide-react';
import { wasmSandbox } from '@/src/lib/sandbox/wasmSandbox';
import { ExecutionOutputItem, SupportedSandboxLang } from '@/src/lib/sandbox/types';
import { CodeBlockOutputDrawer } from './CodeBlockOutputDrawer';

function resolveSandboxLanguage(rawLang: string): SupportedSandboxLang | null {
  const l = (rawLang || '').toLowerCase().trim();
  if (l === 'python' || l === 'py') return 'python';
  if (l === 'javascript' || l === 'js') return 'javascript';
  if (l === 'typescript' || l === 'ts') return 'typescript';
  if (l === 'math') return 'math';
  return null;
}

export function CodeBlockView({ node, editor, getPos }: NodeViewProps) {
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [outputs, setOutputs] = useState<ExecutionOutputItem[]>([]);
  const [executionTimeMs, setExecutionTimeMs] = useState<number | null>(null);

  const rawLanguage = node.attrs?.language || '';
  const detectedLang = resolveSandboxLanguage(rawLanguage);
  const activeLang: SupportedSandboxLang = detectedLang || 'javascript';
  const isExecutable = Boolean(detectedLang);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const text = node.textContent || '';
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleRun = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isRunning) return;

    setIsRunning(true);
    setOutputs([]);
    setExecutionTimeMs(null);

    try {
      const code = node.textContent || '';
      const response = await wasmSandbox.runCode(
        activeLang,
        code,
        (streamedItem) => {
          setOutputs((prev) => [...prev, streamedItem]);
        }
      );
      setOutputs(response.outputs);
      setExecutionTimeMs(response.executionTimeMs);
    } catch (err: any) {
      setOutputs([
        {
          type: 'error',
          text: err?.message || String(err),
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  const handleInsertIntoNote = () => {
    if (!editor || !getPos || outputs.length === 0) return;
    const pos = getPos();
    if (typeof pos !== 'number') return;

    // Filter out raw status events from note insertion
    const filteredOutputs = outputs.filter((o) => o.type !== 'status');
    if (filteredOutputs.length === 0) return;

    const endPos = pos + node.nodeSize;
    const outputLines = filteredOutputs.map((o) => o.text).join('\n');
    const header = `Output (${executionTimeMs !== null ? `${executionTimeMs}ms` : 'sandbox'}):`;

    editor
      .chain()
      .focus()
      .insertContentAt(endPos, [
        {
          type: 'blockquote',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: `${header}\n${outputLines}`,
                },
              ],
            },
          ],
        },
      ])
      .run();
  };

  return (
    <NodeViewWrapper as="div" className="relative group my-4 rounded-lg bg-[var(--card)] border border-[var(--border)] overflow-hidden">
      {/* Top action toolbar */}
      <div
        contentEditable={false}
        className="flex items-center justify-between px-3 py-1.5 bg-neutral-900/60 dark:bg-black/60 border-b border-[var(--border)] text-xs select-none"
      >
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] text-neutral-400 uppercase tracking-wider">
            {rawLanguage || 'plaintext'}
          </span>
          {isExecutable && (
            <span className="px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-medium border border-indigo-500/20">
              Runnable
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Run button */}
          {isExecutable && (
            <button
              type="button"
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-50"
              title="Run code in isolated WASM sandbox"
            >
              {isRunning ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  <span>Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  <span>Run</span>
                </>
              )}
            </button>
          )}

          {/* Copy button */}
          <button
            type="button"
            onClick={handleCopy}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-neutral-200 transition-colors cursor-pointer"
            aria-label="Copy code"
            title="Copy code"
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Editor Content pre */}
      <pre className="p-3 overflow-x-auto font-mono text-[13.5px] leading-relaxed bg-transparent m-0 border-0">
        <NodeViewContent<'code'> as="code" />
      </pre>

      {/* Output terminal drawer */}
      <CodeBlockOutputDrawer
        outputs={outputs}
        executionTimeMs={executionTimeMs}
        onInsertIntoNote={handleInsertIntoNote}
        onClear={() => setOutputs([])}
      />
    </NodeViewWrapper>
  );
}
