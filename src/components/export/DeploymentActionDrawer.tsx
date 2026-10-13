'use client';

import React, { useState } from 'react';
import { VaultFile } from '@/src/lib/storage/db';
import { updateNoteDeployMeta } from '@/src/lib/storage/repositories/noteRepository';
import { deployZipToNetlify } from '@/src/lib/export/deployers/netlifyDeployer';
import { deployToGitHubPages } from '@/src/lib/export/deployers/githubDeployer';
import { generatePwaZipBundle, PwaExportBundleOptions } from '@/src/lib/export/pwaExporter';
import JSZip from 'jszip';
import {
  Cloud,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  Github,
} from 'lucide-react';

interface DeploymentActionDrawerProps {
  activeNote: VaultFile;
  bundleOptions: PwaExportBundleOptions;
  onToast: (msg: string) => void;
}

type DeployStage = 'idle' | 'bundling' | 'uploading' | 'live' | 'error';

export function DeploymentActionDrawer({
  activeNote,
  bundleOptions,
  onToast,
}: DeploymentActionDrawerProps) {
  const [deployStage, setDeployStage] = useState<DeployStage>('idle');
  const [stageMessage, setStageMessage] = useState('');
  const [liveUrl, setLiveUrl] = useState(
    () => activeNote.deployMeta?.netlifyUrl || activeNote.deployMeta?.githubUrl || ''
  );
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleDeployNetlify = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('caffeinemd-netlify-token') : null;
    if (!token) {
      setDeployStage('error');
      setErrorMessage('Netlify Token not configured. Please add your token in Settings > Storage.');
      return;
    }

    setDeployStage('bundling');
    setStageMessage('Bundling PWA assets...');
    setErrorMessage('');

    try {
      const zipBlob = await generatePwaZipBundle(activeNote, bundleOptions);

      setDeployStage('uploading');
      setStageMessage('Uploading to Netlify Edge CDN...');

      const existingSiteId = activeNote.deployMeta?.netlifySiteId;
      const res = await deployZipToNetlify(zipBlob, {
        token,
        siteId: existingSiteId,
        siteName: bundleOptions.appId.replace(/[^a-zA-Z0-9-]/g, '-'),
      });

      if (!res.success) {
        setDeployStage('error');
        setErrorMessage(res.error || 'Netlify deployment failed');
        return;
      }

      setDeployStage('live');
      setLiveUrl(res.url);
      setStageMessage(`Live at ${res.url}`);

      // Persist deployment metadata to note
      await updateNoteDeployMeta(activeNote.path, {
        netlifySiteId: res.siteId,
        netlifyUrl: res.url,
      });

      onToast('Successfully deployed to Netlify!');
    } catch (err: any) {
      setDeployStage('error');
      setErrorMessage(err?.message || 'Deployment failed');
    }
  };

  const handleDeployGitHub = async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('caffeinemd-github-token') : null;
    const repoStr = typeof window !== 'undefined' ? localStorage.getItem('caffeinemd-default-github-repo') : null;

    if (!token || !repoStr || !repoStr.includes('/')) {
      setDeployStage('error');
      setErrorMessage('GitHub Token or Default Repo (owner/repo) not configured in Settings > Storage.');
      return;
    }

    const [owner, repo] = repoStr.split('/');
    setDeployStage('bundling');
    setStageMessage('Bundling PWA & extracting static files...');
    setErrorMessage('');

    try {
      const zipBlob = await generatePwaZipBundle(activeNote, bundleOptions);
      const zip = await JSZip.loadAsync(zipBlob);

      const files: Array<{ path: string; content: string | Uint8Array }> = [];
      for (const [relativePath, zipEntry] of Object.entries(zip.files)) {
        if (!zipEntry.dir) {
          const content = await zipEntry.async('uint8array');
          files.push({ path: relativePath, content });
        }
      }

      setDeployStage('uploading');
      setStageMessage(`Publishing to ${owner}/${repo} (gh-pages)...`);

      const res = await deployToGitHubPages(files, {
        token,
        owner,
        repo,
        branch: 'gh-pages',
        commitMessage: `Deploy ${bundleOptions.appName} via CaffeineMD`,
      });

      if (!res.success) {
        setDeployStage('error');
        setErrorMessage(res.error || 'GitHub Pages deployment failed');
        return;
      }

      setDeployStage('live');
      setLiveUrl(res.url);
      setStageMessage(`Live at ${res.url}`);

      await updateNoteDeployMeta(activeNote.path, {
        githubRepo: repoStr,
        githubUrl: res.url,
      });

      onToast('Published to GitHub Pages!');
    } catch (err: any) {
      setDeployStage('error');
      setErrorMessage(err?.message || 'GitHub Pages deployment failed');
    }
  };

  const copyLiveLink = () => {
    if (!liveUrl) return;
    navigator.clipboard.writeText(liveUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="p-3.5 rounded-xl bg-[var(--background)] border border-[var(--border)] space-y-3 text-xs">
      <div className="flex items-center justify-between">
        <span className="font-semibold text-neutral-300 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
          <Cloud className="w-3.5 h-3.5 text-indigo-400" />
          1-Click Cloud Deployment
        </span>
        {activeNote.deployMeta?.lastDeployedAt && (
          <span className="text-[10px] text-neutral-500 font-mono">
            Last: {new Date(activeNote.deployMeta.lastDeployedAt).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={handleDeployNetlify}
          disabled={deployStage === 'bundling' || deployStage === 'uploading'}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-teal-500/15 hover:bg-teal-500/25 text-teal-400 border border-teal-500/30 font-medium transition-all cursor-pointer disabled:opacity-50"
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>Deploy to Netlify (Drop)</span>
        </button>

        <button
          type="button"
          onClick={handleDeployGitHub}
          disabled={deployStage === 'bundling' || deployStage === 'uploading'}
          className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 font-medium transition-all cursor-pointer disabled:opacity-50"
        >
          <Github className="w-3.5 h-3.5" />
          <span>Publish to GitHub Pages</span>
        </button>
      </div>

      {/* Progress Indicator */}
      {(deployStage === 'bundling' || deployStage === 'uploading') && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
          <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
          <span className="text-[11.5px] font-medium">{stageMessage}</span>
        </div>
      )}

      {/* Error State */}
      {deployStage === 'error' && errorMessage && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20 text-[11px]">
          <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Live Preview Card */}
      {liveUrl && (
        <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-2 animate-in fade-in duration-200">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-semibold text-emerald-400 block tracking-wider">
                Deployed &amp; Live
              </span>
              <a
                href={liveUrl}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-300 font-mono text-[11px] hover:underline flex items-center gap-1 truncate"
              >
                <span className="truncate">{liveUrl}</span>
                <ExternalLink className="w-3 h-3 shrink-0" />
              </a>
            </div>
          </div>

          <button
            type="button"
            onClick={copyLiveLink}
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] transition-colors cursor-pointer shrink-0"
            title="Copy live link"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
