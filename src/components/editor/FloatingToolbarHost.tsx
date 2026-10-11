'use client';

import React from 'react';
import { FloatingSlashMenu } from './menus/FloatingSlashMenu';
import { FloatingWikiLinkMenu } from './menus/FloatingWikiLinkMenu';
import { CommandItem } from './extensions/SlashCommand';

export interface SlashMenuState {
  isOpen: boolean;
  query: string;
  range: any;
  coords: { top: number; left: number } | null;
  selectedIndex: number;
}

export interface WikiMenuState {
  isOpen: boolean;
  query: string;
  range: any;
  coords: { top: number; left: number } | null;
  selectedIndex: number;
  suggestions: Array<{ title: string; path: string; isNew?: boolean }>;
}

interface FloatingToolbarHostProps {
  slashMenu: SlashMenuState;
  wikiMenu: WikiMenuState;
  filteredCommands: CommandItem[];
  onExecuteCommand: (item: CommandItem) => void;
  onExecuteWikiLink: (suggestion: { title: string; path: string; isNew?: boolean }) => void;
}

export function FloatingToolbarHost({
  slashMenu,
  wikiMenu,
  filteredCommands,
  onExecuteCommand,
  onExecuteWikiLink,
}: FloatingToolbarHostProps) {
  return (
    <>
      <FloatingSlashMenu
        isOpen={slashMenu.isOpen}
        coords={slashMenu.coords}
        selectedIndex={slashMenu.selectedIndex}
        filteredCommands={filteredCommands}
        onExecuteCommand={onExecuteCommand}
      />

      <FloatingWikiLinkMenu
        isOpen={wikiMenu.isOpen}
        coords={wikiMenu.coords}
        selectedIndex={wikiMenu.selectedIndex}
        suggestions={wikiMenu.suggestions}
        onExecuteWikiLink={onExecuteWikiLink}
      />
    </>
  );
}
