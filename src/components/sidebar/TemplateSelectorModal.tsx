'use client';

import React, { useEffect, useState } from 'react';
import { db, VaultFile } from '@/src/lib/storage/db';
import { executeVaultMutation } from '@/src/lib/storage/vaultMutationService';
import { useWorkspaceStore } from '@/src/stores/workspaceStore';
import { Zap, Users, FolderKanban, BookOpen, Sparkles } from 'lucide-react';
import { ModalShell } from '@/src/components/common/ModalShell';

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
      title = `Meeting ${dateStr}`;
      path = `meetings/${dateStr}-${title.toLowerCase().replace(/\s+/g, '-')}.md`;
      content = `---\ntitle: "${title}"\ntags: ["meeting"]\nstatus: "Doing"\nauthor: ""\neisenhower: "Urgent & Important"\n---\n\n# ${title}\n\n## 👥 Attendees\n- \n\n## 🎯 Agenda\n1. \n\n## 📝 Discussion\n- \n\n## ✅ Action Items\n- [ ] `;
      break;

    case 'project-spec':
      title = `Project Spec ${dateStr}`;
      path = `projects/${dateStr}-spec.md`;
      content = `---\ntitle: "${title}"\ntags: ["project", "spec"]\nstatus: "Draft"\nauthor: ""\neisenhower: "Important & Not Immediate"\n---\n\n# ${title}\n\n## 📌 Executive Summary\n\n## 🎯 Goals & Scope\n- Goal 1\n\n## 🏗️ Architecture & Stack\n- \n\n## 🚀 Milestones\n- [ ] Milestone 1\n`;
      break;

    case 'journal':
      title = `Journal ${dateStr}`;
      path = `journal/${dateStr}.md`;
      content = `---\ntitle: "${title}"\ntags: ["journal", "reflection"]\nstatus: "Done"\nauthor: ""\neisenhower: "Not Urgent & Not Immediate"\n---\n\n# ${title} ☕\n\n## 🌅 Morning Intentions\n- What is the most important thing today?\n\n## 💡 Insights & Notes\n- \n\n## 🌙 Evening Reflection\n- What went well today?\n`;
      break;

    default:
      title = `Note ${dateStr}`;
      path = `notes/${dateStr}.md`;
      content = `---\ntitle: "${title}"\n---\n\n# ${title}\n`;
  }

  return {
    id: path,
    path,
    name: path.split('/').pop() || path,
    title,
    extension: 'md',
    content,
    frontmatter: {
      title,
      tags: [templateId],
      status: 'Draft',
    },
    tags: [templateId],
    isBinary: false,
    size: content.length,
    createdAt: timestamp,
    updatedAt: timestamp,
    vaultId: workspaceId,
  };
}

export function TemplateSelectorModal() {
  const {
    isTemplateModalOpen,
    setTemplateModalOpen,
    activeWorkspaceId,
    openFileTab,
    showToast,
  } = useWorkspaceStore();

  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && (e.key === 'N' || e.key === 'n')) {
        e.preventDefault();
        setTemplateModalOpen(!isTemplateModalOpen);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTemplateModalOpen, setTemplateModalOpen]);

  const handleApplyTemplate = async (tmpl: TemplateDef) => {
    try {
      const newFile = buildTemplateFile(tmpl.id, activeWorkspaceId || 'default-vault');
      await executeVaultMutation(
        () => db.files.put(newFile),
        { syncDiskNote: { path: newFile.path, content: newFile.content } }
      );
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
    <ModalShell
      isOpen={isTemplateModalOpen}
      onClose={() => setTemplateModalOpen(false)}
      size="lg"
      title={
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[var(--accent)]" />
          <span>Choose Note Template</span>
        </div>
      }
      footer={
        <div className="flex items-center justify-between w-full text-xs text-neutral-400">
          <span>Shortcut: ⌘⇧N / Ctrl+Shift+N</span>
          <span>Press Esc to close</span>
        </div>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto">
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
    </ModalShell>
  );
}
