import test from 'node:test';
import assert from 'node:assert/strict';
import {
  descriptionChangeNavigator,
  nextChangedPassage,
} from '../src/descriptionChangeNavigation.ts';
const passages = [false, true, false, false, true, false].map((changed) => ({
  changed,
  tokens: [],
}));
function fixture(reduced = false) {
  const indexed = [],
    offsets = [];
  const port = {
    scrollToIndex: (value) => indexed.push(value),
    scrollToOffset: (value) => offsets.push(value),
  };
  const nav = descriptionChangeNavigator(passages, reduced);
  return { nav, port, indexed, offsets };
}
test('Next change advances from the viewed passage and wraps, with no target for unchanged text', () => {
  assert.equal(nextChangedPassage(passages, 0), 1);
  assert.equal(nextChangedPassage(passages, 1), 4);
  assert.equal(nextChangedPassage(passages, 5), 1);
  assert.equal(nextChangedPassage([], -1), -1);
  assert.equal(nextChangedPassage([{ changed: false, tokens: [] }], 0), -1);
  const { nav, port, indexed } = fixture();
  nav.visible(2);
  assert.equal(nav.next(port), 4);
  assert.equal(nav.next(port), 1);
  assert.equal(nav.next(port), 4);
  nav.manual();
  nav.visible(0);
  assert.equal(nav.next(port), 1);
  assert.ok(indexed.every((call) => call.animated));
});
test('unmeasured passage retry is bounded, respects reduced motion and cancels for manual scroll, newer requests or closure', (t) => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  const { nav, port, indexed, offsets } = fixture(true);
  nav.next(port);
  nav.failed({ index: 1, averageItemLength: 120 }, port);
  assert.deepEqual(offsets[0], { offset: 120, animated: false });
  t.mock.timers.tick(100);
  assert.equal(indexed.length, 2);
  nav.failed({ index: 1, averageItemLength: 120 }, port);
  nav.manual();
  t.mock.timers.tick(100);
  assert.equal(indexed.length, 2);
  nav.next(port);
  nav.failed({ index: 1, averageItemLength: 120 }, port);
  nav.next(port);
  t.mock.timers.tick(100);
  assert.equal(indexed.at(-1).index, 4);
  for (let i = 0; i < 12; i++) {
    nav.failed({ index: 4, averageItemLength: 100 }, port);
    t.mock.timers.tick(100);
  }
  assert.equal(offsets.filter((call) => call.offset === 400).length, 8);
  const count = indexed.length;
  nav.dispose();
  t.mock.timers.tick(100);
  assert.equal(nav.next(port), -1);
  assert.equal(indexed.length, count);
  nav.activate();
  assert.equal(nav.next(port), 1);
  assert.ok(indexed.every((call) => !call.animated));
});
