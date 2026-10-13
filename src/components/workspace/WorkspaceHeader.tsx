'use client';

import React from 'react';
import Link from 'next/link';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { WorkspacePopover } from './WorkspacePopover';
import {
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
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
    setActiveTab,
    sidebarCollapsed,
    toggleSidebar,
    toggleEmojiDrawer,
  } = useWorkspaceStore();

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
          <button
            onClick={() => setActiveTab('editor')}
            title="Editor Notes"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'editor' && activeTab !== 'settings'
                ? 'bg-[var(--card)] text-[var(--accent)] shadow-xs scale-105 border border-[var(--border)] font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <FileText className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('graph')}
            title="Knowledge Graph"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'graph' && activeTab !== 'settings'
                ? 'bg-[var(--card)] text-[var(--accent)] shadow-xs scale-105 border border-[var(--border)] font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <Network className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('table')}
            title="Table View"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'table' && activeTab !== 'settings'
                ? 'bg-[var(--card)] text-[var(--accent)] shadow-xs scale-105 border border-[var(--border)] font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <Table className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('kanban')}
            title="Kanban Board View"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              (activeView === 'board' || activeTab === 'kanban') && activeTab !== 'settings'
                ? 'bg-[var(--card)] text-[var(--accent)] shadow-xs scale-105 border border-[var(--border)] font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <Kanban className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('list')}
            title="List View"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'list' && activeTab !== 'settings'
                ? 'bg-[var(--card)] text-[var(--accent)] shadow-xs scale-105 border border-[var(--border)] font-semibold'
                : 'text-[var(--foreground)]/60 hover:text-[var(--foreground)] hover:bg-[var(--card)]/60'
            }`}
          >
            <List className="w-4 h-4" />
          </button>

          <button
            onClick={() => setActiveTab('tags')}
            title="Tag Cloud & Registry"
            className={`p-2 rounded-lg transition-all cursor-pointer ${
              activeView === 'tags' && activeTab !== 'settings'
                ? 'bg-[var(--card)] text-[var(--accent)] shadow-xs scale-105 border border-[var(--border)] font-semibold'
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
              {activeView === 'editor' && <FileText className="w-4 h-4" />}
              {activeView === 'graph' && <Network className="w-4 h-4" />}
              {activeView === 'table' && <Table className="w-4 h-4" />}
              {(activeView === 'board' || activeTab === 'kanban') && <Kanban className="w-4 h-4" />}
              {activeView === 'list' && <List className="w-4 h-4" />}
              {activeView === 'tags' && <Tag className="w-4 h-4" />}
            </span>
            <select
              value={activeView === 'board' ? 'kanban' : activeView}
              onChange={(e) => setActiveTab(e.target.value as any)}
              aria-label="Select workspace view"
              className="bg-transparent text-xs font-semibold text-[var(--foreground)] outline-none cursor-pointer pr-4 appearance-none"
            >
              <option value="editor" className="bg-[var(--card)] text-[var(--foreground)]">Editor</option>
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
