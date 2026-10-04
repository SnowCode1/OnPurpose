import assert from 'node:assert/strict';
import test from 'node:test';
import {
  moveHabit,
  fullHabitOrder,
  dragDestination,
} from '../src/habitOrdering.ts';
test('reorder moves only the intended ID, clamps ends, and retains archived slots', () => {
  const ids = ['a', 'b', 'c'];
  assert.deepEqual(moveHabit(ids, 'b', 9), ['a', 'c', 'b']);
  assert.deepEqual(moveHabit(ids, 'c', -2), ['c', 'a', 'b']);
  assert.deepEqual(ids, ['a', 'b', 'c']);
  const habits = [
    { id: 'a' },
    { id: 'archived', archived: true },
    { id: 'b' },
    { id: 'c' },
  ];
  assert.deepEqual(fullHabitOrder(habits, ['c', 'a', 'b']), [
    'c',
    'archived',
    'a',
    'b',
  ]);
  assert.throws(() => fullHabitOrder(habits, ['a', 'a', 'c']));
  assert.throws(() => fullHabitOrder(habits, ['a', 'b']));
});
test('drag placement uses measured row centres and does not move a stationary row', () => {
  const ids = ['a', 'b', 'c'],
    heights = { a: 52, b: 80, c: 52 };
  assert.equal(dragDestination(ids, heights, 52, 26), 0);
  assert.equal(dragDestination(ids, heights, 52, 92), 1);
  assert.equal(dragDestination(ids, heights, 52, 158), 2);
  assert.equal(dragDestination(ids, heights, 52, -20), 0);
  assert.equal(dragDestination(ids, heights, 52, 400), 2);
});
