import { useEffect, useEffectEvent } from 'react';
import type { Editor } from '@tiptap/core';

export function useEditorReady(
  editor: Editor | null,
  onReady: () => Promise<void>,
  initialize?: (editor: Editor) => void,
) {
  // Expo DOM creates new callback proxies whenever native props are sent. Those
  // updates must not restart initialization and move an existing selection.
  const notifyReady = useEffectEvent(onReady);
  const initializeEditor = useEffectEvent((readyEditor: Editor) => {
    if (initialize) initialize(readyEditor);
    else if (readyEditor.isEditable)
      readyEditor.commands.focus('end', { scrollIntoView: false });
  });
  useEffect(() => {
    if (!editor) return;
    let active = true;
    void notifyReady().then(() => {
      if (active && !editor.isDestroyed) initializeEditor(editor);
    });
    return () => {
      active = false;
    };
  }, [editor]);
}
