import { isNumericHabit, type Habit } from './habits.ts';
import type { StoredEvent } from './storage/model.ts';

const DAY = 86400000;
export const dayNumber = (date: string) =>
  Math.floor(Date.parse(`${date}T00:00:00Z`) / DAY);
export const dateKey = (day: number) =>
  new Date(day * DAY).toISOString().slice(0, 10);
export type StatsRange = 30 | 90 | 365 | 'all';
export type StatsBucket = {
  start: string;
  end: string;
  value: number | null;
  recorded: number;
  eligible: number;
};
type Interval = { start: number; end: number };
function editDay(event: StoredEvent) {
  return Math.floor(
    (Date.parse(event.recordedAt) + event.utcOffsetMinutes * 60000) / DAY,
  );
}

// Archive periods follow the actual saved transitions, including Undo/Redo.
// Clock rollback cannot reorder lifecycle boundaries. Explicit dated entries
// remain evidence of tracking even if they predate creation or fall in a pause.
function lifecycle(
  habit: Habit,
  events: StoredEvent[],
  today: number,
  firstEntry: number,
) {
  let born: number | null = null,
    opened: number | null = null,
    last = -Infinity;
  const intervals: Interval[] = [];
  for (const event of events) {
    const definition =
      event.type === 'initialize'
        ? event.habits.find((item) => item.id === habit.id)
        : event.change.kind === 'habit' && event.change.habitId === habit.id
          ? event.change.after
          : undefined;
    if (definition === undefined) continue;
    const day = Math.max(last, editDay(event));
    last = day;
    if (born === null && definition) born = day;
    const active = definition !== null && !definition.archived;
    if (active && opened === null) opened = day;
    if (!active && opened !== null) {
      intervals.push({ start: opened, end: day - 1 });
      opened = null;
    }
  }
  if (opened !== null) intervals.push({ start: opened, end: today });
  const start = habit.startDate
    ? dayNumber(habit.startDate)
    : Math.min(born ?? today, firstEntry);
  if (start < (born ?? today))
    intervals.unshift({ start, end: (born ?? today) - 1 });
  return {
    start,
    intervals: intervals
      .map((interval) => ({
        ...interval,
        start: Math.max(start, interval.start),
      }))
      .filter((interval) => interval.start <= interval.end),
  };
}
// Legacy habits acquire a display default without rewriting their event log.
export function habitTrackingStart(
  habit: Habit,
  values: Record<string, number>,
  events: StoredEvent[],
  todayKey: string,
) {
  if (habit.startDate) return habit.startDate;
  const today = dayNumber(todayKey),
    prefix = `${habit.id}:`;
  let firstEntry = Infinity;
  for (const key of Object.keys(values)) {
    if (!key.startsWith(prefix)) continue;
    const day = dayNumber(key.slice(prefix.length));
    if (day <= today) firstEntry = Math.min(firstEntry, day);
  }
  return dateKey(
    Math.min(today, lifecycle(habit, events, today, firstEntry).start),
  );
}
function countWeekday(start: number, end: number, weekday?: number) {
  if (end < start) return 0;
  if (weekday === undefined) return end - start + 1;
  const first = start + ((weekday - ((((start + 4) % 7) + 7) % 7) + 7) % 7);
  return first > end ? 0 : Math.floor((end - first) / 7) + 1;
}
export function habitStatistics(
  habit: Habit,
  values: Record<string, number>,
  events: StoredEvent[],
  todayKey: string,
  range: StatsRange,
) {
  const today = dayNumber(todayKey),
    numeric = isNumericHabit(habit),
    prefix = `${habit.id}:`,
    explicitStart = habit.startDate ? dayNumber(habit.startDate) : -Infinity;
  const records = Object.entries(values)
    .filter(([key]) => key.startsWith(prefix))
    .map(([key, value]) => ({
      day: dayNumber(key.slice(prefix.length)),
      value,
    }))
    .filter((item) => item.day <= today && item.day >= explicitStart)
    .sort((a, b) => a.day - b.day);
  const { start: trackingStart, intervals } = lifecycle(
    habit,
    events,
    today,
    records[0]?.day ?? Infinity,
  );
  const start =
    range === 'all' ? Math.min(today, trackingStart) : today - range + 1;
  const active = (day: number) =>
    intervals.some((interval) => day >= interval.start && day <= interval.end);
  function summarize(from: number, to: number, weekday?: number) {
    const matching = records.filter(
      (item) =>
        item.day >= from &&
        item.day <= to &&
        (weekday === undefined ||
          new Date(item.day * DAY).getUTCDay() === weekday),
    );
    const pastEnd = Math.min(to, today - 1);
    let eligible = intervals.reduce(
      (sum, interval) =>
        sum +
        countWeekday(
          Math.max(from, interval.start),
          Math.min(pastEnd, interval.end),
          weekday,
        ),
      0,
    );
    eligible += matching.filter(
      (item) => item.day === today || !active(item.day),
    ).length;
    const successes = matching.filter((item) => item.value === 1).length;
    const total = matching.reduce((sum, item) => sum + item.value, 0);
    return {
      recorded: matching.length,
      eligible,
      successes,
      total,
      rate: eligible ? successes / eligible : null,
      average: matching.length ? total / matching.length : null,
      best: matching.length
        ? matching.reduce((best, item) => Math.max(best, item.value), 0)
        : null,
    };
  }
  const summary = summarize(start, today);
  const span = today - start + 1;
  const previous = summarize(start - span, start - 1);
  const bucketDays = numeric
    ? span <= 30
      ? 1
      : span <= 90
        ? 7
        : Math.ceil(span / 24)
    : span <= 90
      ? 7
      : Math.ceil(span / 24);
  const buckets: StatsBucket[] = [];
  for (let from = start; from <= today; from += bucketDays) {
    const to = Math.min(today, from + bucketDays - 1),
      part = summarize(from, to);
    buckets.push({
      start: dateKey(from),
      end: dateKey(to),
      value: numeric
        ? part.recorded
          ? part.total
          : null
        : part.rate === null
          ? null
          : part.rate * 100,
      recorded: part.recorded,
      eligible: part.eligible,
    });
  }
  const weekday = Array.from({ length: 7 }, (_, index) => {
    const day = (index + 1) % 7,
      part = summarize(start, today, day);
    return {
      day,
      value: numeric
        ? part.average
        : part.rate === null
          ? null
          : part.rate * 100,
      recorded: part.recorded,
      eligible: part.eligible,
    };
  });
  const completed = records.filter((item) => numeric || item.value === 1);
  let bestStreak = 0,
    run = 0,
    previousDay = -Infinity;
  for (const item of completed) {
    run = item.day === previousDay + 1 ? run + 1 : 1;
    bestStreak = Math.max(bestStreak, run);
    previousDay = item.day;
  }
  let streak = 0,
    expected = completed.at(-1)?.day === today ? today : today - 1;
  for (
    let index = completed.length - 1;
    index >= 0 && completed[index].day === expected;
    index--, expected--
  )
    streak++;
  return {
    numeric,
    start: dateKey(start),
    today: todayKey,
    trackingStart: dateKey(
      habit.startDate ? trackingStart : Math.min(today, trackingStart),
    ),
    ...summary,
    previous,
    buckets,
    bucketDays,
    weekday,
    streak,
    bestStreak,
    allRecorded: records.length,
    lastRecorded: records.length ? dateKey(records.at(-1)!.day) : null,
  };
}
export function monthDays(month: string) {
  const first = dayNumber(`${month}-01`),
    date = new Date(first * DAY);
  date.setUTCMonth(date.getUTCMonth() + 1);
  const count = Math.round(date.getTime() / DAY) - first;
  return {
    padding: (new Date(first * DAY).getUTCDay() + 6) % 7,
    days: Array.from({ length: count }, (_, index) => dateKey(first + index)),
  };
}
