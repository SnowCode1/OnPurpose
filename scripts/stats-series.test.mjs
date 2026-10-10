import assert from 'node:assert/strict';
import test from 'node:test';
import { createSampleStore } from '../src/dev/sampleData.ts';
import { evaluateGoal } from '../src/habitGoals.ts';
import {
  dayNumber,
  dateKey,
  habitStatistics,
  habitTrackingStart,
} from '../src/statistics.ts';
import { recordStatistics } from '../src/recordStatistics.ts';
import { periodStatistics } from '../src/periodStatistics.ts';
import {
  binSeries,
  habitSeries,
  niceMaximum,
  observations,
  statsWindow,
  streakValues,
  successMode,
  timeTicks,
  trendRates,
  weekStartOf,
} from '../src/statsSeries.ts';
import { categoryColours } from '../src/categoryColours.ts';
import { hexToOklch } from '../src/colors.ts';

const today = '2026-10-10';
async function sample() {
  const store = await createSampleStore(today);
  const { replay, events } = store.getSnapshot();
  return { habits: replay.state.habits, values: replay.state.values, events };
}
function history(habit, values, events) {
  const start = habitTrackingStart(habit, values, events, today);
  return {
    start,
    series: habitSeries(
      habit,
      values,
      start,
      today,
      dayNumber(start),
      dayNumber(today),
    ),
  };
}

test('series outcomes match evaluateGoal for every sample habit and day', async () => {
  const { habits, values, events } = await sample();
  for (const habit of habits) {
    const { series } = history(habit, values, events);
    for (const item of series) {
      const goal = evaluateGoal(habit, item.value, item.date);
      const expected = !goal.active
        ? 'track'
        : !goal.scheduled
          ? 'off'
          : goal.met
            ? 'met'
            : item.date === today
              ? 'open'
              : 'missed';
      assert.equal(item.outcome, expected, `${habit.id} ${item.date}`);
    }
  }
});

test('the streak line ends at the current streak and peaks at the longest', async () => {
  const { habits, values, events } = await sample();
  for (const habit of habits) {
    const { start, series } = history(habit, values, events);
    const mode = successMode(series);
    const obs = observations(habit, series, mode, today);
    const line = streakValues(habit, series, mode, obs, today);
    let current, longest;
    if (mode === 'period') {
      const periods = periodStatistics(habit, values, start, today, start);
      current = periods.streak;
      longest = periods.bestStreak;
    } else if (habit.type === 'categorical' || habit.type === 'text') {
      const stats = recordStatistics(habit, values, events, today, 'all');
      current = mode === 'goal' ? stats.completion.streak : stats.streak;
      longest =
        mode === 'goal' ? stats.completion.bestStreak : stats.bestStreak;
    } else {
      const stats = habitStatistics(habit, values, events, today, 'all');
      current = stats.streak;
      longest = stats.bestStreak;
    }
    assert.equal(line.at(-1), current, `${habit.id} current (${mode})`);
    assert.equal(Math.max(0, ...line), longest, `${habit.id} longest`);
  }
});

test('period observations agree with the period goal results', async () => {
  const { habits, values, events } = await sample();
  const periodic = habits.filter((habit) =>
    habit.goals?.some((goal) => goal.period),
  );
  assert.ok(periodic.length, 'the sample includes a period goal');
  for (const habit of periodic) {
    const { start, series } = history(habit, values, events);
    const obs = observations(habit, series, 'period', today).filter(
      (item) => item.period,
    );
    const periods = periodStatistics(habit, values, start, today, start);
    assert.equal(obs.length, periods.eligible, habit.id);
    assert.equal(obs.filter((item) => item.met).length, periods.met, habit.id);
  }
});

