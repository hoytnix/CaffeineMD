'use client';

import React, { useEffect, useState } from 'react';
import { db, VaultFile } from '@/src/lib/storage/db';
import { NativeFileSystemAdapter } from '@/src/lib/storage/fileSystem';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Zap, Users, FolderKanban, BookOpen, X, Sparkles } from 'lucide-react';

interface TemplateDef {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const TEMPLATES: TemplateDef[] = [
  {
    id: 'scratchpad',
    name: 'Quick Scratchpad',
    description: 'Timestamped instant notepad for thoughts and temporary dumps',
    icon: Zap,
  },
  {
    id: 'meeting',
    name: 'Meeting Notes',
    description: 'Structured template for agendas, attendees, and action items',
    icon: Users,
  },
  {
    id: 'project-spec',
    name: 'Project Specification',
    description: 'Product requirements, architecture choices, and milestone checklist',
    icon: FolderKanban,
  },
  {
    id: 'journal',
    name: 'Daily Journal',
    description: 'Personal morning intentions, daily reflection, and gratitude notes',
    icon: BookOpen,
  },
];

function buildTemplateFile(templateId: string, workspaceId: string): VaultFile {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);
  const timeStr = `${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
  const timestamp = now.getTime();

  let title = '';
  let path = '';
  let content = '';

  switch (templateId) {
    case 'scratchpad':
      title = `Scratchpad ${dateStr} ${timeStr}`;
      path = `scratchpad/${dateStr}-${timeStr}.md`;
      content = `---\ntitle: "${title}"\ntags: ["scratchpad"]\nstatus: "Draft"\nauthor: ""\neisenhower: "Not Urgent & Not Immediate"\n---\n\n# ${title}\n\n- [ ] `;
      break;

    case 'meeting':
      title = `Meeting - ${dateStr}`;
      path = `meetings/Meeting - ${dateStr}.md`;
      content = `---\ntitle: "${title}"\ntags: ["meeting", "work"]\nstatus: "In Progress"\nauthor: ""\neisenhower: "Urgent & Immediate"\n---\n\n# ${title}\n\n**Date:** ${dateStr}\n**Attendees:** \n\n## 📋 Agenda\n1. \n\n## 📝 Discussion\n\n## ✅ Action Items\n- [ ] `;
      break;

    case 'project-spec':
      title = `Project Specification`;
      path = `projects/Project Spec - ${dateStr}.md`;
      content = `---\ntitle: "${title}"\ntags: ["project", "spec"]\nstatus: "Draft"\nauthor: ""\neisenhower: "Urgent & Not Immediate"\n---\n\n# ${title}\n\n## 🎯 Overview & Objectives\n\n## 🛠 Architecture & Tech Stack\n\n## 🚀 Milestones & Tasks\n- [ ] Initial scaffolding\n- [ ] Core business logic\n- [ ] Verification suite`;
      break;

    case 'journal':
      title = `Daily Journal - ${dateStr}`;
      path = `journal/Daily - ${dateStr}.md`;
      content = `---\ntitle: "${title}"\ntags: ["journal", "reflection"]\nstatus: "Completed"\nauthor: ""\neisenhower: "Not Urgent & Immediate"\n---\n\n# ${title}\n\n### 🌟 Top 3 Priorities\n1. \n2. \n3. \n\n### 💡 Morning Intentions\n\n### 🌙 Evening Reflection`;
      break;

    default:
      title = `Note - ${dateStr}`;
      path = `notes/${dateStr}.md`;
      content = `# ${title}\n\n`;
  }

  return {
    id: path,
    path,
    name: path.split('/').pop() || path,
    title,
    extension: 'md',
    content,
    frontmatter: { title, status: 'Draft' },
    tags: [],
    isBinary: false,
    size: content.length,
    createdAt: timestamp,
    updatedAt: timestamp,
    vaultId: workspaceId || 'default-vault',
  };
}

export function TemplateSelectorModal() {
  const { isTemplateModalOpen, setTemplateModalOpen, openFileTab, activeWorkspaceId, showToast } =
    useWorkspaceStore();
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Global hotkey: Cmd+Shift+N / Ctrl+Shift+N
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        setTemplateModalOpen(!isTemplateModalOpen);
      }
      if (e.key === 'Escape' && isTemplateModalOpen) {
        setTemplateModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTemplateModalOpen, setTemplateModalOpen]);

  const handleApplyTemplate = async (tmpl: TemplateDef) => {
    try {
      const newFile = buildTemplateFile(tmpl.id, activeWorkspaceId || 'default-vault');
      await db.files.put(newFile);
      await NativeFileSystemAdapter.writeBackToFile(newFile.path, newFile.content);
      openFileTab(newFile.path, newFile.title);
      showToast(`Created note from ${tmpl.name}`);
      setTemplateModalOpen(false);
    } catch (err) {
      console.warn('Failed to apply template:', err);
      showToast('Error creating note from template');
    }
  };

  if (!isTemplateModalOpen) return null;

  return (
    <div
      onClick={() => setTemplateModalOpen(false)}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden flex flex-col text-[var(--foreground)] animate-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)] bg-[var(--background)]/40">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <h2 className="text-sm font-semibold">Choose Note Template</h2>
          </div>
          <button
            onClick={() => setTemplateModalOpen(false)}
            className="p-1 rounded-lg text-neutral-400 hover:text-[var(--foreground)] hover:bg-[var(--foreground)]/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Templates Grid */}
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
          {TEMPLATES.map((tmpl, idx) => {
            const Icon = tmpl.icon;
            const isSelected = idx === selectedIndex;
            return (
              <button
                key={tmpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tmpl)}
                onMouseEnter={() => setSelectedIndex(idx)}
                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[var(--accent)] bg-[var(--accent)]/10 shadow-xs'
                    : 'border-[var(--border)] hover:border-[var(--border)]/80 bg-[var(--background)]/40'
                }`}
              >
                <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--accent)]">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-semibold">{tmpl.name}</span>
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {tmpl.description}
                </p>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[var(--border)] text-xs text-neutral-400 bg-[var(--background)]/20">
          <span>Shortcut: ⌘⇧N / Ctrl+Shift+N</span>
          <span>Press Esc to close</span>
        </div>
      </div>
    </div>
  );
}
