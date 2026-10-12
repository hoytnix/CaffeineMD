'use client';

import React from 'react';
import { Download, Sparkles, CheckCircle2 } from 'lucide-react';
import { PwaInstallState } from './hooks/usePwaInstall';

interface InstallButtonProps {
  installState: PwaInstallState;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'subtle';
  label?: string;
  className?: string;
}

export const InstallButton: React.FC<InstallButtonProps> = ({
  installState,
  size = 'md',
  variant = 'primary',
  label,
  className = '',
}) => {
  const { isInstalled, isInstalling, deferredPrompt, handleInstallClick } = installState;

  const sizeClasses = {
    sm: 'px-4 py-2 text-xs gap-1.5 rounded-lg',
    md: 'px-6 py-3 text-sm gap-2 rounded-xl',
    lg: 'px-8 py-4 text-base gap-2.5 rounded-xl',
  }[size];

  const variantClasses =
    variant === 'primary'
      ? 'bg-emerald-500 hover:bg-emerald-400 text-black font-semibold shadow-lg shadow-emerald-500/20'
      : 'bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 font-medium';

  return (
    <button
      onClick={handleInstallClick}
      disabled={isInstalling}
      className={`inline-flex items-center justify-center transition-all duration-150 transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer disabled:opacity-80 select-none ${sizeClasses} ${variantClasses} ${className}`}
    >
      {isInstalled ? (
        <>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{label ? `${label}ed` : 'Installed! Opening...'}</span>
        </>
      ) : isInstalling ? (
        <>
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin shrink-0" />
          <span>{label ? `${label}ing...` : 'Installing CaffeineMD...'}</span>
        </>
      ) : deferredPrompt ? (
        <>
          <Sparkles className="w-4 h-4 animate-pulse shrink-0" />
          <span>{label || 'Install CaffeineMD (Native App)'}</span>
        </>
      ) : (
        <>
          <Download className="w-4 h-4 shrink-0" />
          <span>{label || 'Install CaffeineMD (PWA)'}</span>
        </>
      )}
    </button>
  );
};
