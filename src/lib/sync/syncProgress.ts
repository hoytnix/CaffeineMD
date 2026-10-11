'use client';

import { useState, useEffect } from 'react';

export interface SyncProgressState {
  status: 'idle' | 'scanning' | 'syncing' | 'completed' | 'error';
  currentAction?: 'downloading' | 'uploading';
  totalFiles: number;
  processedFiles: number;
  currentFileName?: string;
  progressPercentage: number; // 0 - 100
  errorMessage?: string;
}

export const INITIAL_SYNC_PROGRESS: SyncProgressState = {
  status: 'idle',
  totalFiles: 0,
  processedFiles: 0,
  progressPercentage: 0,
};

type SyncProgressListener = (state: SyncProgressState) => void;

class SyncProgressEmitter {
  private currentState: SyncProgressState = { ...INITIAL_SYNC_PROGRESS };
  private listeners: Set<SyncProgressListener> = new Set();
  private resetTimeout: ReturnType<typeof setTimeout> | null = null;

  public getState(): SyncProgressState {
    return this.currentState;
  }

  public emit(state: Partial<SyncProgressState>) {
    if (this.resetTimeout) {
      clearTimeout(this.resetTimeout);
      this.resetTimeout = null;
    }

    const updated = {
      ...this.currentState,
      ...state,
    };

    if (updated.totalFiles > 0) {
      updated.progressPercentage = Math.min(
        100,
        Math.round((updated.processedFiles / updated.totalFiles) * 100)
      );
    } else if (updated.status === 'completed') {
      updated.progressPercentage = 100;
    }

    this.currentState = updated;
    this.listeners.forEach((listener) => listener(this.currentState));

    // Auto-hide/reset to idle after 3 seconds upon completion or error
    if (updated.status === 'completed' || updated.status === 'error') {
      this.resetTimeout = setTimeout(() => {
        this.emit({
          status: 'idle',
          totalFiles: 0,
          processedFiles: 0,
          progressPercentage: 0,
          currentFileName: undefined,
          currentAction: undefined,
          errorMessage: undefined,
        });
      }, 3000);
    }
  }

  public subscribe(listener: SyncProgressListener): () => void {
    this.listeners.add(listener);
    listener(this.currentState);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

export const syncProgressEmitter = new SyncProgressEmitter();

export function useSyncProgress(): SyncProgressState {
  const [state, setState] = useState<SyncProgressState>(syncProgressEmitter.getState());

  useEffect(() => {
    return syncProgressEmitter.subscribe((newState) => {
      setState(newState);
    });
  }, []);

  return state;
}
