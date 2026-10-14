'use client';

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/src/lib/utils';

const modalContentVariants = cva(
  'relative w-full rounded-xl border border-[var(--border)] bg-[var(--card)] text-[var(--foreground)] shadow-2xl transition-all overflow-hidden',
  {
    variants: {
      size: {
        sm: 'max-w-sm p-5',
        md: 'max-w-md p-6',
        lg: 'max-w-2xl p-6',
        xl: 'max-w-4xl p-6',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

export interface ModalShellProps extends VariantProps<typeof modalContentVariants> {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

export function ModalShell({
  isOpen,
  onClose,
  title,
  description,
  size,
  children,
  footer,
  className,
}: ModalShellProps) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className={cn(modalContentVariants({ size }), className)}>
        {title && (
          <div className="mb-4 flex items-center justify-between border-b border-[var(--border)] pb-3">
            <div>
              <h2 className="text-base font-semibold tracking-tight">{title}</h2>
              {description && (
                <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">{description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-[var(--muted-foreground)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-colors cursor-pointer"
              aria-label="Close modal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div>{children}</div>
        {footer && (
          <div className="mt-5 flex items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
