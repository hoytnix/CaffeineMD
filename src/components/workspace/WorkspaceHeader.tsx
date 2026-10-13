'use client';

import React from 'react';
import Link from 'next/link';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { WorkspacePopover } from './WorkspacePopover';
import {
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  Code2,
  GitCompare,
  Network,
  Table,
  Kanban,
  List,
  Tag,
  Smile,
  Settings,
  ChevronDown,
} from 'lucide-react';

export function WorkspaceHeader() {
  const {
    activeView,
    activeTab,
    setActiveView,
    setActiveTab,
    editorMode,
    setEditorMode,
    sidebarCollapsed,
    toggleSidebar,
    toggleEmojiDrawer,
  } = useWorkspaceStore();

  const handleSelectEditorMode = (mode: 'richtext' | 'plaintext' | 'diff') => {
    setActiveView('editor');
    setEditorMode(mode);
  };

  return (
    <header className="flex items-center justify-between gap-4 px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] z-30 select-none text-[var(--foreground)]">
      {/* Zone 1: Sidebar Toggle & CaffeineMD Logo with Workspace Popover */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-md text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10 transition-colors cursor-pointer"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {sidebarCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* CaffeineMD Logo Mark with Workspace Popover */}
        <WorkspacePopover />
      </div>

      {/* Zone 2: View Switcher */}
      <div className="flex items-center">
        {/* Desktop: Peer View Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-[var(--background)]/80 p-1 rounded-xl border border-[var(--border)] shadow-xs">
          {/* 1. Editor (Rich Text) */}
          <button
            onClick={() => handleSelectEditorMode('richtext')}
            title="Editor (Rich Text)"
            style={
              activeView === 'editor' && editorMode === 'richtext' && activeTab !== 'settings'
                ? { backgroundColor: 'var(--theme-accent)', color: '#ffffff' }
                : undefined
            }
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'editor' && editorMode === 'richtext' && activeTab !== 'settings'
                ? 'shadow-xs scale-105 font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <FileText className="w-4 h-4" />
          </button>

          {/* 2. Plaintext */}
          <button
            onClick={() => handleSelectEditorMode('plaintext')}
            title="Plaintext Markdown"
            style={
              activeView === 'editor' && editorMode === 'plaintext' && activeTab !== 'settings'
                ? { backgroundColor: 'var(--theme-accent)', color: '#ffffff' }
                : undefined
            }
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'editor' && editorMode === 'plaintext' && activeTab !== 'settings'
                ? 'shadow-xs scale-105 font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <Code2 className="w-4 h-4" />
          </button>

          {/* 3. Diff */}
          <button
            onClick={() => handleSelectEditorMode('diff')}
            title="Diff Viewer"
            style={
              activeView === 'editor' && editorMode === 'diff' && activeTab !== 'settings'
                ? { backgroundColor: 'var(--theme-accent)', color: '#ffffff' }
                : undefined
            }
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'editor' && editorMode === 'diff' && activeTab !== 'settings'
                ? 'shadow-xs scale-105 font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <GitCompare className="w-4 h-4" />
          </button>

          {/* 4. Graph */}
          <button
            onClick={() => setActiveTab('graph')}
            title="Knowledge Graph"
            style={
              activeView === 'graph' && activeTab !== 'settings'
                ? { backgroundColor: 'var(--theme-accent)', color: '#ffffff' }
                : undefined
            }
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'graph' && activeTab !== 'settings'
                ? 'shadow-xs scale-105 font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <Network className="w-4 h-4" />
          </button>

          {/* 5. Table */}
          <button
            onClick={() => setActiveTab('table')}
            title="Table View"
            style={
              activeView === 'table' && activeTab !== 'settings'
                ? { backgroundColor: 'var(--theme-accent)', color: '#ffffff' }
                : undefined
            }
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'table' && activeTab !== 'settings'
                ? 'shadow-xs scale-105 font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <Table className="w-4 h-4" />
          </button>

          {/* 6. Board (Kanban) */}
          <button
            onClick={() => setActiveTab('kanban')}
            title="Kanban Board View"
            style={
              (activeView === 'board' || activeTab === 'kanban') && activeTab !== 'settings'
                ? { backgroundColor: 'var(--theme-accent)', color: '#ffffff' }
                : undefined
            }
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              (activeView === 'board' || activeTab === 'kanban') && activeTab !== 'settings'
                ? 'shadow-xs scale-105 font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <Kanban className="w-4 h-4" />
          </button>

          {/* 7. List */}
          <button
            onClick={() => setActiveTab('list')}
            title="List View"
            style={
              activeView === 'list' && activeTab !== 'settings'
                ? { backgroundColor: 'var(--theme-accent)', color: '#ffffff' }
                : undefined
            }
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'list' && activeTab !== 'settings'
                ? 'shadow-xs scale-105 font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <List className="w-4 h-4" />
          </button>

          {/* 8. Tags */}
          <button
            onClick={() => setActiveTab('tags')}
            title="Tag Cloud & Registry"
            style={
              activeView === 'tags' && activeTab !== 'settings'
                ? { backgroundColor: 'var(--theme-accent)', color: '#ffffff' }
                : undefined
            }
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'tags' && activeTab !== 'settings'
                ? 'shadow-xs scale-105 font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <Tag className="w-4 h-4" />
          </button>
        </nav>

        {/* Mobile: Compact Select Menu */}
        <div className="flex md:hidden items-center relative">
          <div className="relative flex items-center bg-[var(--background)]/90 border border-[var(--border)] rounded-xl px-2.5 py-1.5 shadow-xs">
            <span className="mr-1.5 text-[var(--accent)] pointer-events-none">
              {activeView === 'editor' && editorMode === 'richtext' && <FileText className="w-4 h-4" />}
              {activeView === 'editor' && editorMode === 'plaintext' && <Code2 className="w-4 h-4" />}
              {activeView === 'editor' && editorMode === 'diff' && <GitCompare className="w-4 h-4" />}
              {activeView === 'graph' && <Network className="w-4 h-4" />}
              {activeView === 'table' && <Table className="w-4 h-4" />}
              {(activeView === 'board' || activeTab === 'kanban') && <Kanban className="w-4 h-4" />}
              {activeView === 'list' && <List className="w-4 h-4" />}
              {activeView === 'tags' && <Tag className="w-4 h-4" />}
            </span>
            <select
              value={
                activeView === 'editor'
                  ? editorMode
                  : activeView === 'board'
                  ? 'kanban'
                  : activeView
              }
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'richtext' || val === 'plaintext' || val === 'diff') {
                  handleSelectEditorMode(val);
                } else {
                  setActiveTab(val as any);
                }
              }}
              aria-label="Select workspace view"
              className="bg-transparent text-xs font-semibold text-[var(--foreground)] outline-none cursor-pointer pr-4 appearance-none"
            >
              <option value="richtext" className="bg-[var(--card)] text-[var(--foreground)]">Editor (Rich Text)</option>
              <option value="plaintext" className="bg-[var(--card)] text-[var(--foreground)]">Plaintext</option>
              <option value="diff" className="bg-[var(--card)] text-[var(--foreground)]">Diff</option>
              <option value="graph" className="bg-[var(--card)] text-[var(--foreground)]">Graph</option>
              <option value="table" className="bg-[var(--card)] text-[var(--foreground)]">Table</option>
              <option value="kanban" className="bg-[var(--card)] text-[var(--foreground)]">Kanban</option>
              <option value="list" className="bg-[var(--card)] text-[var(--foreground)]">List</option>
              <option value="tags" className="bg-[var(--card)] text-[var(--foreground)]">Tags</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-[var(--foreground)]/50 absolute right-2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Zone 3: Global Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        <button
          onClick={() => toggleEmojiDrawer()}
          title="Emoji Drawer (⌘⇧Space / Ctrl+Shift+Space)"
          className="p-1.5 rounded-lg text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10 transition-colors cursor-pointer"
        >
          <Smile className="w-4 h-4 text-amber-500" />
        </button>

        <Link
          href="/settings"
          title="Settings"
          className="p-1.5 rounded-lg text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10 transition-colors cursor-pointer"
        >
          <Settings className="w-4 h-4" />
        </Link>
      </div>
    </header>
  );
}
