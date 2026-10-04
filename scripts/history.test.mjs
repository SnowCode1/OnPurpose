import assert from 'node:assert/strict';
import test from 'node:test';
import {
  historySections,
  historyPresentation,
  historyDayLabel,
} from '../src/history.ts';

process.env.TZ = 'Australia/Melbourne';
const state = {
  habits: [
    { id: 'walk', name: 'Walk', color: '#82E6BC' },
    { id: 'read', name: 'Read', color: '#BDA5FF', unit: 'minutes' },
  ],
  values: {},
  hapticsEnabled: true,
};
function action(
  sequence,
  recordedAt,
  change = {
    kind: 'entry',
    habitId: 'walk',
    date: '2026-10-04',
    before: null,
    after: 1,
  },
) {
  return {
    version: 2,
    id: `e${sequence}`,
    sequence,
    recordedAt,
    timeZone: 'Australia/Melbourne',
    utcOffsetMinutes: 660,
    type: 'change',
    change,
    firstRecordedAt: recordedAt,
    firstSequence: sequence,
    editCount: 1,
    lastChangedSequence: sequence,
  };
}

test('history groups active actions by local edit day, retaining newest-first sequence', () => {
  const events = [
    action(2, '2026-10-03T13:59:59.000Z'),
    action(3, '2026-10-03T14:00:00.000Z'),
    action(4, '2026-10-03T16:00:00.000Z'),
  ];
  const sections = historySections(events, 100);
  assert.deepEqual(
    sections.map((section) => section.date),
    ['2026-10-04', '2026-10-03'],
  );
  assert.deepEqual(
    sections.map((section) => section.data.map((event) => event.id)),
    [['e4', 'e3'], ['e2']],
  );
});

test('history paging extends the same day without missing records or changing section keys', () => {
  const events = [
    ...Array.from({ length: 105 }, (_, index) =>
      action(index + 2, '2026-10-04T05:30:00.000Z'),
    ),
  ];
  const first = historySections(events, 100);
  const all = historySections(events, 200);
  assert.equal(first[0].data.length, 100);
  assert.equal(all[0].data.length, 105);
  assert.equal(first[0].key, all[0].key);
  assert.deepEqual(first[0].data, all[0].data.slice(0, 100));
  assert.equal(historySections([], 100).length, 0);
});

test('a backward clock adjustment keeps the log order instead of moving edits between day buckets', () => {
  const events = [
    action(2, '2026-10-03T15:00:00.000Z'),
    action(3, '2026-10-02T15:00:00.000Z'),
    action(4, '2026-10-03T16:00:00.000Z'),
  ];
  const sections = historySections(events, 100);
  assert.deepEqual(
    sections.map((section) => section.date),
    ['2026-10-04', '2026-10-03', '2026-10-04'],
  );
  assert.deepEqual(
    sections.flatMap((section) => section.data.map((event) => event.id)),
    ['e4', 'e3', 'e2'],
  );
  assert.equal(new Set(sections.map((section) => section.key)).size, 3);
});

test('grouping follows the viewer timezone consistently through daylight saving and travel', () => {
  const events = [
    action(2, '2026-10-04T12:59:59.000Z'),
    action(3, '2026-10-04T13:00:00.000Z'),
  ];
  assert.deepEqual(
    historySections(events, 100).map((section) => section.date),
    ['2026-10-05', '2026-10-04'],
  );
  const saved = process.env.TZ;
  try {
    process.env.TZ = 'America/New_York';
    assert.deepEqual(
      historySections(events, 100).map((section) => section.date),
      ['2026-10-04'],
    );
  } finally {
    process.env.TZ = saved;
  }
});

test('a habit date is shown only when it differs from the displayed edit day', () => {
  const sameDay = action(2, '2026-10-03T14:01:00.000Z');
  assert.equal(historyPresentation(sameDay, state).effectiveDate, null);
  const backdated = {
    ...sameDay,
    change: { ...sameDay.change, date: '2026-10-02' },
  };
  const future = {
    ...sameDay,
    change: { ...sameDay.change, date: '2026-10-05' },
  };
  assert.equal(
    historyPresentation(backdated, state).effectiveDate,
    '2026-10-02',
  );
  assert.equal(historyPresentation(future, state).effectiveDate, '2026-10-05');
  assert.equal(historySections([future], 100)[0].date, '2026-10-04');
});

test('numeric descriptions preserve zero, correction direction, units and clearing', () => {
  const row = (change) =>
    historyPresentation(
      action(2, '2026-10-04T05:00:00.000Z', {
        kind: 'entry',
        habitId: 'read',
        date: '2026-10-04',
        ...change,
      }),
      state,
    );
  assert.equal(row({ before: null, after: 0 }).summary, '— → 0 minutes');
  assert.equal(row({ before: 0, after: 30 }).summary, '0 → 30 minutes');
  assert.equal(
    row({ before: 30, after: null }).summary,
    '30 minutes → Cleared',
  );
  assert.equal(row({ before: 30, after: null }).icon, 'erase');
});

test('colour actions remain explicit, and yesterday handles year/DST boundaries', () => {
  assert.equal(
    historyPresentation(
      action(2, '2026-10-04T05:00:00.000Z', {
        kind: 'colour',
        habitId: 'walk',
        before: '#82E6BC',
        after: '#FFFFFF',
      }),
      state,
    ).icon,
    'palette',
  );
  assert.match(historyDayLabel('2026-10-04', '2026-10-05'), /^Yesterday/);
  assert.match(historyDayLabel('2026-10-04', '2026-10-04'), /^Today/);
});
