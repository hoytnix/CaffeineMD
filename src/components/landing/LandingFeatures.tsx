'use client';

import React from 'react';
import {
  HardDrive,
  Zap,
  Network,
  Database,
  AlignLeft,
  GitCompare,
} from 'lucide-react';
import { InstallButton } from './InstallButton';
import { PwaInstallState } from './hooks/usePwaInstall';

interface LandingFeaturesProps {
  installState: PwaInstallState;
}

export const LandingFeatures: React.FC<LandingFeaturesProps> = ({ installState }) => {
  const features = [
    {
      icon: HardDrive,
      title: 'Local-First Hardware Mount',
      desc: 'Mount real OS folders via Native File System Access (showDirectoryPicker) or WebKit crawler. Real .md files on your SSD—not a cloud silo.',
    },
    {
      icon: Zap,
      title: 'Tiptap & ProseMirror Engine',
      desc: 'Fluid block editing with slash commands (/), drag handles, task lists, code blocks with syntax highlighting, and inline image markdown roundtrips.',
    },
    {
      icon: Network,
      title: 'Bi-Directional Knowledge Graph',
      desc: 'Obsidian-grade [[WikiLink]] indexing with D3 force-directed physics graph. Visualize and navigate connections across your entire vault.',
    },
    {
      icon: Database,
      title: 'Frontmatter Databases',
      desc: 'Turn note YAML metadata into Notion-style Table views, Kanban boards (status & Eisenhower matrix), and queryable tag clouds.',
    },
    {
      icon: AlignLeft,
      title: 'Plaintext Gutter Sync',
      desc: 'Toggle between rich text and raw plaintext. Off-screen DOM mirror dynamically measures wrapped line heights for pixel-exact line numbers.',
    },
    {
      icon: GitCompare,
      title: 'Unsaved Diff Viewer',
      desc: 'Inspect in-memory working edits against saved disk state side-by-side before committing changes, with instant revert capabilities.',
    },
  ];

  return (
    <section id="features" className="py-20 px-4 max-w-6xl mx-auto border-t border-white/5">
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-400 mb-3">
          POWERED BY LOCAL HARDWARE
        </h2>
        <h3 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight mb-4">
          Engineered for notes without limits.
        </h3>
        <p className="text-base text-[#94a39b]">
          Every feature is built locally into your browser client. Zero remote database lag, 100% offline uptime.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {features.map((feat) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.title}
              className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-emerald-500/30 transition-all duration-200 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-105 transition-transform">
                <Icon className="w-5 h-5" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{feat.title}</h4>
              <p className="text-sm text-[#87968e] leading-relaxed">{feat.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Interspersed CTA Banner */}
      <div className="rounded-2xl border border-emerald-500/20 bg-emerald-950/20 p-8 flex flex-col sm:flex-row items-center justify-between gap-6 backdrop-blur-sm">
        <div className="text-left">
          <h4 className="text-xl font-bold text-white mb-1">Ready for a faster Markdown workflow?</h4>
          <p className="text-sm text-[#94a39b]">Install the standalone PWA in one click and keep your data 100% sovereign.</p>
        </div>
        <InstallButton installState={installState} size="md" />
      </div>
    </section>
  );
};
