import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  serializedDrafts,
  sqliteDrafts,
  memoryDrafts,
  validateDraft,
} from '../src/storage/descriptionDraftModel.ts';
const draft = { version: 1, base: 'Saved note', text: '**Unfinished** draft' };
const port = (db) => ({
  async getFirstAsync(sql, ...params) {
    return db.prepare(sql).get(...params) ?? null;
  },
  async runAsync(sql, ...params) {
    db.prepare(sql).run(...params);
  },
});
test('draft format permits empty edits but rejects invalid, oversized or future data', () => {
  validateDraft({ version: 1, base: '', text: '' });
  for (const invalid of [
    null,
    [],
    {},
    { ...draft, version: 2 },
    { ...draft, text: 1 },
    { ...draft, base: null },
    { ...draft, extra: true },
    { ...draft, text: 'x'.repeat(20001) },
  ])
    assert.throws(() => validateDraft(invalid));
});
test('native draft SQL survives reopen separately, binds user text and retains corrupt data for visible recovery errors', async (t) => {
  const directory = mkdtempSync(join(tmpdir(), 'onpurpose-drafts-'));
  const file = join(directory, 'drafts.db');
  let db = new DatabaseSync(file);
  t.after(() => {
    db.close();
    rmSync(directory, { recursive: true, force: true });
  });
  db.exec(
    'CREATE TABLE description_drafts (draft_key TEXT PRIMARY KEY, draft_json TEXT NOT NULL)',
  );
  let adapter = serializedDrafts(sqliteDrafts(port(db)));
  const maliciousText = {
    ...draft,
    text: "quote'); DROP TABLE description_drafts; --\n[notes](https://example.com)",
  };
  await adapter.put('habit-test', maliciousText);
  await adapter.put('new-habit', { ...draft, text: '' });
  db.close();
  db = new DatabaseSync(file);
  adapter = serializedDrafts(sqliteDrafts(port(db)));
  assert.deepEqual(await adapter.get('habit-test'), maliciousText);
  assert.equal((await adapter.get('new-habit')).text, '');
  await adapter.remove('habit-test');
  assert.equal(await adapter.get('habit-test'), null);
  assert.equal(
    db
      .prepare(
        "SELECT COUNT(*) AS total FROM sqlite_master WHERE name = 'changes'",
      )
      .get().total,
    0,
  );
  db.prepare('UPDATE description_drafts SET draft_json = ?').run('broken');
  await assert.rejects(adapter.get('new-habit'));
  assert.equal(
    db.prepare('SELECT draft_json FROM description_drafts').get().draft_json,
    'broken',
  );
});
test('writes and discard are serialized, including after a failed write', async () => {
  const memory = memoryDrafts();
  let release;
  const waiting = new Promise((resolve) => {
    release = resolve;
  });
  let first = true;
  const adapter = serializedDrafts({
    ...memory,
    async put(key, value) {
      if (first) {
        first = false;
        await waiting;
        throw new Error('Unavailable');
      }
      return memory.put(key, value);
    },
  });
  const failed = adapter.put('h', draft);
  const accepted = adapter.put('h', { ...draft, text: 'Latest draft' });
  const discarded = adapter.remove('h');
  release();
  await assert.rejects(failed);
  await accepted;
  await discarded;
  assert.equal(await adapter.get('h'), null);
});
test('sample drafts are memory-only and isolated from real draft adapters', async () => {
  const sample = memoryDrafts(),
    real = memoryDrafts();
  await sample.put('h', draft);
  assert.equal(await real.get('h'), null);
  await sample.remove('h');
  assert.equal(await sample.get('h'), null);
});
