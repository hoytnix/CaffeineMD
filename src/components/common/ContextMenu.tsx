'use client';

import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { ChevronRight } from 'lucide-react';

export interface ContextMenuItem {
  id?: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  destructive?: boolean;
  onClick?: () => void;
  submenu?: ContextMenuItem[];
}

export type ContextMenuElement = ContextMenuItem | { isDivider: true };

export interface ContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { x: number; y: number };
  items: ContextMenuElement[];
}

import { useFloatingDismiss } from '@/src/hooks/useContextMenu';

export function ContextMenu({
  isOpen,
  onClose,
  position,
  items,
}: ContextMenuProps) {
  const { ref: menuRef, coords } = useFloatingDismiss<HTMLDivElement>(
    isOpen,
    onClose,
    position,
    10
  );
  const [activeSubmenuIdx, setActiveSubmenuIdx] = useState<number | null>(null);

  if (!isOpen || typeof document === 'undefined') return null;

  const top = coords?.top ?? position.y;
  const left = coords?.left ?? position.x;

  return createPortal(
    <div
      ref={menuRef}
      style={{ top: `${top}px`, left: `${left}px` }}
      role="menu"
      className="fixed z-50 min-w-[200px] p-1.5 bg-zinc-950/90 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl text-xs text-zinc-300 animate-in fade-in zoom-in-95 duration-100 select-none"
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      <div className="flex flex-col space-y-0.5">
        {items.map((item, idx) => {
          if ('isDivider' in item) {
            return <div key={`div-${idx}`} className="my-1 border-t border-white/5" />;
          }

          const hasSubmenu = Boolean(item.submenu && item.submenu.length > 0);
          const isSubmenuOpen = activeSubmenuIdx === idx;

          return (
            <div
              key={item.id || idx}
              className="relative"
              onMouseEnter={() => hasSubmenu && setActiveSubmenuIdx(idx)}
              onMouseLeave={() => hasSubmenu && setActiveSubmenuIdx(null)}
            >
              <button
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={() => {
                  if (item.disabled) return;
                  if (!hasSubmenu) {
                    onClose();
                    item.onClick?.();
                  }
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  item.destructive
                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/15'
                    : isSubmenuOpen
                    ? 'bg-white/10 text-white'
                    : 'text-zinc-300 hover:text-white hover:bg-white/10'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {item.icon && <span className="w-4 h-4 shrink-0 flex items-center justify-center opacity-80">{item.icon}</span>}
                  <span className="truncate">{item.label}</span>
                </div>

                <div className="flex items-center gap-2 shrink-0 ml-3">
                  {item.shortcut && (
                    <span className="text-[10px] font-mono text-zinc-500 tracking-wider">
                      {item.shortcut}
                    </span>
                  )}
                  {hasSubmenu && <ChevronRight className="w-3 h-3 text-zinc-500" />}
                </div>
              </button>

              {/* Submenu flyout */}
              {hasSubmenu && isSubmenuOpen && (
                <div
                  role="menu"
                  className="absolute left-full top-0 ml-1 min-w-[180px] p-1.5 bg-zinc-950/95 backdrop-blur-xl border border-white/10 shadow-2xl rounded-xl text-xs text-zinc-300 animate-in fade-in zoom-in-95 duration-100 select-none z-50"
                >
                  <div className="flex flex-col space-y-0.5">
                    {item.submenu!.map((subItem, subIdx) => (
                      <button
                        key={subItem.id || subIdx}
                        type="button"
                        role="menuitem"
                        disabled={subItem.disabled}
                        onClick={() => {
                          if (subItem.disabled) return;
                          onClose();
                          subItem.onClick?.();
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-left transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          subItem.destructive
                            ? 'text-red-400 hover:text-red-300 hover:bg-red-500/15'
                            : 'text-zinc-300 hover:text-white hover:bg-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {subItem.icon && <span className="w-3.5 h-3.5 shrink-0 opacity-80">{subItem.icon}</span>}
                          <span className="truncate">{subItem.label}</span>
                        </div>
                        {subItem.shortcut && (
                          <span className="text-[10px] font-mono text-zinc-500 tracking-wider ml-2">
                            {subItem.shortcut}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>,
    document.body
  );
}
