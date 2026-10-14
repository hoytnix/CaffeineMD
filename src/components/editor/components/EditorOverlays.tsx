'use client';

import React from 'react';
import type { Editor } from '@tiptap/react';
import { FloatingToolbarHost, SlashMenuState, WikiMenuState } from '../FloatingToolbarHost';
import { IosLinkPreviewCard } from './IosLinkPreviewCard';
import { EditorContextMenu } from '../EditorContextMenu';
import { CommandItem } from '../extensions/SlashCommand';

export interface EditorOverlaysProps {
  editor: Editor | null;
  filePath: string;
  slashMenu: SlashMenuState;
  wikiMenu: WikiMenuState;
  filteredCommands: CommandItem[];
  onExecuteCommand: (item: CommandItem) => void;
  onExecuteWikiLink: (suggestion: { title: string; path: string; isNew?: boolean }) => void;
  isContextMenuOpen: boolean;
  contextMenuPos: { x: number; y: number };
  onCloseContextMenu: () => void;
}

export function EditorOverlays({
  editor,
  filePath,
  slashMenu,
  wikiMenu,
  filteredCommands,
  onExecuteCommand,
  onExecuteWikiLink,
  isContextMenuOpen,
  contextMenuPos,
  onCloseContextMenu,
}: EditorOverlaysProps) {
  return (
    <>
      <FloatingToolbarHost
        slashMenu={slashMenu}
        wikiMenu={wikiMenu}
        filteredCommands={filteredCommands}
        onExecuteCommand={onExecuteCommand}
        onExecuteWikiLink={onExecuteWikiLink}
      />

      <IosLinkPreviewCard editor={editor} />

      <EditorContextMenu
        editor={editor}
        filePath={filePath}
        isOpen={isContextMenuOpen}
        onClose={onCloseContextMenu}
        position={contextMenuPos}
      />
    </>
  );
}
