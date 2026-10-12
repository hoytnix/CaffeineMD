'use client';

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Editor } from '@tiptap/react';
import {
  Image as ImageIcon,
  ChevronDown,
  Code,
  SquareCode,
  Quote,
  Link as LinkIcon,
  Upload,
} from 'lucide-react';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { storeAsset } from '@/src/lib/storage/repositories/assetRepository';

export interface MediaSelectorPopoverProps {
  editor: Editor;
  checkHasDragged?: () => boolean;
  onActionNotice?: (msg: string) => void;
}

const CODE_ITEMS = [
  { id: 'code', label: 'Inline Code', icon: Code, tag: '`code`', check: (e: Editor) => e.isActive('code'), act: (e: Editor, sel: any) => { const c = e.chain(); if (sel) c.setTextSelection(sel); c.toggleCode().run(); } },
  { id: 'codeBlock', label: 'Code Block', icon: SquareCode, tag: '```', check: (e: Editor) => e.isActive('codeBlock'), act: (e: Editor, sel: any) => { const c = e.chain(); if (sel) c.setTextSelection(sel); c.toggleCodeBlock().run(); } },
  { id: 'quote', label: 'Quote', icon: Quote, tag: '>', check: (e: Editor) => e.isActive('blockquote'), act: (e: Editor, sel: any) => { const c = e.chain(); if (sel) c.setTextSelection(sel); c.toggleBlockquote().run(); } },
];

import { useToolbarPopover } from './useToolbarPopover';

export function MediaSelectorPopover({
  editor,
  checkHasDragged,
  onActionNotice,
}: MediaSelectorPopoverProps) {
  const { activeWorkspaceId } = useWorkspaceStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    isOpen,
    setIsOpen,
    popoverStyle,
    buttonRef,
    menuRef,
    toggleOpen,
    animationClass,
    savedSelectionRef,
    snapshotSelection,
  } = useToolbarPopover({
    editor,
    checkHasDragged,
    popoverWidth: 208,
  });

  const handleInsertLink = () => {
    setIsOpen(false);
    const url = window.prompt('Enter link URL (or note title for WikiLink):');
    if (!url) return;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      editor.chain().focus().setLink?.({ href: url }).run();
    } else {
      editor.chain().focus().insertContent(`[[${url}]]`).run();
    }
  };

  const handleInsertImageUrl = () => {
    setIsOpen(false);
    const url = window.prompt('Enter image URL:');
    if (url?.trim()) {
      (editor.chain().focus() as any).setImage?.({ src: url.trim() }).run();
      onActionNotice?.('Image inserted');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const safePath = `assets/${Date.now()}-${file.name}`;
      await storeAsset(activeWorkspaceId || 'default-vault', safePath, file, file.type);
    } catch (err) {
      console.warn('Asset store warning:', err);
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        (editor.chain().focus() as any).setImage?.({ src, alt: file.name }).run();
        onActionNotice?.('Image uploaded and inserted');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const isAnyMediaActive =
    editor.isActive('code') ||
    editor.isActive('codeBlock') ||
    editor.isActive('blockquote') ||
    editor.isActive('link') ||
    editor.isActive('image');

  const isLinkActive = editor.isActive('link');
  const isImageActive = editor.isActive('image');

  return (
    <div className="relative flex items-center shrink-0 rounded-lg">
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />

      <button
        ref={buttonRef}
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          snapshotSelection();
        }}
        onTouchStart={(e) => {
          e.preventDefault();
          snapshotSelection();
        }}
        onTouchEnd={(e) => {
          e.preventDefault();
          toggleOpen(e);
        }}
        onClick={toggleOpen}
        title="Media (Code, Quotes, Links, Images)"
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`p-1 px-1.5 rounded-lg transition-all flex items-center gap-0.5 justify-center cursor-pointer min-w-[34px] h-[26px] ${
          isAnyMediaActive || isOpen
            ? 'bg-[var(--accent)] text-white shadow-xs'
            : 'text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--border)]/60'
        }`}
      >
        <ImageIcon className="w-4 h-4 shrink-0 stroke-[2] pointer-events-none" />
        <ChevronDown className="w-2.5 h-2.5 opacity-70 pointer-events-none" />
      </button>

      {isOpen && popoverStyle && typeof document !== 'undefined' && createPortal(
        <div
          ref={menuRef}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onTouchStart={(e) => e.stopPropagation()}
          style={popoverStyle}
          className={`w-52 rounded-xl bg-[var(--card)] border border-[var(--border)] shadow-2xl p-1.5 flex flex-col gap-0.5 z-[9999] text-[var(--foreground)] ${animationClass}`}
        >
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
            Code & Quotes
          </div>

          {CODE_ITEMS.map(({ id, label, icon: Icon, tag, check, act }) => {
            const active = check(editor);
            return (
              <button
                key={id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onTouchStart={(e) => e.preventDefault()}
                onTouchEnd={(e) => {
                  e.preventDefault();
                  act(editor, savedSelectionRef.current);
                  setIsOpen(false);
                }}
                onClick={() => {
                  act(editor, savedSelectionRef.current);
                  setIsOpen(false);
                }}
                className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left w-full ${
                  active ? 'bg-[var(--accent)] text-white font-semibold' : 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{label}</span>
                </div>
                <span className={`text-[10px] font-mono px-1 py-0.5 rounded ${active ? 'bg-white/20 text-white' : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60'}`}>
                  {tag}
                </span>
              </button>
            );
          })}

          <div className="my-1 border-t border-[var(--border)]" />
          <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--foreground)]/50">
            Links & Images
          </div>

          {/* Link */}
          <button
            type="button"
            onClick={handleInsertLink}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left w-full ${
              isLinkActive ? 'bg-[var(--accent)] text-white font-semibold' : 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <LinkIcon className="w-3.5 h-3.5 shrink-0" />
              <span>Link / WikiLink</span>
            </div>
            <span className={`text-[10px] font-mono px-1 py-0.5 rounded ${isLinkActive ? 'bg-white/20 text-white' : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60'}`}>
              [[ ]]
            </span>
          </button>

          {/* Upload Image */}
          <button
            type="button"
            onClick={() => { setIsOpen(false); fileInputRef.current?.click(); }}
            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left w-full hover:bg-[var(--foreground)]/10 text-[var(--foreground)]"
          >
            <div className="flex items-center gap-2">
              <Upload className="w-3.5 h-3.5 shrink-0 text-indigo-400" />
              <span>Upload Image</span>
            </div>
            <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60">
              File
            </span>
          </button>

          {/* Image URL */}
          <button
            type="button"
            onClick={handleInsertImageUrl}
            className={`flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left w-full ${
              isImageActive ? 'bg-[var(--accent)] text-white font-semibold' : 'hover:bg-[var(--foreground)]/10 text-[var(--foreground)]'
            }`}
          >
            <div className="flex items-center gap-2">
              <ImageIcon className="w-3.5 h-3.5 shrink-0 text-emerald-400" />
              <span>Image from URL</span>
            </div>
            <span className={`text-[10px] font-mono px-1 py-0.5 rounded ${isImageActive ? 'bg-white/20 text-white' : 'bg-[var(--background)] border border-[var(--border)] text-[var(--foreground)]/60'}`}>
              ![]
            </span>
          </button>
        </div>,
        document.body
      )}
    </div>
  );
}
