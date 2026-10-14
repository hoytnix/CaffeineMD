'use client';

import React from 'react';
import Link from 'next/link';
import { Share2, PlusSquare, ArrowRight } from 'lucide-react';
import { PwaInstallState } from './hooks/usePwaInstall';
import { ModalShell } from '@/src/components/common/ModalShell';

interface InstallModalProps {
  installState: PwaInstallState;
}

export const InstallModal: React.FC<InstallModalProps> = ({ installState }) => {
  const { showManualGuide, setShowManualGuide, isIOS, editorHref } = installState;

  if (!showManualGuide) return null;

  return (
    <ModalShell
      isOpen={showManualGuide}
      onClose={() => setShowManualGuide(false)}
      size="md"
      className="bg-[#0e1411] border-emerald-500/30 text-left"
      title={
        <div className="flex items-center gap-2 text-emerald-400 font-semibold text-base">
          <span>☕</span>
          <span>Install CaffeineMD Native App</span>
        </div>
      }
      footer={
        <div className="flex flex-col sm:flex-row gap-3 w-full">
          <Link
            href={editorHref}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors text-center"
          >
            <span>Launch Web App</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            type="button"
            onClick={() => setShowManualGuide(false)}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      }
    >
      {isIOS ? (
        <div className="space-y-3 mb-2 text-sm text-[#c8d4ce]">
          <p className="text-white font-medium">To install on iOS Safari:</p>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <Share2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span>1. Tap the <strong>Share</strong> button in your Safari toolbar.</span>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
            <PlusSquare className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <span>2. Scroll down and select <strong>&quot;Add to Home Screen&quot;</strong>.</span>
          </div>
        </div>
      ) : (
        <div className="space-y-3 mb-2 text-sm text-[#c8d4ce]">
          <p className="text-white font-medium">To install on Chrome, Edge, or Desktop:</p>
          <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 leading-relaxed">
            Click the <strong>Install CaffeineMD</strong> icon directly in your address bar (or browser menu ➔ <em>Install CaffeineMD</em>).
          </div>
        </div>
      )}
    </ModalShell>
  );
};
