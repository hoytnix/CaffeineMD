'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, KeyRound, Check, AlertCircle, Loader2, ExternalLink } from 'lucide-react';
import { db } from '@/src/lib/storage/db';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { GEMINI_CANDIDATE_MODELS } from '@/src/lib/export/geminiTemplateGenerator';

export function GeminiSettingsCard() {
  const activeWorkspaceId = useWorkspaceStore((s) => s.activeWorkspaceId);
  const [apiKey, setApiKey] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('caffeinemd-gemini-api-key') || '' : ''
  );
  const [isTesting, setIsTesting] = useState(false);
  const [status, setStatus] = useState<{ ok?: boolean; message?: string } | null>(null);

  const handleSaveApiKey = (key: string) => {
    const trimmed = key.trim();
    setApiKey(trimmed);
    if (typeof window !== 'undefined') {
      localStorage.setItem('caffeinemd-gemini-api-key', trimmed);
    }
    if (activeWorkspaceId) {
      db.workspaces.update(activeWorkspaceId, { geminiApiKey: trimmed }).catch(() => {});
    }
    setStatus(null);
  };

  const handleTestKey = async () => {
    if (!apiKey) return;
    setIsTesting(true);
    setStatus(null);

    let verified = false;
    let lastErrorMessage = '';

    for (const model of GEMINI_CANDIDATE_MODELS) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
          apiKey.trim()
        )}`;
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ role: 'user', parts: [{ text: 'Respond with OK' }] }],
            generationConfig: { maxOutputTokens: 5 },
          }),
        });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error?.message || `API Error: ${res.status} (${model})`);
        }

        verified = true;
        setStatus({ ok: true, message: `Gemini API key is verified & operational (${model})` });
        break;
      } catch (err: any) {
        lastErrorMessage = err?.message || 'Verification failed';
        if (lastErrorMessage.includes('API_KEY_INVALID') || lastErrorMessage.includes('API key not valid')) {
          break;
        }
      }
    }

    if (!verified) {
      setStatus({ ok: false, message: lastErrorMessage || 'Verification failed' });
    }
    setIsTesting(false);
  };

  return (
    <div>
      <div className="px-3 mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          AI Theme Studio &amp; Jinja Generator (Gemini BYOK)
        </span>
      </div>

      <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden shadow-xs text-xs">
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[var(--foreground)] font-medium block">
                Google Gemini API Key
              </span>
              <span className="text-neutral-400 text-[11px]">
                Powers client-side Jinja theme generation for PWA &amp; Standalone HTML exports.
              </span>
            </div>
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 shrink-0"
            >
              Get Key <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <KeyRound className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="password"
                value={apiKey}
                onChange={(e) => handleSaveApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleTestKey}
              disabled={!apiKey || isTesting}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-neutral-800 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Test Key'}
            </button>
          </div>

          {status && (
            <div
              className={`flex items-center gap-1.5 text-[11px] ${
                status.ok ? 'text-emerald-500' : 'text-rose-500'
              }`}
            >
              {status.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{status.message}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
