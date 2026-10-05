import { useEffect, useEffectEvent } from 'react';
import type { Editor } from '@tiptap/core';

export function useEditorReady(
  editor: Editor | null,
  onReady: () => Promise<void>,
) {
  // Expo DOM creates new callback proxies whenever native props are sent. Those
  // updates must not restart initialization and move an existing selection.
  const notifyReady = useEffectEvent(onReady);
  useEffect(() => {
    if (!editor) return;
    let active = true;
    void notifyReady().then(() => {
      if (active && !editor.isDestroyed && editor.isEditable)
        editor.commands.focus('end', { scrollIntoView: false });
    });
    return () => {
      active = false;
    };
  }, [editor]);
}
