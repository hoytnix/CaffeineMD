'use client';

import React from 'react';
import Image from 'next/image';
import {
  ChevronRight,
  Key,
  Palette,
  Sliders,
  Keyboard,
  Database,
} from 'lucide-react';

export type SettingsScreen =
  | 'home'
  | 'profile'
  | 'apiKeys'
  | 'themes'
  | 'editor'
  | 'keyboard'
  | 'storage';

export interface GoogleDriveUserInfo {
  displayName: string | null;
  email: string | null;
  photoUrl?: string | null;
}

export interface IosSettingsHomeProps {
  onSelectScreen: (screen: SettingsScreen) => void;
  googleDriveUser: GoogleDriveUserInfo | null;
  themeName: string;
  editorFontSize: number;
  hasGeminiKey: boolean;
}

export function IosSettingsHome({
  onSelectScreen,
  googleDriveUser,
  themeName,
  editorFontSize,
  hasGeminiKey,
}: IosSettingsHomeProps) {
  const isDriveConnected = Boolean(googleDriveUser);

  const SETTINGS_ROWS = [
    {
      id: 'apiKeys' as SettingsScreen,
      title: 'API Keys',
      icon: Key,
      badgeBg: 'bg-orange-500',
      summary: hasGeminiKey ? 'Configured' : 'Gemini & Cloud',
    },
    {
      id: 'themes' as SettingsScreen,
      title: 'Themes',
      icon: Palette,
      badgeBg: 'bg-blue-500',
      summary: themeName,
    },
    {
      id: 'editor' as SettingsScreen,
      title: 'Editor',
      icon: Sliders,
      badgeBg: 'bg-sky-500',
      summary: `${editorFontSize}px`,
    },
    {
      id: 'keyboard' as SettingsScreen,
      title: 'Keyboard',
      icon: Keyboard,
      badgeBg: 'bg-emerald-500',
      summary: 'Shortcuts',
    },
    {
      id: 'storage' as SettingsScreen,
      title: 'Storage',
      icon: Database,
      badgeBg: 'bg-green-500',
      summary: 'IndexedDB & Trash',
    },
  ];

  return (
    <div className="space-y-6">
      {/* iOS-Style Large Header */}
      <h1 className="text-3xl font-bold tracking-tight text-slate-100 px-1 pt-2 pb-4">
        Settings
      </h1>

      {/* 1. Top PFP Account Card ("Michael Hoyt") */}
      <button
        type="button"
        onClick={() => onSelectScreen('profile')}
        className="w-full rounded-2xl bg-slate-900/70 border border-slate-800/80 p-4 flex items-center gap-4 hover:bg-slate-800/50 transition-all text-left group cursor-pointer"
      >
        {/* Left Avatar (PFP) */}
        {googleDriveUser?.photoUrl ? (
          <Image
            src={googleDriveUser.photoUrl}
            alt={googleDriveUser.displayName || 'Michael Hoyt'}
            width={56}
            height={56}
            unoptimized
            referrerPolicy="no-referrer"
            className="w-14 h-14 rounded-full object-cover ring-2 ring-indigo-500/20 shrink-0"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-600 via-indigo-700 to-slate-800 flex items-center justify-center text-white font-bold text-lg shadow-inner ring-2 ring-indigo-500/30 shrink-0">
            MH
          </div>
        )}

        {/* Center Text */}
        <div className="flex-1 min-w-0">
          <div className="text-lg font-semibold text-slate-100 leading-tight truncate">
            {googleDriveUser?.displayName || 'Michael Hoyt'}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 truncate">
            {googleDriveUser?.email || 'Google Account, Cloud Sync, and more'}
          </div>
        </div>

        {/* Right Status & Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          {isDriveConnected && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/40">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Connected
            </span>
          )}
          <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
        </div>
      </button>

      {/* 2. iOS Form Group / Tab Group Card Below the PFP Card */}
      <div className="rounded-2xl bg-slate-900/70 border border-slate-800/80 divide-y divide-slate-800/80 overflow-hidden shadow-sm">
        {SETTINGS_ROWS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectScreen(item.id)}
              className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-slate-800/40 transition-colors text-left group cursor-pointer"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center text-white shadow-sm shrink-0 ${item.badgeBg}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-slate-100">
                  {item.title}
                </span>
              </div>

              <div className="flex items-center gap-1">
                <span className="text-xs text-slate-400 mr-1.5">
                  {item.summary}
                </span>
                <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-slate-300 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          );
        })}
      </div>

      {/* About CaffeineMD Footer */}
      <div className="pt-6 border-t border-[var(--border)] text-center text-xs text-neutral-400 dark:text-neutral-500 space-y-1">
        <p className="font-semibold text-neutral-700 dark:text-neutral-300">CaffeineMD</p>
        <p className="text-[11px]">Local-first, high-performance personal knowledge management workspace ☕</p>
      </div>
    </div>
  );
}
