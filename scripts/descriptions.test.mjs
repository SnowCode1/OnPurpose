import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  MAX_DESCRIPTION_LENGTH,
  normalizeDescription,
  validDescription,
  descriptionLink,
  parseDescription,
  descriptionSummary,
  descriptionPreview,
  insertDescriptionMarkup,
} from '../src/description.ts';
import { demoHabits } from '../src/habits.ts';
import {
  presetDescriptions,
  genericPlaceholderDescription,
} from '../src/presetDescriptions.ts';
import { ChangeStore } from '../src/storage/store.ts';
import { browserRepository } from '../src/storage/browserRepository.ts';
import { replayEvents, applyEvent } from '../src/storage/model.ts';
import { encodeArchive, decodeArchive } from '../src/storage/archive.ts';
import { applyPlaceholderDescriptions } from '../src/storage/presetDescriptions.ts';
import { historyPresentation } from '../src/history.ts';

let counter = 0;
const metadata = (sequence) => ({
  version: 7,
  id: `note-${++counter}`,
  sequence,
  recordedAt: '2026-10-05T02:00:00.000Z',
  timeZone: 'Australia/Melbourne',
  utcOffsetMinutes: 660,
});
const digest = async (text) => createHash('sha256').update(text).digest('hex');
async function fixture(habits = demoHabits, version = 6) {
  let raw = null;
  const repository = browserRepository(
    {
      getItem: () => raw,
      setItem: (_, value) => {
        raw = value;
      },
    },
    () => ({ ...metadata(1), version, type: 'initialize', habits }),
  );
  const store = new ChangeStore(repository, metadata);
  await store.load();
  return { store, repository };
}
function edit(store, after, index = 0) {
  const before = store.getSnapshot().replay.state.habits[index];
  return store.change({
    kind: 'habit',
    habitId: before.id,
    index,
    before,
    after,
  });
}

