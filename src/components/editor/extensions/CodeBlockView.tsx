'use client';

import React, { useState } from 'react';
import { NodeViewWrapper, NodeViewContent, NodeViewProps } from '@tiptap/react';
import { Copy, Check } from 'lucide-react';

export function CodeBlockView({ node }: NodeViewProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const text = node.textContent || '';
    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    });
  };

  return (
    <NodeViewWrapper as="pre" className="relative group">
      <button
        type="button"
        onClick={handleCopy}
        contentEditable={false}
        className="absolute top-2 right-2 p-1.5 rounded bg-foreground/10 hover:bg-foreground/20 text-muted-foreground hover:text-foreground backdrop-blur-sm transition-opacity opacity-0 group-hover:opacity-100 cursor-pointer z-10"
        aria-label="Copy code"
        title="Copy code"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-emerald-500" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
      <NodeViewContent<'code'> as="code" />
    </NodeViewWrapper>
  );
}
