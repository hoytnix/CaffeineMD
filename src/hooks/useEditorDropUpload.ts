import { useCallback } from 'react';
import { EditorView } from '@tiptap/pm/view';
import { storeAsset } from '@/src/lib/storage/repositories/assetRepository';

interface UseEditorDropUploadOptions {
  activeWorkspaceId?: string;
}

export function useEditorDropUpload({ activeWorkspaceId = 'default-vault' }: UseEditorDropUploadOptions = {}) {
  const handleDrop = useCallback(
    (view: EditorView, event: DragEvent): boolean => {
      const files = event.dataTransfer?.files;
      if (!files || files.length === 0) return false;

      const droppedFile = files[0];
      if (droppedFile.type.startsWith('image/')) {
        event.preventDefault();
        const safeName = droppedFile.name
          ? droppedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
          : `image-${Date.now()}.png`;
        const safePath = `assets/${Date.now()}-${safeName}`;
        const objectUrl = URL.createObjectURL(droppedFile);

        const { schema } = view.state;
        const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

        if (coordinates) {
          const node = schema.nodes.image.create({
            src: objectUrl,
            alt: droppedFile.name || 'Dropped image',
            title: safePath,
          });
          const transaction = view.state.tr.insert(coordinates.pos, node);
          view.dispatch(transaction);
        }

        // Asynchronously persist to local IndexedDB asset repository
        storeAsset(activeWorkspaceId, safePath, droppedFile, droppedFile.type).catch((err) => {
          console.warn('Asset store warning:', err);
        });

        return true;
      }

      return false;
    },
    [activeWorkspaceId]
  );

  const handlePaste = useCallback(
    (view: EditorView, event: ClipboardEvent): boolean => {
      const items = event.clipboardData?.items;
      if (!items) return false;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            event.preventDefault();
            const safeName = file.name
              ? file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
              : `pasted-${Date.now()}.png`;
            const safePath = `assets/${Date.now()}-${safeName}`;
            const objectUrl = URL.createObjectURL(file);

            const { schema } = view.state;
            const { from } = view.state.selection;

            const node = schema.nodes.image.create({
              src: objectUrl,
              alt: file.name || 'Pasted image',
              title: safePath,
            });
            const transaction = view.state.tr.insert(from, node);
            view.dispatch(transaction);

            // Asynchronously persist to local IndexedDB asset repository
            storeAsset(activeWorkspaceId, safePath, file, file.type).catch((err) => {
              console.warn('Asset store warning:', err);
            });

            return true;
          }
        }
      }

      return false;
    },
    [activeWorkspaceId]
  );

  return {
    handleDrop,
    handlePaste,
  };
}
