import test from 'node:test';
import assert from 'node:assert/strict';
import { gridRowHeight, isRowSpacing } from '../src/rowSpacing.ts';
import {
  shouldDismissStats,
  STATS_DISMISS_DISTANCE,
} from '../src/statsDismissal.ts';

test('row spacing retains touch targets and expands for larger text', () => {
  assert.deepEqual(
    ['compact', 'standard', 'roomy'].map((value) => gridRowHeight(value, 1)),
    [44, 52, 64],
  );
  for (const value of ['compact', 'standard', 'roomy']) {
    assert.ok(gridRowHeight(value, 0.8) >= 44);
    assert.ok(gridRowHeight(value, 2) > gridRowHeight(value, 1));
    assert.ok(isRowSpacing(value));
  }
  for (const value of [null, 52, '', 'tiny'])
    assert.equal(isRowSpacing(value), false);
});
test('statistics dismissal requires a deliberate pull starting at the top', () => {
  assert.equal(shouldDismissStats(true, -STATS_DISMISS_DISTANCE, 0), true);
  assert.equal(shouldDismissStats(true, -100, -1), true);
  assert.equal(shouldDismissStats(true, -75, -3), false);
  assert.equal(shouldDismissStats(false, -150, -3), false);
  assert.equal(shouldDismissStats(true, -100, 1), false);
  assert.equal(shouldDismissStats(true, 0, 0), false);
});
