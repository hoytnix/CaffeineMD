'use client';

import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { SettingsScreen } from './IosSettingsHome';

const SUB_SCREEN_TITLES: Record<Exclude<SettingsScreen, 'home'>, string> = {
  profile: 'Cloud Sync & Google Drive',
  apiKeys: 'API Keys',
  themes: 'Themes',
  editor: 'Editor',
  keyboard: 'Keyboard',
  storage: 'Storage',
};

const TAB_ITEMS: { id: SettingsScreen; label: string }[] = [
  { id: 'profile', label: 'Profile / Sync' },
  { id: 'apiKeys', label: 'API Keys' },
  { id: 'themes', label: 'Themes' },
  { id: 'editor', label: 'Editor' },
  { id: 'keyboard', label: 'Keyboard' },
  { id: 'storage', label: 'Storage' },
];

export interface SettingsHeaderProps {
  activeScreen: SettingsScreen;
  setActiveScreen: (screen: SettingsScreen) => void;
  onBackToWorkspace: () => void;
}

export function SettingsHeader({
  activeScreen,
  setActiveScreen,
  onBackToWorkspace,
}: SettingsHeaderProps) {
  return (
    <>
      {/* iOS Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-[var(--card)]/80 backdrop-blur-xl border-b border-[var(--border)] px-4 py-3 select-none">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {activeScreen === 'home' ? (
            <button
              onClick={onBackToWorkspace}
              aria-label="Back"
              className="flex items-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 -ml-1" />
            </button>
          ) : (
            <button
              onClick={() => setActiveScreen('home')}
              className="flex items-center gap-1 text-amber-400 hover:text-amber-300 text-sm font-medium cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5 -ml-1" />
              <span>Settings</span>
            </button>
          )}

          <h1 className="text-sm font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5">
            {activeScreen === 'home' ? (
              <>
                <span>☕</span>
                <span>CaffeineMD Settings</span>
              </>
            ) : (
              <span>{SUB_SCREEN_TITLES[activeScreen]}</span>
            )}
          </h1>
          <div className="w-16" />
        </div>
      </header>

      {/* Sub-Screen Quick Horizontal Pill Tab Bar */}
      {activeScreen !== 'home' && (
        <div className="sticky top-[49px] z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/60 px-4 py-2">
          <div className="max-w-4xl mx-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {TAB_ITEMS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveScreen(tab.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  activeScreen === tab.id
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
