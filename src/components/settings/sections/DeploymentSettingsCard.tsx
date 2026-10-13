'use client';

import React, { useState, useEffect } from 'react';
import { testNetlifyConnection } from '@/src/lib/export/deployers/netlifyDeployer';
import { testGitHubConnection } from '@/src/lib/export/deployers/githubDeployer';
import { Cloud, Check, AlertCircle, Loader2, KeyRound, ExternalLink } from 'lucide-react';

export function DeploymentSettingsCard() {
  const [netlifyToken, setNetlifyToken] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('caffeinemd-netlify-token') || '' : ''
  );
  const [githubToken, setGithubToken] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('caffeinemd-github-token') || '' : ''
  );
  const [defaultGithubRepo, setDefaultGithubRepo] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('caffeinemd-default-github-repo') || '' : ''
  );

  const [isTestingNetlify, setIsTestingNetlify] = useState(false);
  const [netlifyStatus, setNetlifyStatus] = useState<{ ok?: boolean; message?: string } | null>(null);

  const [isTestingGitHub, setIsTestingGitHub] = useState(false);
  const [githubStatus, setGithubStatus] = useState<{ ok?: boolean; message?: string } | null>(null);

  const handleSaveNetlify = (token: string) => {
    setNetlifyToken(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('caffeinemd-netlify-token', token.trim());
    }
    setNetlifyStatus(null);
  };

  const handleSaveGitHub = (token: string) => {
    setGithubToken(token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('caffeinemd-github-token', token.trim());
    }
    setGithubStatus(null);
  };

  const handleSaveRepo = (repo: string) => {
    setDefaultGithubRepo(repo);
    if (typeof window !== 'undefined') {
      localStorage.setItem('caffeinemd-default-github-repo', repo.trim());
    }
  };

  const handleTestNetlify = async () => {
    if (!netlifyToken) return;
    setIsTestingNetlify(true);
    const res = await testNetlifyConnection(netlifyToken);
    setIsTestingNetlify(false);
    setNetlifyStatus({ ok: res.success, message: res.success ? `Connected: ${res.email}` : res.error });
  };

  const handleTestGitHub = async () => {
    if (!githubToken) return;
    setIsTestingGitHub(true);
    const res = await testGitHubConnection(githubToken);
    setIsTestingGitHub(false);
    setGithubStatus({ ok: res.success, message: res.success ? `Authenticated as @${res.username}` : res.error });
  };

  return (
    <div>
      <div className="px-3 mb-2 flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center gap-1.5">
          <Cloud className="w-3.5 h-3.5" />
          1-Click Cloud Deployment Integrations
        </span>
      </div>

      <div className="rounded-2xl bg-[var(--card)] border border-[var(--border)] divide-y divide-[var(--border)] overflow-hidden shadow-xs text-xs">
        {/* Netlify Token Row */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[var(--foreground)] font-medium block">
                Netlify Personal Access Token
              </span>
              <span className="text-neutral-400 text-[11px]">
                Enables instant drag-drop zip deployments to Netlify Edge CDN.
              </span>
            </div>
            <a
              href="https://app.netlify.com/user/applications#personal-access-tokens"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 shrink-0"
            >
              Get Token <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <KeyRound className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="password"
                value={netlifyToken}
                onChange={(e) => handleSaveNetlify(e.target.value)}
                placeholder="nfp_..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleTestNetlify}
              disabled={!netlifyToken || isTestingNetlify}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-neutral-800 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              {isTestingNetlify ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Test'}
            </button>
          </div>

          {netlifyStatus && (
            <div className={`flex items-center gap-1.5 text-[11px] ${netlifyStatus.ok ? 'text-emerald-500' : 'text-rose-500'}`}>
              {netlifyStatus.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{netlifyStatus.message}</span>
            </div>
          )}
        </div>

        {/* GitHub Pages Token Row */}
        <div className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[var(--foreground)] font-medium block">
                GitHub Personal Access Token (`repo` scope)
              </span>
              <span className="text-neutral-400 text-[11px]">
                Enables Git commits directly to the `gh-pages` branch.
              </span>
            </div>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo&description=CaffeineMD%20Pages%20Deployer"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-[var(--accent)] hover:underline flex items-center gap-1 shrink-0"
            >
              Create Token <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <KeyRound className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-neutral-400 pointer-events-none" />
              <input
                type="password"
                value={githubToken}
                onChange={(e) => handleSaveGitHub(e.target.value)}
                placeholder="ghp_..."
                className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] font-mono"
              />
            </div>
            <button
              type="button"
              onClick={handleTestGitHub}
              disabled={!githubToken || isTestingGitHub}
              className="px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] hover:bg-neutral-800 text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40"
            >
              {isTestingGitHub ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Test'}
            </button>
          </div>

          {githubStatus && (
            <div className={`flex items-center gap-1.5 text-[11px] ${githubStatus.ok ? 'text-emerald-500' : 'text-rose-500'}`}>
              {githubStatus.ok ? <Check className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
              <span>{githubStatus.message}</span>
            </div>
          )}

          <div className="pt-1">
            <span className="text-[10px] text-neutral-400 block mb-1">Default Repository (`owner/repo`)</span>
            <input
              type="text"
              value={defaultGithubRepo}
              onChange={(e) => handleSaveRepo(e.target.value)}
              placeholder="e.g. username/my-vault-docs"
              className="w-full px-2.5 py-1.5 rounded-lg bg-[var(--background)] border border-[var(--border)] text-xs text-[var(--foreground)] outline-none focus:border-[var(--accent)] font-mono"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
