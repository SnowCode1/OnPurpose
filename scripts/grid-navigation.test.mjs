import assert from 'node:assert/strict';
import test from 'node:test';
import {
  settledDay,
  shouldRevealFuture,
  FUTURE_PULL_DISTANCE,
  FUTURE_BATCH,
  futureRevealDay,
} from '../src/gridNavigation.ts';

test('future gate requires releasing beyond the resisted pull distance', () => {
  for (const offset of [100, 0, -1, -30, -FUTURE_PULL_DISTANCE + 1])
    assert.equal(shouldRevealFuture(offset), false);
  assert.equal(shouldRevealFuture(-FUTURE_PULL_DISTANCE), true);
  assert.equal(shouldRevealFuture(-100), true);
});

test('future reveal continues the pull distance instead of skipping a screen', () => {
  for (const columnWidth of [48, 55, 80, 120]) {
    const day = futureRevealDay(-FUTURE_PULL_DISTANCE, columnWidth, 0);
    assert.equal(day, -1);
    for (const visibleDays of [3, 4, 10]) {
      const offset = (FUTURE_BATCH + day) * columnWidth;
      assert.equal(
        settledDay(offset, columnWidth, 90, FUTURE_BATCH, visibleDays),
        -1,
      );
      // Today is exactly one column from tomorrow, regardless of viewport size.
      assert.equal(FUTURE_BATCH * columnWidth - offset, columnWidth);
    }
  }
  assert.equal(futureRevealDay(-140, 55, 0), -3);
  assert.equal(futureRevealDay(-64, 55, 30), -31);
  assert.equal(futureRevealDay(-10000, 55, 30), -60);
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
