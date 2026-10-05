import type { Editor } from '@tiptap/core';

export function clearDescriptionFormatting(editor: Editor) {
  let chain = editor.chain().focus(null, { scrollIntoView: false });
  for (const mark of Object.values(editor.schema.marks)) {
    if (mark.name !== 'link') chain = chain.unsetMark(mark);
  }
  return chain.clearNodes().run();
}
