'use client';

import React, { useState, useEffect, useRef, CSSProperties } from 'react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';

export interface UseToolbarPopoverOptions {
  checkHasDragged?: () => boolean;
  popoverWidth?: number;
  popoverHeight?: number;
}

export function useToolbarPopover({
  checkHasDragged,
  popoverWidth = 192,
  popoverHeight = 220,
}: UseToolbarPopoverOptions = {}) {
  const { toolboxPosition } = useWorkspaceStore();
  const [isOpen, setIsOpen] = useState(false);
  const [popoverStyle, setPopoverStyle] = useState<CSSProperties | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const updateCoords = () => {
    if (!buttonRef.current || typeof window === 'undefined') return;
    const rect = buttonRef.current.getBoundingClientRect();

    if (toolboxPosition === 'top') {
      const horizontalCenter = rect.left + rect.width / 2;
      const clampedLeft = Math.max(
        popoverWidth / 2 + 12,
        Math.min(window.innerWidth - popoverWidth / 2 - 12, horizontalCenter)
      );
      setPopoverStyle({
        position: 'fixed',
        top: `${rect.bottom + 8}px`,
        left: `${clampedLeft}px`,
        transform: 'translateX(-50%)',
      });
    } else if (toolboxPosition === 'left') {
      const verticalCenter = rect.top + rect.height / 2;
      const clampedTop = Math.max(
        popoverHeight / 2 + 12,
        Math.min(window.innerHeight - popoverHeight / 2 - 12, verticalCenter)
      );
      setPopoverStyle({
        position: 'fixed',
        left: `${rect.right + 8}px`,
        top: `${clampedTop}px`,
        transform: 'translateY(-50%)',
      });
    } else if (toolboxPosition === 'right') {
      const verticalCenter = rect.top + rect.height / 2;
      const clampedTop = Math.max(
        popoverHeight / 2 + 12,
        Math.min(window.innerHeight - popoverHeight / 2 - 12, verticalCenter)
      );
      setPopoverStyle({
        position: 'fixed',
        right: `${window.innerWidth - rect.left + 8}px`,
        top: `${clampedTop}px`,
        transform: 'translateY(-50%)',
      });
    } else {
      // Default: 'bottom'
      const horizontalCenter = rect.left + rect.width / 2;
      const clampedLeft = Math.max(
        popoverWidth / 2 + 12,
        Math.min(window.innerWidth - popoverWidth / 2 - 12, horizontalCenter)
      );
      setPopoverStyle({
        position: 'fixed',
        bottom: `${window.innerHeight - rect.top + 8}px`,
        left: `${clampedLeft}px`,
        transform: 'translateX(-50%)',
      });
    }
  };

  const toggleOpen = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (checkHasDragged?.()) return;

    if (!isOpen) {
      updateCoords();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        menuRef.current &&
        !menuRef.current.contains(target) &&
        buttonRef.current &&
        !buttonRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    const handleDismiss = () => {
      setIsOpen(false);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('resize', handleDismiss);
    window.addEventListener('scroll', handleDismiss, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('resize', handleDismiss);
      window.removeEventListener('scroll', handleDismiss, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const animationClass =
    toolboxPosition === 'top'
      ? 'animate-in fade-in slide-in-from-top-2'
      : toolboxPosition === 'left'
      ? 'animate-in fade-in slide-in-from-left-2'
      : toolboxPosition === 'right'
      ? 'animate-in fade-in slide-in-from-right-2'
      : 'animate-in fade-in slide-in-from-bottom-2';

  return {
    isOpen,
    setIsOpen,
    popoverStyle,
    buttonRef,
    menuRef,
    toggleOpen,
    animationClass,
    toolboxPosition,
  };
}
