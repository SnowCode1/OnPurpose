import assert from 'node:assert/strict';
import test from 'node:test';
import {
  settledDay,
  shouldRevealFuture,
  FUTURE_PULL_DISTANCE,
} from '../src/gridNavigation.ts';

test('future gate requires releasing beyond the resisted pull distance', () => {
  for (const offset of [100, 0, -1, -30, -FUTURE_PULL_DISTANCE + 1])
    assert.equal(shouldRevealFuture(offset), false);
  assert.equal(shouldRevealFuture(-FUTURE_PULL_DISTANCE), true);
  assert.equal(shouldRevealFuture(-100), true);
});

test('scroll offsets identify the same local day across column widths and future batches', () => {
  assert.equal(settledDay(0, 55, 90, 0, 4), 0);
  assert.equal(settledDay(-40, 55, 90, 0, 4), 0);
  assert.equal(settledDay(55 * 12, 55, 90, 0, 4), 12);
  assert.equal(settledDay(52 * 12, 52, 90, 0, 10), 12);
  assert.equal(settledDay(55 * 30, 55, 90, 30, 4), 0);
  assert.equal(settledDay(55 * 29, 55, 90, 30, 4), -1);
  assert.equal(settledDay(52 * 59, 52, 90, 60, 10), -1);
  assert.equal(settledDay(100000, 55, 90, 30, 4), 86);
});
