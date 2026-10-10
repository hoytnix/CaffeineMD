'use client';

import React from 'react';
import { CommandItem } from '../extensions/SlashCommand';
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Info,
  Code,
  Table as TableIcon,
  Minus,
  Link2,
} from 'lucide-react';

interface FloatingSlashMenuProps {
  isOpen: boolean;
  coords: { top: number; left: number } | null;
  selectedIndex: number;
  filteredCommands: CommandItem[];
  onExecuteCommand: (item: CommandItem) => void;
}

export function FloatingSlashMenu({
  isOpen,
  coords,
  selectedIndex,
  filteredCommands,
  onExecuteCommand,
}: FloatingSlashMenuProps) {
  if (!isOpen || !coords) return null;

  const getIcon = (name: string) => {
    switch (name) {
      case 'Heading1': return <Heading1 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'Heading2': return <Heading2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'Heading3': return <Heading3 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'List': return <List className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'ListOrdered': return <ListOrdered className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'CheckSquare': return <CheckSquare className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'Info': return <Info className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'Code': return <Code className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'Table': return <TableIcon className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      case 'Link2': return <Link2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
      default: return <Minus className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />;
    }
  };

  return (
    <div
      style={{
        top: `${coords.top}px`,
        left: `${coords.left}px`,
        position: 'fixed',
      }}
      className="z-50 w-64 max-h-72 overflow-y-auto rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 shadow-2xl py-1 text-xs text-neutral-800 dark:text-neutral-200 animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-1.5 text-[11px] font-semibold text-neutral-400 uppercase tracking-wider">
        Blocks & Commands
      </div>
      {filteredCommands.length === 0 ? (
        <div className="px-3 py-2 text-neutral-400">No matching commands</div>
      ) : (
        filteredCommands.map((item, idx) => (
          <button
            key={item.title}
            onClick={() => onExecuteCommand(item)}
            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors cursor-pointer ${
              idx === selectedIndex
                ? 'bg-neutral-100 dark:bg-neutral-800'
                : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
            }`}
          >
            <div className="p-1 rounded bg-neutral-100 dark:bg-neutral-800 shrink-0">
              {getIcon(item.iconName)}
            </div>
            <div>
              <div className="font-semibold text-neutral-900 dark:text-neutral-100">{item.title}</div>
              <div className="text-[11px] text-neutral-500 truncate">{item.description}</div>
            </div>
          </button>
        ))
      )}
    </div>
  );
}
