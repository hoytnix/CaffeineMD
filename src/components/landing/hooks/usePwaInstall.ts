'use client';

import { useState, useEffect, useCallback } from 'react';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const EDITOR_HREF = '/w/default-vault#/editor/Welcome%20to%20CaffeineMD.md';

export function usePwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showManualGuide, setShowManualGuide] = useState(false);
  const [isIOS] = useState(() => {
    if (typeof window === 'undefined') return false;
    const userAgent = window.navigator.userAgent.toLowerCase();
    return (
      /iphone|ipad|ipod/.test(userAgent) ||
      (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)
    );
  });

  const [isStandalone] = useState(() => {
    if (typeof window === 'undefined') return false;
    return (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );
  });

  useEffect(() => {
    if (isStandalone) {
      window.location.replace(EDITOR_HREF);
      return;
    }

    if (typeof window !== 'undefined') {
      if ('caches' in window) {
        caches.keys().then((keys) => {
          keys.forEach((key) => {
            if (key !== 'caffeinemd-v2') {
              caches.delete(key);
            }
          });
        });
      }

      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then((reg) => {
            reg.update();
          })
          .catch((err) => {
            console.warn('PWA service worker registration failed:', err);
          });
      }
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
      setIsInstalling(false);
      setTimeout(() => {
        window.location.replace(EDITOR_HREF);
      }, 700);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isStandalone]);

  const handleInstallClick = useCallback(async () => {
    if (isInstalled) {
      window.location.replace(EDITOR_HREF);
      return;
    }

    if (deferredPrompt) {
      setIsInstalling(true);
      try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        if (choice.outcome === 'accepted') {
          setIsInstalled(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.warn('Installation prompt error:', err);
      } finally {
        setIsInstalling(false);
      }
    } else {
      setShowManualGuide(true);
    }
  }, [deferredPrompt, isInstalled]);

  return {
    isStandalone,
    isInstalling,
    isInstalled,
    isIOS,
    showManualGuide,
    setShowManualGuide,
    handleInstallClick,
    deferredPrompt,
    editorHref: EDITOR_HREF,
  };
}

export type PwaInstallState = ReturnType<typeof usePwaInstall>;
