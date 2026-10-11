import { useState, useMemo } from 'react';
import { db } from '@/src/lib/storage/db';
import { SlashMenuState, WikiMenuState } from '@/src/components/editor/FloatingToolbarHost';
import { getCommandItems, CommandItem } from '@/src/components/editor/extensions/SlashCommand';

export function useEditorSuggestions() {
  const [slashMenu, setSlashMenu] = useState<SlashMenuState>({
    isOpen: false,
    query: '',
    range: null,
    coords: null,
    selectedIndex: 0,
  });

  const [wikiMenu, setWikiMenu] = useState<WikiMenuState>({
    isOpen: false,
    query: '',
    range: null,
    coords: null,
    selectedIndex: 0,
    suggestions: [],
  });

  const callbacks = useMemo(() => ({
    onWikiMenuStart: (props: any) => {
      const clientRect = props.clientRect?.();
      setWikiMenu({
        isOpen: true,
        query: props.query || '',
        range: props.range,
        coords: clientRect ? { top: clientRect.bottom + 8, left: clientRect.left } : null,
        selectedIndex: 0,
        suggestions: [],
      });
    },
    onWikiMenuUpdate: async (props: any) => {
      const clientRect = props.clientRect?.();
      const q = (props.query || '').toLowerCase();
      const allFiles = await db.files.filter((f) => !f.isBinary && !f.isTrash).toArray();
      const matches = allFiles.filter(
        (f) => (f.title && f.title.toLowerCase().includes(q)) || f.name.toLowerCase().includes(q)
      );
      const suggestions: Array<{ title: string; path: string; isNew?: boolean }> = matches.slice(0, 5).map((f) => ({
        title: f.title || f.name.replace(/\.[^/.]+$/, ''),
        path: f.path,
      }));
      if (props.query && !suggestions.some((s) => s.title.toLowerCase() === q)) {
        suggestions.push({ title: props.query, path: `${props.query}.md`, isNew: true });
      }
      setWikiMenu((prev) => ({
        ...prev,
        query: props.query || '',
        range: props.range,
        coords: clientRect ? { top: clientRect.bottom + 8, left: clientRect.left } : prev.coords,
        suggestions,
        selectedIndex: 0,
      }));
    },
    onWikiMenuKeyDown: (props: any) => {
      if (props.event.key === 'Escape') {
        setWikiMenu((prev) => ({ ...prev, isOpen: false }));
        return true;
      }
      return false;
    },
    onWikiMenuExit: () => setWikiMenu((prev) => ({ ...prev, isOpen: false })),
    onSlashMenuStart: (props: any) => {
      const clientRect = props.clientRect?.();
      setSlashMenu({
        isOpen: true,
        query: props.query || '',
        range: props.range,
        coords: clientRect ? { top: clientRect.bottom + 8, left: clientRect.left } : null,
        selectedIndex: 0,
      });
    },
    onSlashMenuUpdate: (props: any) => {
      const clientRect = props.clientRect?.();
      setSlashMenu((prev) => ({
        ...prev,
        query: props.query || '',
        range: props.range,
        coords: clientRect ? { top: clientRect.bottom + 8, left: clientRect.left } : prev.coords,
      }));
    },
    onSlashMenuKeyDown: (props: any) => {
      if (props.event.key === 'Escape') {
        setSlashMenu((prev) => ({ ...prev, isOpen: false }));
        return true;
      }
      return false;
    },
    onSlashMenuExit: () => setSlashMenu((prev) => ({ ...prev, isOpen: false })),
  }), []);

  const filteredCommands = useMemo(() => {
    const all = getCommandItems();
    if (!slashMenu.query) return all;
    const q = slashMenu.query.toLowerCase();
    return all.filter(
      (item) => item.title.toLowerCase().includes(q) || item.description.toLowerCase().includes(q)
    );
  }, [slashMenu.query]);

  const executeCommand = (item: CommandItem, editor: any) => {
    if (!editor || !editor.schema) return;
    editor.chain().focus().deleteRange(slashMenu.range).run();
    item.command({ editor, range: slashMenu.range });
    setSlashMenu((prev) => ({ ...prev, isOpen: false }));
  };

  const executeWikiLink = (suggestion: { title: string; path: string; isNew?: boolean }, editor: any) => {
    if (!editor || !editor.schema) return;
    const { state } = editor;
    const $from = state.doc.resolve(state.selection.from);
    if ($from.parent.type.name === 'codeBlock' || $from.marks().some((m: any) => m.type.name === 'code')) {
      editor.chain().focus().deleteRange(wikiMenu.range).insertContent(`[[${suggestion.title}]]`).run();
    } else {
      editor.chain().focus().deleteRange(wikiMenu.range).insertContent({
        type: 'wikiLink',
        attrs: { target: suggestion.title, label: suggestion.title },
      }).run();
    }
    setWikiMenu((prev) => ({ ...prev, isOpen: false }));
  };

  return {
    slashMenu,
    wikiMenu,
    callbacks,
    filteredCommands,
    executeCommand,
    executeWikiLink,
  };
}
