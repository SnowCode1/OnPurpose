import assert from 'node:assert/strict';
import test from 'node:test';
import { JSDOM } from 'jsdom';
import { Editor } from '@tiptap/core';
import { act, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { useEditorReady } from '../src/richText/useEditorReady.ts';
import {
  descriptionExtensions,
  descriptionSnapshot,
  formatDescription,
} from '../src/richText/extensions.ts';
import { markdownDocument } from '../src/richText/markdownDocument.ts';
import {
  highlightColours,
  highlightMarkdown,
} from '../src/richText/highlights.ts';
import { parseDescription, descriptionSummary } from '../src/description.ts';
import { presetDescriptions } from '../src/presetDescriptions.ts';

const browser = new JSDOM('<html><body></body></html>', {
  pretendToBeVisual: true,
});
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
for (const key of [
  'window',
  'document',
  'navigator',
  'Node',
  'HTMLElement',
  'Element',
  'MutationObserver',
  'DOMParser',
  'getComputedStyle',
  'requestAnimationFrame',
  'cancelAnimationFrame',
])
  Object.defineProperty(globalThis, key, {
    value: browser.window[key],
    configurable: true,
  });
function fixture(t, original = 'A simple habit.', onLimit) {
  const editor = new Editor({
    element: document.createElement('div'),
    extensions: descriptionExtensions(onLimit),
    content: markdownDocument(original),
  });
  t.after(() => editor.destroy());
  return { editor, snapshot: () => descriptionSnapshot(editor, original) };
}
function highlightIds(markdown) {
  return parseDescription(markdown)
    .flatMap((token) => token.children ?? [])
    .filter((token) => token.type === 'highlight_open')
    .map((token) => token.attrGet('colour'));
}

test('bold and italic are reversible marks and each toolbar action is independently undoable', (t) => {
  const { editor, snapshot } = fixture(t, 'Focus');
  editor.commands.setTextSelection({ from: 1, to: 6 });
  formatDescription(editor, () => editor.commands.toggleBold());
  assert.equal(snapshot(), '**Focus**');
  formatDescription(editor, () => editor.commands.toggleBold());
  assert.equal(snapshot(), 'Focus');
  assert.ok(editor.commands.undo());
  assert.equal(snapshot(), '**Focus**');
  assert.ok(editor.commands.undo());
  assert.equal(snapshot(), 'Focus');
  assert.ok(editor.commands.redo());
  assert.equal(snapshot(), '**Focus**');
  formatDescription(editor, () => editor.commands.toggleItalic());
  assert.ok(editor.isActive('italic'));
  assert.ok(editor.isActive('bold'));
  assert.ok(editor.commands.undo());
  assert.ok(editor.isActive('bold'));
  assert.equal(editor.isActive('italic'), false);
});
test('formatting retains the selected range for repeated bold, italic and highlight actions', (t) => {
  const { editor } = fixture(t, 'Focus on one thing');
  const range = { from: 1, to: 6 };
  editor.commands.setTextSelection(range);
  for (const action of [
    () => editor.commands.toggleBold(),
    () => editor.commands.toggleBold(),
    () => editor.commands.toggleItalic(),
    () => editor.commands.setHighlight({ color: 'pink' }),
    () => editor.commands.setHighlight({ color: 'blue' }),
    () => editor.commands.unsetHighlight(),
  ]) {
    formatDescription(editor, action);
    assert.equal(editor.state.selection.from, range.from);
    assert.equal(editor.state.selection.to, range.to);
  }
});
test('native callback proxy replacements never rerun editor initialization or collapse a selection', async (t) => {
  const { editor } = fixture(t, 'Focus on one thing');
  const host = document.createElement('div');
  document.body.append(host);
  const root = createRoot(host);
  t.after(async () => {
    await act(async () => root.unmount());
    host.remove();
  });
  let ready = 0;
  function Probe({ onReady }) {
    useEditorReady(editor, onReady);
    return null;
  }
  const render = () =>
    act(async () => {
      root.render(createElement(Probe, { onReady: async () => ready++ }));
    });
  await render();
  assert.equal(ready, 1);
  assert.equal(editor.state.selection.from, editor.state.doc.content.size - 1);
  editor.commands.setTextSelection({ from: 1, to: 6 });
  formatDescription(editor, () => editor.commands.toggleBold());
  await render();
  formatDescription(editor, () =>
    editor.commands.setHighlight({ color: 'green' }),
  );
  await render();
  assert.equal(ready, 1);
  assert.equal(editor.state.selection.from, 1);
  assert.equal(editor.state.selection.to, 6);
});
test('new typing after local Undo clears only the editor redo branch', (t) => {
  const { editor, snapshot } = fixture(t, 'Hello');
  formatDescription(editor, () => editor.commands.insertContentAt(6, ' there'));
  assert.equal(snapshot(), 'Hello there');
  editor.commands.undo();
  assert.equal(snapshot(), 'Hello');
  assert.ok(editor.can().redo());
  editor.commands.insertContentAt(6, '!');
  assert.equal(snapshot(), 'Hello!');
  assert.equal(editor.can().redo(), false);
});
test('unchanged notes and local Undo preserve original Markdown bytes instead of causing no-op canonical edits', (t) => {
  for (const original of [
    ...Object.values(presetDescriptions),
    '  text\n\n__bold__ and *italic*\n\n3. first\n4. second\n',
    'one\ntwo',
  ]) {
    const { editor, snapshot } = fixture(t, original);
    assert.equal(snapshot(), original);
    formatDescription(editor, () => editor.commands.insertContentAt(1, 'New '));
    assert.notEqual(snapshot(), original);
    editor.commands.undo();
    assert.equal(snapshot(), original);
  }
});
test('all highlight colours survive Markdown serialization, reader parsing and re-editing', (t) => {
  for (const colour of Object.keys(highlightColours)) {
    const { editor, snapshot } = fixture(t, 'Important');
    editor.commands.setTextSelection({ from: 1, to: 10 });
    formatDescription(editor, () =>
      editor.commands.setHighlight({ color: colour }),
    );
    const markdown = snapshot();
    assert.deepEqual(highlightIds(markdown), [colour]);
    const document = markdownDocument(markdown);
    assert.equal(document.content[0].content[0].marks[0].attrs.color, colour);
    formatDescription(editor, () => editor.commands.unsetHighlight());
    assert.equal(snapshot(), 'Important');
    editor.commands.undo();
    assert.deepEqual(highlightIds(snapshot()), [colour]);
  }
});
test('changing a highlight replaces its colour, keeps other formatting and creates no nested marks', (t) => {
  const { editor, snapshot } = fixture(t, '**Important**');
  editor.commands.setTextSelection({ from: 1, to: 10 });
  formatDescription(editor, () =>
    editor.commands.setHighlight({ color: 'pink' }),
  );
  formatDescription(editor, () =>
    editor.commands.setHighlight({ color: 'blue' }),
  );
  assert.deepEqual(highlightIds(snapshot()), ['blue']);
  assert.ok(editor.isActive('bold'));
  assert.equal(
    editor
      .getJSON()
      .content[0].content[0].marks.filter((mark) => mark.type === 'highlight')
      .length,
    1,
  );
  const reopened = fixture(t, snapshot()).editor;
  reopened.commands.setTextSelection({ from: 1, to: 10 });
  assert.ok(reopened.isActive('bold'));
  assert.ok(reopened.isActive('highlight', { color: 'blue' }));
  editor.commands.undo();
  assert.deepEqual(highlightIds(snapshot()), ['pink']);
});
test('headings, lists and quotes toggle without duplicated Markdown and Undo restores the original block', (t) => {
  const { editor, snapshot } = fixture(t, 'Start small');
  editor.commands.setTextSelection(1);
  for (const command of [
    () => editor.commands.toggleHeading({ level: 2 }),
    () => editor.commands.toggleBulletList(),
    () => editor.commands.toggleOrderedList(),
    () => editor.commands.toggleBlockquote(),
  ]) {
    formatDescription(editor, command);
    assert.notEqual(snapshot(), 'Start small');
    formatDescription(editor, command);
    assert.equal(snapshot(), 'Start small');
    editor.commands.undo();
    assert.notEqual(snapshot(), 'Start small');
    editor.commands.undo();
    assert.equal(snapshot(), 'Start small');
  }
});
test('links can be edited and removed without losing their selected text; executable URLs are refused', (t) => {
  const { editor, snapshot } = fixture(
    t,
    '[My notes](obsidian://open?vault=Personal)',
  );
  editor.commands.setTextSelection({ from: 1, to: 9 });
  formatDescription(editor, () =>
    editor.commands.setLink({ href: 'https://example.com/notes' }),
  );
  assert.equal(snapshot(), '[My notes](https://example.com/notes)');
  formatDescription(editor, () => editor.commands.unsetLink());
  assert.equal(snapshot(), 'My notes');
  editor.commands.undo();
  assert.equal(snapshot(), '[My notes](https://example.com/notes)');
  assert.equal(editor.commands.setLink({ href: 'javascript:alert(1)' }), false);
});
test('raw HTML stays literal and images retain metadata without loading remote resources', (t) => {
  const { editor, snapshot } = fixture(
    t,
    '<script>alert(1)</script>\n\n![Picture](https://example.com/image.png "Title")',
  );
  // ProseMirror uses a source-less img as a caret separator beside inline atoms.
  // Assert booleans: printing a failed assertion's jsdom element can recursively
  // inspect the entire browser graph and exhaust the test process's memory.
  assert.equal(editor.view.dom.querySelector('script') !== null, false);
  assert.equal(editor.view.dom.querySelector('img[src]') !== null, false);
  assert.ok(editor.getText().includes('<script>'));
  editor.commands.insertContentAt(1, 'More ');
  assert.ok(snapshot().includes('https://example.com/image.png'));
  assert.ok(snapshot().includes('Title'));
  assert.equal(
    parseDescription(snapshot()).some((token) => token.type === 'html_block'),
    false,
  );
});
test('a formatting-aware length limit rejects oversized pastes atomically and keeps Undo functional', (t) => {
  let limited = 0;
  const { editor, snapshot } = fixture(t, 'Keep me', () => limited++);
  editor.commands.insertContentAt(8, 'x'.repeat(20000));
  assert.equal(snapshot(), 'Keep me');
  assert.ok(limited > 0);
  editor.commands.insertContentAt(8, '!');
  assert.equal(snapshot(), 'Keep me!');
  editor.commands.undo();
  assert.equal(snapshot(), 'Keep me');
});
test('highlight syntax is bounded, handles escaped delimiters and never admits arbitrary style or HTML', () => {
  const markdown = highlightMarkdown('a==b **bold**', 'green');
  assert.deepEqual(highlightIds(markdown), ['green']);
  assert.equal(descriptionSummary(markdown), 'a==b bold');
  for (const literal of [
    '=={red}text==',
    '=={background:url(x)}text==',
    '==one\ntwo==',
    '\\==literal==',
    '== ==',
  ])
    assert.deepEqual(highlightIds(literal), []);
  assert.deepEqual(highlightIds('`==code==`'), []);
});
