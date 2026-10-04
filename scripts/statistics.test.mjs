import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { habitStatistics, monthDays } from '../src/statistics.ts';
import { replayEvents } from '../src/storage/model.ts';
const habit = { id: 'walk', name: 'Walk', color: '#82E6BC', type: 'checkbox' };
const number = { ...habit, type: 'number', unit: 'minutes' };
function seed(day = '2026-10-01', definition = habit) {
  return {
    version: 3,
    id: 'seed',
    sequence: 1,
    recordedAt: `${day}T12:00:00.000Z`,
    utcOffsetMinutes: 0,
    timeZone: 'UTC',
    type: 'initialize',
    habits: [definition],
  };
}
function definitionEvent(sequence, day, before, after, type = 'change') {
  return {
    version: 3,
    id: `event-${sequence}`,
    sequence,
    recordedAt: `${day}T12:00:00.000Z`,
    utcOffsetMinutes: 0,
    timeZone: 'UTC',
    type,
    ...(type === 'change'
      ? { groupId: `event-${sequence}` }
      : { targetId: `event-${sequence - 1}` }),
    change: { kind: 'habit', habitId: habit.id, index: 0, before, after },
  };
}
const stats = (
  values = {},
  events = [seed()],
  today = '2026-10-04',
  range = 30,
  definition = habit,
) => habitStatistics(definition, values, events, today, range);

