'use client';

import React from 'react';
import Link from 'next/link';
import { X, Share2, PlusSquare, ArrowRight } from 'lucide-react';
import { PwaInstallState } from './hooks/usePwaInstall';

interface InstallModalProps {
  installState: PwaInstallState;
}

export const InstallModal: React.FC<InstallModalProps> = ({ installState }) => {
  const { showManualGuide, setShowManualGuide, isIOS, editorHref } = installState;

  if (!showManualGuide) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#0e1411] border border-emerald-500/30 rounded-2xl p-6 text-left shadow-2xl relative">
        <button
          onClick={() => setShowManualGuide(false)}
          className="absolute top-4 right-4 p-1 rounded-lg text-neutral-400 hover:text-white hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-4 text-emerald-400 font-semibold text-base">
          <span>☕</span>
          <span>Install CaffeineMD Native App</span>
        </div>

        {isIOS ? (
          <div className="space-y-3 mb-6 text-sm text-[#c8d4ce]">
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
          <div className="space-y-3 mb-6 text-sm text-[#c8d4ce]">
            <p className="text-white font-medium">To install on Chrome, Edge, or Desktop:</p>
            <div className="p-3 rounded-xl bg-white/[0.03] border border-white/5 leading-relaxed">
              Click the <strong>Install CaffeineMD</strong> icon directly in your address bar (or browser menu ➔ <em>Install CaffeineMD</em>).
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link
            href={editorHref}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-sm transition-colors text-center"
          >
            <span>Launch Web App</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <button
            onClick={() => setShowManualGuide(false)}
            className="px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-white text-sm font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
