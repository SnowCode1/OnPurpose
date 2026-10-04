import assert from 'node:assert/strict';
import test from 'node:test';
import {
  moveHabit,
  fullHabitOrder,
  dragDestination,
  habitRowPositions,
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

test('preview and committed layouts share exact ID positions across variable-height swaps', () => {
  const ids = ['short', 'tall', 'last'];
  const heights = { short: 52, tall: 96 };
  const original = habitRowPositions(ids, heights, 60);
  assert.deepEqual(original, {
    tops: { short: 0, tall: 52, last: 148 },
    total: 208,
  });
  const preview = moveHabit(ids, 'tall', 2);
  const positions = habitRowPositions(preview, heights, 60);
  assert.deepEqual(ids, ['short', 'tall', 'last']); // Render order stays unchanged during preview.
  assert.deepEqual(positions, {
    tops: { short: 0, last: 52, tall: 112 },
    total: 208,
  });
  assert.deepEqual(habitRowPositions([...preview], heights, 60), positions); // No rebase at drop.
  assert.deepEqual(
    habitRowPositions(moveHabit(preview, 'tall', 1), heights, 60),
    original,
  );
});

test('row positions preserve content height and leave no gaps for every drag destination', () => {
  const ids = ['a', 'b', 'c', 'd'];
  const heights = { a: 52, b: 87, c: 64, d: 120 };
  for (const id of ids)
    for (let target = 0; target < ids.length; target++) {
      const order = moveHabit(ids, id, target);
      const { tops, total } = habitRowPositions(order, heights, 52);
      assert.equal(total, 323);
      assert.equal(tops[order[0]], 0);
      order
        .slice(1)
        .forEach((next, index) =>
          assert.equal(tops[next], tops[order[index]] + heights[order[index]]),
        );
    }
  assert.deepEqual(habitRowPositions([], heights, 52), { tops: {}, total: 0 });
});