test('the weighted trend is unbiased, halves weights each half-life and holds over gaps', () => {
  const steady = Array.from({ length: 20 }, (_, day) => ({
    day,
    met: true,
    from: day,
    period: false,
  }));
  assert.deepEqual(new Set(trendRates(steady, 0, 19)), new Set([1]));
  // One miss now and one success a half-life earlier: weights 1 and 1/2.
  const rates = trendRates(
    [
      { day: 0, met: true, from: 0, period: false },
      { day: 14, met: false, from: 14, period: false },
    ],
    0,
    20,
  );
  assert.equal(rates[0], 1, 'the first observation is not pulled towards 0');
  assert.ok(Math.abs(rates[14] - 1 / 3) < 1e-9);
  assert.ok(Math.abs(rates[20] - 1 / 3) < 1e-9, 'no observations: unchanged');
  assert.deepEqual(trendRates([], 0, 2), [null, null, null]);
  assert.deepEqual(trendRates(steady, 0, 3, 14, 2.5).slice(0, 3), [
    null,
    null,
    1,
  ]);
});

test('bins partition the window with calendar-day averages and goal counts', async () => {
  const { habits, values, events } = await sample();
  const read = habits.find((habit) => habit.id === 'read');
  const { start, series } = history(read, values, events);
  const window = series.filter((item) => item.day >= dayNumber(today) - 89);
  const stats = habitStatistics(read, values, events, today, 90);
  for (const unit of ['day', 'week', 'month']) {
    const bins = binSeries(read, window, unit, 'monday');
    assert.equal(
      bins.reduce((sum, bin) => sum + bin.days.length, 0),
      window.length,
    );
    assert.equal(
      bins.reduce((sum, bin) => sum + bin.total, 0),
      stats.total,
      unit,
    );
    assert.equal(
      bins.reduce((sum, bin) => sum + bin.eligible, 0),
      stats.eligible,
    );
    assert.equal(
      bins.reduce((sum, bin) => sum + bin.met, 0),
      stats.completion.successes,
    );
  }
  const weeks = binSeries(read, window, 'week', 'sunday');
  for (const bin of weeks.slice(1))
    assert.equal(weekStartOf(bin.from, 'sunday'), bin.from);
  assert.ok(start <= today);
});

test('windows step back by whole ranges and stop at the start', () => {
  assert.deepEqual(statsWindow(30, 0, '2026-01-01', today), {
    from: dayNumber(today) - 29,
    to: dayNumber(today),
    shown: dayNumber(today) - 29,
    canGoBack: true,
    canGoForward: false,
  });
  assert.equal(
    statsWindow(365, 0, '2026-04-14', today).shown,
    dayNumber('2026-04-14'),
    'charts start at the habit start',
  );
  const back = statsWindow(30, 2, '2026-01-01', today);
  assert.equal(dateKey(back.to), '2026-08-11');
  assert.equal(back.canGoForward, true);
  assert.equal(statsWindow(30, 0, '2026-09-20', today).canGoBack, false);
  assert.equal(
    statsWindow('all', 0, '2026-09-20', today).from,
    dayNumber('2026-09-20'),
  );
});

test('axis helpers choose readable ticks and round maxima', () => {
  const to = dayNumber(today);
  const weeks = timeTicks(to - 29, to, 'monday');
  assert.ok(weeks.length >= 4 && weeks.every((tick) => tick.kind === 'week'));
  assert.ok(timeTicks(to - 364, to, 'monday').every((t) => t.kind === 'month'));
  assert.ok(timeTicks(to - 1500, to, 'monday').every((t) => t.kind === 'year'));
  assert.deepEqual(
    [0, 0.7, 1, 3, 23, 60, 61, 9].map(niceMaximum),
    [1, 0.8, 1, 3, 25, 60, 80, 10],
  );
});

test('category colours are stable, distinct and readable on black', () => {
  const habit = {
    id: 'workout',
    name: 'Workout',
    color: '#8BC86F',
    type: 'categorical',
    categories: ['run', 'strength', 'stretch', 'rest', 'swim'].map((id) => ({
      id,
      label: id,
    })),
  };
  const colours = categoryColours(habit);
  assert.equal(colours.size, 5);
  assert.equal(new Set(colours.values()).size, 5);
  for (const colour of colours.values()) {
    assert.match(colour, /^#[0-9A-F]{6}$/);
    assert.ok(hexToOklch(colour).l > 0.68);
  }
  const extended = categoryColours({
    ...habit,
    categories: [...habit.categories, { id: 'yoga', label: 'Yoga' }],
  });
  for (const [id, colour] of colours) assert.equal(extended.get(id), colour);
});
