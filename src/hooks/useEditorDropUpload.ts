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
        const reader = new FileReader();
        reader.onload = async (e) => {
          const src = e.target?.result as string;
          const { schema } = view.state;
          const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });

          if (coordinates) {
            // Also asynchronously persist to local asset repository
            try {
              const safePath = `assets/${Date.now()}-${droppedFile.name}`;
              await storeAsset(activeWorkspaceId, safePath, droppedFile, droppedFile.type);
            } catch (err) {
              console.warn('Asset store warning:', err);
            }

            const node = schema.nodes.image.create({ src, alt: droppedFile.name });
            const transaction = view.state.tr.insert(coordinates.pos, node);
            view.dispatch(transaction);
          }
        };
        reader.readAsDataURL(droppedFile);
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
            const reader = new FileReader();
            reader.onload = async (e) => {
              const src = e.target?.result as string;
              const { schema } = view.state;
              const { from } = view.state.selection;

              try {
                const safePath = `assets/${Date.now()}-${file.name || 'pasted-image.png'}`;
                await storeAsset(activeWorkspaceId, safePath, file, file.type);
              } catch (err) {
                console.warn('Asset store warning:', err);
              }

              const node = schema.nodes.image.create({ src, alt: file.name || 'image' });
              const transaction = view.state.tr.insert(from, node);
              view.dispatch(transaction);
            };
            reader.readAsDataURL(file);
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
