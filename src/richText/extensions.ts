import { Extension, Node, type Editor } from '@tiptap/core';
import { StarterKit } from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extension-placeholder';
import { closeHistory } from '@tiptap/pm/history';
import { Plugin } from '@tiptap/pm/state';
import { descriptionLink, MAX_DESCRIPTION_LENGTH } from '../description.ts';
import {
  highlightColours,
  highlightMarkdown,
  isHighlightColour,
} from './highlights.ts';
import { markdownDocument } from './markdownDocument.ts';

const ColouredHighlight = Highlight.extend({
  addAttributes() {
    return {
      color: {
        default: 'yellow',
        parseHTML: (element) =>
          isHighlightColour(element.getAttribute('data-highlight'))
            ? element.getAttribute('data-highlight')
            : 'yellow',
      },
    };
  },
  renderHTML({ HTMLAttributes }) {
    const id = isHighlightColour(HTMLAttributes.color)
      ? HTMLAttributes.color
      : 'yellow';
    const colour = highlightColours[id];
    return [
      'mark',
      {
        'data-highlight': id,
        style: `background-color:${colour.background};color:${colour.text}`,
      },
      0,
    ];
  },
  renderMarkdown: (node, helpers) =>
    highlightMarkdown(helpers.renderChildren(node), node.attrs?.color),
});
const ImageNote = Node.create({
  name: 'imageNote',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes: () => ({
    alt: { default: '' },
    src: { default: '' },
    title: { default: null },
  }),
  renderHTML: ({ node }) => [
    'span',
    { 'data-image-note': '', class: 'image-note' },
    node.attrs.alt || 'Image',
  ],
  renderMarkdown: (node) =>
    `![${String(node.attrs?.alt ?? '').replace(/([\\\[\]])/g, '\\$1')}](${node.attrs?.src ?? ''}${node.attrs?.title ? ` "${String(node.attrs.title).replace(/"/g, '\\"')}"` : ''})`,
});
// Bound stored Markdown, including formatting, rather than only visible text.
export function descriptionExtensions(onLimit: () => void = () => {}) {
  return [
    StarterKit.configure({
      underline: false,
      trailingNode: false,
      undoRedo: { depth: 100, newGroupDelay: 500 },
      link: {
        openOnClick: false,
        autolink: true,
        enableClickSelection: true,
        isAllowedUri: (value) => descriptionLink(value) !== null,
      },
    }),
    Markdown,
    ColouredHighlight,
    ImageNote,
    Placeholder.configure({
      placeholder:
        'Why this matters, a simple starting point, or a link to my notes…',
    }),
    Extension.create({
      name: 'descriptionLimit',
      addProseMirrorPlugins() {
        const editor = this.editor;
        return [
          new Plugin({
            filterTransaction(transaction) {
              if (!transaction.docChanged) return true;
              const markdown =
                editor.markdown?.serialize(transaction.doc.toJSON()) ?? '';
              if (markdown.length <= MAX_DESCRIPTION_LENGTH) return true;
              onLimit();
              return false;
            },
          }),
        ];
      },
    }),
  ];
}
export function formatDescription(editor: Editor, action: () => void) {
  editor.view.dispatch(closeHistory(editor.state.tr));
  action();
  editor.view.dispatch(closeHistory(editor.state.tr));
}
const initialDocuments = new WeakMap<
  Editor,
  { source: string; document: ReturnType<Editor['schema']['nodeFromJSON']> }
>();
export function descriptionSnapshot(editor: Editor, original: string): string {
  let initial = initialDocuments.get(editor);
  if (!initial || initial.source !== original) {
    initial = {
      source: original,
      document: editor.schema.nodeFromJSON(markdownDocument(original)),
    };
    initialDocuments.set(editor, initial);
  }
  return editor.state.doc.eq(initial.document)
    ? original
    : editor.getMarkdown();
}