test('rates start at creation, exclude unfinished today, and include a checked today', () => {
  const values = {
    'walk:2026-10-01': 1,
    'walk:2026-10-03': 1,
    'walk:2026-10-05': 1,
    'another:2026-10-02': 1,
  };
  const result = stats(values);
  assert.equal(result.eligible, 3);
  assert.equal(result.successes, 2);
  assert.equal(result.rate, 2 / 3);
  assert.equal(result.streak, 1);
  const checked = stats({ ...values, 'walk:2026-10-04': 1 });
  assert.equal(checked.eligible, 4);
  assert.equal(checked.rate, 3 / 4);
  assert.equal(checked.streak, 2);
  assert.equal(checked.bestStreak, 2);
  assert.equal(checked.allRecorded, 3);
});
test('new and empty habits have no fabricated completion rate', () => {
  const result = stats({}, [seed('2026-10-04')]);
  assert.equal(result.rate, null);
  assert.equal(result.eligible, 0);
  assert.equal(result.streak, 0);
  assert.equal(
    result.buckets.every((bucket) => bucket.value === null),
    true,
  );
  const older = stats();
  assert.equal(older.rate, 0);
  assert.equal(older.eligible, 3);
});
test('numeric zero is a record, missing days are not zero, and future totals are excluded', () => {
  const result = stats(
    {
      'walk:2026-10-01': 10,
      'walk:2026-10-03': 0,
      'walk:2026-10-04': 20,
      'walk:2026-10-05': 1000,
    },
    [seed('2026-10-01', number)],
    '2026-10-04',
    30,
    number,
  );
  assert.equal(result.total, 30);
  assert.equal(result.average, 10);
  assert.equal(result.best, 20);
  assert.equal(result.recorded, 3);
  assert.equal(result.streak, 2);
  assert.equal(
    result.buckets.find((bucket) => bucket.start === '2026-10-03').value,
    0,
  );
  assert.equal(
    result.buckets.find((bucket) => bucket.start === '2026-10-02').value,
    null,
  );
  assert.equal(result.weekday.find((day) => day.day === 6).value, 0);
});
test('archive pauses exclude missing days, preserve entries, and resume on restore', () => {
  const archived = { ...habit, archived: true };
  const events = [
    seed(),
    definitionEvent(2, '2026-10-03', habit, archived),
    definitionEvent(3, '2026-10-06', archived, habit),
  ];
  replayEvents(events);
  const result = stats(
    { 'walk:2026-10-01': 1, 'walk:2026-10-04': 1, 'walk:2026-10-06': 1 },
    events,
    '2026-10-08',
    'all',
  );
  assert.equal(result.eligible, 5); // Oct 1,2,6,7 + explicit Oct 4
  assert.equal(result.successes, 3);
  assert.equal(result.rate, 3 / 5);
  assert.equal(result.streak, 0);
  assert.equal(
    result.weekday.reduce((sum, day) => sum + day.eligible, 0),
    5,
  );
});
test('undo and redo lifecycle transitions use saved local dates and do not erase recorded days', () => {
  const archived = { ...habit, archived: true };
  const events = [
    seed(),
    definitionEvent(2, '2026-10-03', habit, archived),
    definitionEvent(3, '2026-10-04', archived, habit, 'undo'),
    definitionEvent(4, '2026-10-05', habit, archived, 'redo'),
  ];
  replayEvents(events);
  const result = stats(
    { 'walk:2026-10-03': 1 },
    events,
    '2026-10-08',
    'all',
    archived,
  );
  assert.equal(result.eligible, 4); // active 1,2,4 and explicit 3
  assert.equal(result.rate, 1 / 4);
});
test('backdated records extend tracking, and month/day calculations survive DST and leap years', () => {
  const event = {
    ...seed('2026-10-03'),
    recordedAt: '2026-10-03T14:00:00.000Z',
    utcOffsetMinutes: 660,
    timeZone: 'Australia/Melbourne',
  };
  assert.equal(stats({}, [event], '2026-10-05').eligible, 1); // local creation Oct 4
  const result = stats({ 'walk:2026-09-30': 1 }, [event], '2026-10-05', 'all');
  assert.equal(result.trackingStart, '2026-09-30');
  assert.equal(result.eligible, 5);
  assert.equal(monthDays('2024-02').days.length, 29);
  assert.equal(monthDays('2026-02').days.length, 28);
  assert.equal(monthDays('2026-10').padding, 3);
});
test('bucket and weekday totals partition the selected period and previous comparison is equal length', () => {
  const result = stats(
    { 'walk:2026-09-01': 1, 'walk:2026-09-06': 1, 'walk:2026-10-04': 1 },
    [seed('2026-08-01')],
    '2026-10-04',
    30,
  );
  assert.equal(result.start, '2026-09-05');
  assert.equal(result.successes, 2);
  assert.equal(result.eligible, 30);
  assert.equal(result.previous.successes, 1);
  assert.equal(result.previous.eligible, 30);
  assert.equal(
    result.buckets.reduce((sum, bucket) => sum + bucket.eligible, 0),
    30,
  );
  assert.equal(
    result.weekday.reduce((sum, day) => sum + day.eligible, 0),
    30,
  );
  const values = Object.fromEntries(
    Array.from({ length: 30 }, (_, i) => [
      `walk:2026-09-${String(i + 1).padStart(2, '0')}`,
      i,
    ]),
  );
  const numeric = stats(
    values,
    [seed('2026-08-01', number)],
    '2026-10-04',
    90,
    number,
  );
  assert.equal(
    numeric.buckets.reduce((sum, bucket) => sum + (bucket.value ?? 0), 0),
    numeric.total,
  );
});
test('clock rollback cannot create overlapping archive intervals', () => {
  const archived = { ...habit, archived: true };
  const events = [
    seed(),
    definitionEvent(2, '2026-10-05', habit, archived),
    definitionEvent(3, '2026-10-03', archived, habit),
  ];
  const result = stats({}, events, '2026-10-08', 'all');
  assert.equal(result.eligible, 7);
});
test('statistics can derive from unchanged v1/v2/v3 backup fixtures', () => {
  for (const version of [1, 2, 3]) {
    const archive = JSON.parse(
      readFileSync(
        new URL(`../docs/examples/storage-v${version}.json`, import.meta.url),
        'utf8',
      ),
    );
    const { events, replay } = replayEvents(archive.events);
    for (const definition of replay.state.habits) {
      const result = stats(
        replay.state.values,
        events,
        '2026-10-04',
        'all',
        definition,
      );
      assert.ok(result.rate === null || (result.rate >= 0 && result.rate <= 1));
      assert.ok(result.buckets.length > 0);
    }
  }
});