test('plain text and Markdown keep whitespace meaning while blank notes become absent', () => {
  assert.equal(normalizeDescription(' \n\t'), undefined);
  assert.equal(
    normalizeDescription('  first\r\n\r    code\r'),
    '  first\n\n    code\n',
  );
  assert.ok(validDescription('x'.repeat(MAX_DESCRIPTION_LENGTH)));
  for (const invalid of [
    '',
    '  ',
    null,
    1,
    {},
    'x'.repeat(MAX_DESCRIPTION_LENGTH + 1),
  ])
    assert.equal(validDescription(invalid), false);
  assert.equal(
    descriptionSummary(
      '# Purpose\n\n**Start** with [my notes](https://example.com).\n\n- One\n- Two',
    ),
    'Purpose Start with my notes. One Two',
  );
});
test('rendering supports Markdown and explicit app links without executing HTML or loading images', () => {
  const source =
    '# Motivation\n\n**Bold** and _italic_, `code`.\n\n> A reminder\n\n1. Begin\n2. Continue\n\n[Notes](obsidian://open?vault=Personal) and https://example.com\n\n![Image description](https://example.com/image.png)\n\n<script>alert(1)</script>';
  const tokens = parseDescription(source);
  for (const type of ['heading_open', 'blockquote_open', 'ordered_list_open'])
    assert.ok(tokens.some((token) => token.type === type));
  const inline = tokens.flatMap((token) => token.children ?? []);
  for (const type of ['strong_open', 'em_open', 'code_inline', 'image'])
    assert.ok(inline.some((token) => token.type === type));
  assert.ok(
    inline.some(
      (token) =>
        token.type === 'link_open' &&
        token.attrGet('href').startsWith('obsidian:'),
    ),
  );
  assert.ok(
    inline.some(
      (token) =>
        token.type === 'link_open' &&
        token.attrGet('href') === 'https://example.com',
    ),
  );
  assert.equal(
    tokens.some((token) => token.type === 'html_block'),
    false,
  );
  assert.equal(
    inline.some((token) => token.type === 'html_inline'),
    false,
  );
  assert.ok(descriptionSummary(source).includes('Image description'));
  for (const link of [
    'javascript:alert(1)',
    'data:text/html,hello',
    'file:///secret',
    'intent://open',
    '/relative',
    'https:/bad',
    'http://',
    'https://exa mple.com',
    'foo:\u0000bar',
  ])
    assert.equal(descriptionLink(link), null);
  assert.equal(
    descriptionLink(' mailto:hello@example.com '),
    'mailto:hello@example.com',
  );
  assert.equal(
    parseDescription('[unsafe](javascript:alert(1))')
      .flatMap((token) => token.children ?? [])
      .some((token) => token.type === 'link_open'),
    false,
  );
});
test('stats previews retain complete Markdown blocks and expose long notes for expansion', () => {
  const text =
    'A short purpose.\n\n- first\n- second\n\n[More](https://example.com)';
  const preview = descriptionPreview(text, false);
  assert.equal(preview.truncated, true);
  assert.equal(preview.tokens.at(-1).type, 'bullet_list_close');
  assert.equal(
    descriptionPreview(text, true).tokens.length,
    parseDescription(text).length,
  );
  assert.equal(descriptionPreview('Short', false).truncated, false);
  assert.equal(descriptionPreview('x'.repeat(500), false).truncated, true);
});
test('editor shortcuts preserve surrounding text and select the intended edit target', () => {
  const bold = insertDescriptionMarkup(
    'before note after',
    { start: 7, end: 11 },
    'bold',
  );
  assert.equal(bold.text, 'before **note** after');
  assert.equal(
    bold.text.slice(bold.selection.start, bold.selection.end),
    'note',
  );
  const link = insertDescriptionMarkup('notes', { start: 0, end: 5 }, 'link');
  assert.equal(link.text, '[notes](https://)');
  assert.equal(
    link.text.slice(link.selection.start, link.selection.end),
    'https://',
  );
  const list = insertDescriptionMarkup('hello', { start: 5, end: 5 }, 'list');
  assert.equal(list.text, 'hello\n- item');
  assert.equal(
    list.text.slice(list.selection.start, list.selection.end),
    'item',
  );
  assert.equal(
    insertDescriptionMarkup('', { start: -2, end: 99 }, 'bold').text,
    '**text**',
  );
});
test('v7 rejects malformed descriptions and older definitions reject the new field', async () => {
  const { store } = await fixture();
  const before = store.getSnapshot().replay.state.habits[0];
  for (const description of [
    '',
    '  ',
    null,
    undefined,
    1,
    {},
    'x'.repeat(MAX_DESCRIPTION_LENGTH + 1),
  ])
    assert.throws(() => edit(store, { ...before, description }));
  for (const version of [1, 2, 3, 4, 5, 6])
    assert.throws(() =>
      replayEvents([
        {
          ...metadata(1),
          version,
          type: 'initialize',
          habits: [
            { id: 'h', name: 'Habit', color: '#82E6BC', description: 'Note' },
          ],
        },
      ]),
    );
  assert.ok(
    edit(store, { ...before, description: 'x'.repeat(MAX_DESCRIPTION_LENGTH) }),
  );
  assert.throws(
    () =>
      applyEvent(store.getSnapshot().replay, {
        ...metadata(3),
        version: 6,
        type: 'preference',
        change: { kind: 'haptics', before: true, after: false },
      }),
    /version-7/,
  );
});
test('description edits and clears have concise History labels', async () => {
  const { store } = await fixture();
  const habit = store.getSnapshot().replay.state.habits[0];
  edit(store, { ...habit, description: 'Purpose' });
  assert.equal(
    historyPresentation(
      store.getSnapshot().replay.undo.at(-1),
      store.getSnapshot().replay.state,
    ).summary,
    'Description edited',
  );
  // Separate Undo/Redo closes the correction group before a second edit.
  store.undo();
  store.redo();
  edit(store, habit);
  assert.equal(
    historyPresentation(
      store.getSnapshot().replay.undo.at(-1),
      store.getSnapshot().replay.state,
    ).summary,
    'Description cleared',
  );
});
test('every existing preset and custom/archived habit gets an undoable placeholder without losing entries', async () => {
  const custom = {
    id: 'custom',
    name: 'My custom habit',
    color: '#82E6BC',
    archived: true,
  };
  const { store, repository } = await fixture([...demoHabits, custom]);
  store.change({
    kind: 'entry',
    habitId: 'read',
    date: '2026-10-04',
    before: null,
    after: 25,
  });
  assert.equal(applyPlaceholderDescriptions(store), 13);
  await store.flush();
  assert.deepEqual(
    store.getSnapshot().replay.state.habits.slice(0, 12),
    demoHabits.map((habit) => ({
      ...habit,
      description: presetDescriptions[habit.id],
    })),
  );
  assert.equal(
    store.getSnapshot().replay.state.habits.at(-1).description,
    genericPlaceholderDescription,
  );
  assert.equal(store.getSnapshot().replay.state.habits.at(-1).archived, true);
  assert.equal(store.getSnapshot().replay.state.values['read:2026-10-04'], 25);
  assert.equal(store.getSnapshot().replay.undo.length, 14);
  const reopened = new ChangeStore(repository, metadata);
  await reopened.load();
  assert.equal(applyPlaceholderDescriptions(reopened), 0);
  assert.ok(reopened.undo());
  await reopened.flush();
  assert.equal(
    reopened.getSnapshot().replay.state.habits.at(-1).description,
    undefined,
  );
  assert.equal(applyPlaceholderDescriptions(reopened), 0);
});
test('placeholder population respects descriptions, removals, Undo, and new intentionally blank habits', async () => {
  const { store } = await fixture();
  edit(store, { ...demoHabits[0], description: 'My real purpose' });
  store.undo(); // Raw log still remembers an explicit description decision.
  assert.equal(applyPlaceholderDescriptions(store), 11);
  assert.equal(
    store.getSnapshot().replay.state.habits[0].description,
    undefined,
  );
  store.undo();
  store.redo();
  const before = store.getSnapshot().replay.state.habits[1];
  const { description: _description, ...without } = before;
  edit(store, without, 1);
  assert.equal(applyPlaceholderDescriptions(store), 0);
  const fresh = await fixture(
    [{ id: 'new', name: 'New habit', color: '#82E6BC' }],
    7,
  );
  assert.equal(applyPlaceholderDescriptions(fresh.store), 0);
});
test('legacy v1–v6 backups accept v7 descriptions and retain every original raw event', async () => {
  for (const version of [1, 2, 3, 4, 5, 6]) {
    const original = JSON.parse(
      readFileSync(
        new URL(`../docs/examples/storage-v${version}.json`, import.meta.url),
        'utf8',
      ),
    );
    const { replay, events } = await decodeArchive(
      JSON.stringify(original),
      digest,
    );
    const before = replay.state.habits[0];
    const next = {
      ...metadata(events.length + 1),
      type: 'change',
      groupId: `upgrade-${version}`,
      change: {
        kind: 'habit',
        habitId: before.id,
        index: 0,
        before,
        after: {
          ...before,
          description: '**My motivation**\n\n[Notes](https://example.com)',
        },
      },
    };
    next.id = next.groupId;
    const result = await decodeArchive(
      await encodeArchive(
        [...events, next],
        '2026-10-05T03:00:00.000Z',
        digest,
      ),
      digest,
    );
    assert.deepEqual(result.events.slice(0, -1), original.events);
    assert.equal(
      result.replay.state.habits[0].description,
      next.change.after.description,
    );
    assert.deepEqual(result.replay.state.values, replay.state.values);
  }
});
test('documented v7 backup restores descriptions while keeping its legacy prefix', async () => {
  const prior = JSON.parse(
    readFileSync(
      new URL('../docs/examples/storage-v6.json', import.meta.url),
      'utf8',
    ),
  );
  const { events, replay } = await decodeArchive(
    readFileSync(
      new URL('../docs/examples/storage-v7.json', import.meta.url),
      'utf8',
    ),
    digest,
  );
  assert.deepEqual(events.slice(0, prior.events.length), prior.events);
  assert.ok(replay.state.habits[0].description.includes('[My notes]'));
  assert.equal(replay.state.values['walk:2026-10-04'], 1);
});
