import { db, VaultFile } from '@/src/lib/storage/db';
import { detectCodeLanguage } from '@/src/lib/markdown/markdownToHtml';

export function handleWikiLinkDomClick(
  event: MouseEvent,
  openFileTab: (path: string, title?: string) => void,
  activeWorkspaceId = 'default-vault'
): boolean {
  const target = event.target as HTMLElement;
  if (target.closest('pre') || target.closest('code')) return false;

  const wikiLinkEl = target.closest('[data-wikilink]') as HTMLElement;
  if (!wikiLinkEl) return false;

  const targetTitle = wikiLinkEl.getAttribute('data-wikilink');
  if (!targetTitle) return false;

  db.files
    .where('title')
    .equalsIgnoreCase(targetTitle)
    .first()
    .then((found) => {
      if (found) {
        openFileTab(found.path, found.title);
      } else {
        db.files.get(`${targetTitle}.md`).then((byPath) => {
          if (byPath) {
            openFileTab(byPath.path, byPath.title);
          } else {
            const newPath = `${targetTitle}.md`;
            const newNote: VaultFile = {
              id: newPath,
              path: newPath,
              name: newPath,
              title: targetTitle,
              extension: 'md',
              content: `# ${targetTitle}\n\nCreated from WikiLink.`,
              frontmatter: { title: targetTitle },
              tags: [],
              isBinary: false,
              size: 100,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              vaultId: activeWorkspaceId,
            };
            db.files.put(newNote).then(() => {
              openFileTab(newPath, targetTitle);
            });
          }
        });
      }
    });

  return true;
}

export function autoDetectUnlabeledCodeBlocks(currentEditor: any) {
  if (!currentEditor || currentEditor.isDestroyed || !currentEditor.state) return;
  try {
    const { doc, tr } = currentEditor.state;
    let modified = false;
    doc.descendants((node: any, pos: number) => {
      if (node.type.name === 'codeBlock' && (!node.attrs.language || node.attrs.language === 'plaintext')) {
        const text = node.textContent;
        if (text && text.trim().length >= 4) {
          const detected = detectCodeLanguage(text);
          if (detected && detected !== 'plaintext') {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, language: detected });
            modified = true;
          }
        }
      }
    });
    if (modified) currentEditor.view.dispatch(tr);
  } catch (err) {
    console.warn('Language auto-detection error:', err);
  }
}
