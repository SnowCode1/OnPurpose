'use dom';

import { useEffect, useState, type Ref, type CSSProperties } from 'react';
import {
  useDOMImperativeHandle,
  type DOMImperativeFactory,
  type DOMProps,
} from 'expo/dom';
import { EditorContent, useEditor, useEditorState } from '@tiptap/react';
import {
  descriptionExtensions,
  formatDescription,
  descriptionSnapshot,
} from './richText/extensions';
import { markdownDocument } from './richText/markdownDocument';
import { highlightColours, type HighlightColour } from './richText/highlights';
import { descriptionLink } from './description';
import { contrastOnBlack } from './colors';
import { useEditorReady } from './richText/useEditorReady';
import './richText/editor.css';

export interface RichDescriptionRef extends DOMImperativeFactory {
  requestSnapshot: (action: unknown) => void;
}
export default function RichDescription({
  ref,
  initialValue,
  colour,
  fontScale,
  editable,
  onChange,
  onSnapshot,
  onReady,
  onLimit,
}: {
  ref: Ref<RichDescriptionRef>;
  initialValue: string;
  colour: string;
  fontScale: number;
  editable: boolean;
  onChange: (markdown: string) => Promise<void>;
  onSnapshot: (action: string, markdown: string) => Promise<void>;
  onReady: () => Promise<void>;
  onLimit: () => Promise<void>;
  dom?: DOMProps;
}) {
  const [menu, setMenu] = useState<'text' | 'colour' | 'link' | null>(null);
  const [link, setLink] = useState({
    from: 1,
    to: 1,
    href: '',
    label: '',
    existing: false,
  });
  const [linkError, setLinkError] = useState('');
  const editor = useEditor({
    extensions: descriptionExtensions(() => {
      void onLimit();
    }),
    content: markdownDocument(initialValue),
    editable,
    editorProps: {
      attributes: {
        role: 'textbox',
        'aria-label': 'Habit description',
        'aria-multiline': 'true',
        spellcheck: 'true',
      },
      handleClick: (_view, _position, event) => {
        if ((event.target as Element).closest('a')) {
          event.preventDefault();
          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      void onChange(descriptionSnapshot(editor, initialValue));
    },
  });
  const state = useEditorState({
    editor,
    selector: ({ editor }) =>
      editor
        ? {
            bold: editor.isActive('bold'),
            italic: editor.isActive('italic'),
            heading: editor.getAttributes('heading').level as
              number | undefined,
            bullet: editor.isActive('bulletList'),
            ordered: editor.isActive('orderedList'),
            quote: editor.isActive('blockquote'),
            strike: editor.isActive('strike'),
            code: editor.isActive('code'),
            link: editor.isActive('link'),
            highlight: editor.getAttributes('highlight').color as
              HighlightColour | undefined,
            undo: editor.can().undo(),
            redo: editor.can().redo(),
          }
        : null,
  });
  useDOMImperativeHandle(
    ref,
    () => ({
      requestSnapshot: (action: unknown) => {
        if (editor && typeof action === 'string')
          void onSnapshot(action, descriptionSnapshot(editor, initialValue));
      },
    }),
    [editor, initialValue, onSnapshot],
  );
  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);
  useEditorReady(editor, onReady);
  if (!editor) return null;
  function tool(
    label: string,
    symbol: string,
    action: () => void,
    active = false,
    disabled = false,
  ) {
    return (
      <button
        type="button"
        aria-label={label}
        aria-pressed={active}
        disabled={!editable || disabled}
        className="tool"
        onPointerDown={(event) => event.preventDefault()}
        onClick={action}
      >
        {symbol}
      </button>
    );
  }
  function textAction(action: () => void) {
    if (editor) formatDescription(editor, action);
    setMenu(null);
  }
  function openLink() {
    if (!editor) return;
    if (editor.isActive('link')) editor.commands.extendMarkRange('link');
    const { from, to } = editor.state.selection;
    setLink({
      from,
      to,
      href: editor.getAttributes('link').href ?? '',
      label: editor.state.doc.textBetween(from, to, ' '),
      existing: editor.isActive('link'),
    });
    setLinkError('');
    setMenu(menu === 'link' ? null : 'link');
  }
  function cancelLink() {
    setMenu(null);
    editor
      ?.chain()
      .setTextSelection({ from: link.from, to: link.to })
      .focus(null, { scrollIntoView: false })
      .run();
  }
  function saveLink() {
    if (!editor) return;
    const href = descriptionLink(link.href);
    if (!href) {
      setLinkError('Enter a full web or app link, such as https://…');
      return;
    }
    formatDescription(editor, () => {
      if (link.from === link.to) {
        const label = link.label.trim() || href;
        editor
          .chain()
          .focus()
          .setTextSelection({ from: link.from, to: link.to })
          .insertContent({
            type: 'text',
            text: label,
            marks: [{ type: 'link', attrs: { href } }],
          })
          .setTextSelection({ from: link.from, to: link.from + label.length })
          .run();
      } else
        editor
          .chain()
          .focus()
          .setTextSelection({ from: link.from, to: link.to })
          .setLink({ href })
          .run();
    });
    setMenu(null);
  }
  return (
    <div
      className="description-editor"
      style={
        {
          '--note-size': `${17 * Math.max(1, fontScale)}px`,
          '--note-colour': colour,
          '--note-link': contrastOnBlack(colour) >= 4.5 ? colour : '#B7DCCF',
        } as CSSProperties
      }
    >
      <div
        className="toolbar"
        inert={menu === 'link'}
        role="toolbar"
        aria-label="Description formatting"
      >
        {tool(
          'Undo description edit',
          '↶',
          () => {
            setMenu(null);
            editor.chain().focus().undo().run();
          },
          false,
          !state?.undo,
        )}
        {tool(
          'Redo description edit',
          '↷',
          () => {
            setMenu(null);
            editor.chain().focus().redo().run();
          },
          false,
          !state?.redo,
        )}
        <span className="separator" />
        {tool(
          'Bold',
          'B',
          () =>
            formatDescription(editor, () => {
              editor.chain().focus().toggleBold().run();
            }),
          state?.bold,
        )}
        {tool(
          'Italic',
          '𝘐',
          () =>
            formatDescription(editor, () => {
              editor.chain().focus().toggleItalic().run();
            }),
          state?.italic,
        )}
        {tool(
          'Text and list options',
          'Aa',
          () => setMenu(menu === 'text' ? null : 'text'),
          menu === 'text',
        )}
        {tool(
          'Add or edit link',
          '↗',
          openLink,
          state?.link || menu === 'link',
        )}
        {tool(
          'Highlight colours',
          '◒',
          () => setMenu(menu === 'colour' ? null : 'colour'),
          !!state?.highlight || menu === 'colour',
        )}
      </div>
      {menu === 'text' && (
        <div className="popover choices" role="group" aria-label="Text styles">
          {[
            [
              'Text',
              () => editor.chain().focus().setParagraph().run(),
              !state?.heading,
            ],
            [
              'Heading',
              () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
              state?.heading === 2,
            ],
            [
              'Bullets',
              () => editor.chain().focus().toggleBulletList().run(),
              state?.bullet,
            ],
            [
              'Numbered list',
              () => editor.chain().focus().toggleOrderedList().run(),
              state?.ordered,
            ],
            [
              'Quote',
              () => editor.chain().focus().toggleBlockquote().run(),
              state?.quote,
            ],
            [
              'Strikethrough',
              () => editor.chain().focus().toggleStrike().run(),
              state?.strike,
            ],
            [
              'Code',
              () => editor.chain().focus().toggleCode().run(),
              state?.code,
            ],
            [
              'Clear formatting',
              () => editor.chain().focus().unsetAllMarks().clearNodes().run(),
              false,
            ],
          ].map(([label, action, active]) => (
            <button
              type="button"
              key={String(label)}
              aria-pressed={!!active}
              disabled={!editable}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => textAction(action as () => void)}
            >
              {String(label)}
            </button>
          ))}
        </div>
      )}
      {menu === 'colour' && (
        <div
          className="popover colours"
          role="group"
          aria-label="Highlight colour"
        >
          <button
            type="button"
            disabled={!editable}
            onPointerDown={(event) => event.preventDefault()}
            onClick={() =>
              textAction(() => editor.chain().focus().unsetHighlight().run())
            }
          >
            None
          </button>
          {(Object.keys(highlightColours) as HighlightColour[]).map((id) => (
            <button
              type="button"
              key={id}
              aria-label={`${highlightColours[id].label} highlight`}
              aria-pressed={state?.highlight === id}
              disabled={!editable}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() =>
                textAction(() => {
                  if (editor.isActive('highlight', { color: id }))
                    editor.chain().focus().unsetHighlight().run();
                  else editor.chain().focus().setHighlight({ color: id }).run();
                })
              }
            >
              <span
                className="swatch"
                style={{
                  background: highlightColours[id].background,
                  color: highlightColours[id].text,
                }}
              >
                A
              </span>
            </button>
          ))}
        </div>
      )}
      <div
        className="writing-area"
        inert={menu === 'link'}
        onClick={() => {
          if (menu !== 'link') setMenu(null);
        }}
      >
        <EditorContent editor={editor} />
      </div>
      {menu === 'link' && (
        <div className="link-overlay">
          <button
            type="button"
            className="link-backdrop"
            aria-label="Cancel link editing"
            onClick={cancelLink}
          />
          <form
            className="link-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="link-title"
            onSubmit={(event) => {
              event.preventDefault();
              if (editable) saveLink();
            }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                cancelLink();
              }
            }}
          >
            <div className="link-fields">
              <h2 id="link-title">
                {link.existing ? 'Edit link' : 'Add link'}
              </h2>
              {link.from === link.to && (
                <input
                  aria-label="Link title"
                  placeholder="Link title · optional"
                  disabled={!editable}
                  value={link.label}
                  onChange={(event) =>
                    setLink({ ...link, label: event.target.value })
                  }
                />
              )}
              <input
                aria-label="Link address"
                placeholder="https://… or an app link"
                inputMode="url"
                autoCapitalize="none"
                autoCorrect="off"
                autoFocus
                disabled={!editable}
                value={link.href}
                onChange={(event) =>
                  setLink({ ...link, href: event.target.value })
                }
              />
              {linkError && (
                <p className="link-error" role="alert">
                  {linkError}
                </p>
              )}
            </div>
            <div className="link-actions">
              <button type="button" onClick={cancelLink}>
                Cancel
              </button>
              {link.existing && (
                <button
                  type="button"
                  disabled={!editable}
                  onClick={() =>
                    textAction(() =>
                      editor
                        .chain()
                        .focus()
                        .setTextSelection({ from: link.from, to: link.to })
                        .unsetLink()
                        .run(),
                    )
                  }
                >
                  Remove link
                </button>
              )}
              <button type="submit" className="link-apply" disabled={!editable}>
                Apply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
