'use client';

import { useState, useEffect } from 'react';

export interface KeyboardOffsetState {
  keyboardOffset: number;
  isKeyboardOpen: boolean;
}

/**
 * Tracks the visual viewport on mobile devices to detect on-screen keyboards
 * and return the occluded bottom offset in pixels.
 */
export function useKeyboardOffset(): KeyboardOffsetState {
  const [offsetState, setOffsetState] = useState<KeyboardOffsetState>({
    keyboardOffset: 0,
    isKeyboardOpen: false,
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const update = () => {
      const vv = window.visualViewport;
      const offsetBottom = vv
        ? Math.max(0, window.innerHeight - (vv.height + vv.offsetTop))
        : 0;

      setOffsetState({
        keyboardOffset: Math.round(offsetBottom),
        isKeyboardOpen: offsetBottom > 80,
      });
    };

    update();

    const vv = window.visualViewport;
    if (vv) {
      vv.addEventListener('resize', update);
      vv.addEventListener('scroll', update);
    }
    window.addEventListener('resize', update);

    return () => {
      if (vv) {
        vv.removeEventListener('resize', update);
        vv.removeEventListener('scroll', update);
      }
      window.removeEventListener('resize', update);
    };
  }, []);

  return offsetState;
}
