import assert from 'node:assert/strict';
import test from 'node:test';
import { descriptionUpdateQueue } from '../src/richText/descriptionUpdateQueue.ts';
function fixture() {
  let time = 0,
    id = 0;
  const jobs = new Map();
  const reports = [];
  let value = 'initial';
  const queue = descriptionUpdateQueue(() => reports.push(value), {
    setTimeout: (callback, delay) => {
      const key = ++id;
      jobs.set(key, { callback, at: time + delay });
      return key;
    },
    clearTimeout: (key) => jobs.delete(key),
  });
  function advance(amount) {
    const end = time + amount;
    for (;;) {
      const next = [...jobs]
        .filter(([, j]) => j.at <= end)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!next) break;
      time = next[1].at;
      jobs.delete(next[0]);
      next[1].callback();
    }
    time = end;
  }
  return {
    queue,
    reports,
    advance,
    edit: (next) => {
      value = next;
      queue.queue();
    },
    jobs,
  };
}
test('a typing burst reports only its latest state after a quiet period', () => {
  const f = fixture();
  f.edit('a');
  f.advance(100);
  f.edit('ab');
  f.advance(100);
  f.edit('abc');
  f.advance(199);
  assert.equal(f.reports.length, 0);
  f.advance(1);
  assert.deepEqual(f.reports, ['abc']);
  assert.equal(f.jobs.size, 0);
});
test('uninterrupted typing still reports by the deadline and starts a fresh window', () => {
  const f = fixture();
  for (let i = 0; i < 10; i++) {
    f.edit(String(i));
    f.advance(100);
  }
  assert.deepEqual(f.reports, ['9']);
  f.edit('last');
  f.advance(200);
  assert.deepEqual(f.reports, ['9', 'last']);
});
test('background or disposal flushes exactly once, while explicit snapshots cancel queued copies', () => {
  const f = fixture();
  f.edit('first');
  assert.equal(f.queue.flush(), true);
  assert.equal(f.queue.flush(), false);
  f.advance(2000);
  assert.deepEqual(f.reports, ['first']);
  f.edit('exact snapshot');
  f.queue.cancel();
  f.advance(2000);
  assert.deepEqual(f.reports, ['first']);
  f.edit('last');
  f.queue.dispose();
  f.edit('ignored');
  f.advance(2000);
  assert.deepEqual(f.reports, ['first', 'last']);
  assert.equal(f.jobs.size, 0);
});
