// Day-by-day statistics series shared by the charts and calendar. Pure and
// derived: nothing here is stored. Days are UTC day numbers from statistics.ts.
import type { EntryValue, EntryValues } from './entries.ts';
import { habitType, type Habit } from './habits.ts';
import {
  allWeekdays,
  defaultSuccessRule,
  ruleIsMet,
  type HabitGoal,
} from './habitGoals.ts';
import { periodMet, scheduledOn } from './goalTiming.ts';
import type { WeekStart } from './displayPreferences.ts';
import { dateKey, dayNumber, type StatsRange } from './statistics.ts';

const modulo = (a: number, b: number) => ((a % b) + b) % b;
/** 0 = Sunday, matching Date#getUTCDay. */
export const weekdayOf = (day: number) => modulo(day + 4, 7);
export const weekStartOf = (day: number, start: WeekStart) =>
  day - modulo(weekdayOf(day) - (start === 'monday' ? 1 : 0), 7);

/**
 * met / missed: a scheduled goal day. open: today, scheduled and not yet met
 * (it still has until midnight). off: not scheduled or a rest day. track: no
 * goal applies. outside: before the habit's start. future: after today.
 */
export type Outcome =
  'met' | 'missed' | 'open' | 'off' | 'track' | 'outside' | 'future';
export type SeriesDay = {
  day: number;
  date: string;
  value: EntryValue | undefined;
  outcome: Outcome;
  goal: HabitGoal | null;
};

/** A completed or recorded entry: checkbox Off (0) is an explicit "not done". */
export function isRecorded(habit: Habit, value: EntryValue | null | undefined) {
  if (value === null || value === undefined) return false;
  return habitType(habit) !== 'checkbox' || value === 1;
}

// Walks the goal timeline in date order. Equivalent to evaluateGoal for each
// day, without filling its bounded per-date cache with a long history.
function dayEvaluator(habit: Habit) {
  const goals = habit.goals ?? [],
    checkbox = habitType(habit) === 'checkbox',
    fallback = defaultSuccessRule(habit);
  let index = -1;
  return (day: number, date: string, value: EntryValue | undefined) => {
    while (index + 1 < goals.length && goals[index + 1].from <= date) index++;
    const goal = index >= 0 ? goals[index] : null,
      rule = goal?.rule ?? fallback,
      active = rule.kind !== 'none',
      withinStart = !habit.startDate || date >= habit.startDate,
      defaultChecked = withinStart && (goal?.defaultChecked ?? false);
    return {
      goal,
      active,
      scheduled:
        withinStart &&
        active &&
        scheduledOn(goal ?? { weekdays: allWeekdays }, day),
      met:
        withinStart &&
        ruleIsMet(
          rule,
          checkbox
            ? Number(value === 1 || value === 0 ? value === 1 : defaultChecked)
            : value,
        ),
    };
  };
}

/** Outcomes for every day from `from` to `to` (inclusive, ascending). */
export function habitSeries(
  habit: Habit,
  values: EntryValues,
  trackingStart: string,
  today: string,
  from: number,
  to: number,
): SeriesDay[] {
  const evaluate = dayEvaluator(habit),
    first = dayNumber(trackingStart),
    now = dayNumber(today),
    days: SeriesDay[] = [];
  for (let day = from; day <= to; day++) {
    const date = dateKey(day),
      value = values[`${habit.id}:${date}`];
    if (day > now) {
      days.push({ day, date, value, outcome: 'future', goal: null });
      continue;
    }
    const result = evaluate(day, date, value);
    days.push({
      day,
      date,
      value,
      goal: result.goal,
      outcome:
        day < first
          ? 'outside'
          : !result.active
            ? 'track'
            : !result.scheduled
              ? 'off'
              : result.met
                ? 'met'
                : day === now
                  ? 'open'
                  : 'missed',
    });
  }
  return days;
}

/**
 * The selected range as a window ending today, stepped back by `offset`.
 * `shown` starts at the habit's start when the window reaches further back,
 * so charts and the calendar never open with an empty stretch.
 */
export function statsWindow(
  range: StatsRange,
  offset: number,
  trackingStart: string,
  today: string,
) {
  const now = dayNumber(today),
    first = Math.min(now, dayNumber(trackingStart));
  if (range === 'all')
    return {
      from: first,
      to: now,
      shown: first,
      canGoBack: false,
      canGoForward: false,
    };
  const to = now - offset * range,
    from = to - range + 1;
  return {
    from,
    to,
    shown: Math.min(to, Math.max(from, first)),
    canGoBack: from > first,
    canGoForward: offset > 0,
  };
}

export type BinUnit = 'day' | 'week' | 'month';
/** Bars stay daily up to ~three months, then weekly for a year, then monthly. */
export const valueUnit = (span: number): BinUnit =>
  span <= 100 ? 'day' : span <= 400 ? 'week' : 'month';
export const successUnit = (span: number): BinUnit =>
  span <= 400 ? 'week' : 'month';

export type SeriesBin = {
  from: number;
  to: number;
  /** Calendar days from the habit's start through today. */
  eligible: number;
  recorded: number;
  total: number;
  best: number | null;
  /** Scheduled goal days, including an unfinished today. */
  scheduled: number;
  met: number;
  days: SeriesDay[];
};

export function binKey(day: number, unit: BinUnit, weekStart: WeekStart) {
  return unit === 'day'
    ? day
    : unit === 'week'
      ? weekStartOf(day, weekStart)
      : dayNumber(`${dateKey(day).slice(0, 7)}-01`);
}

export function binSeries(
  habit: Habit,
  series: SeriesDay[],
  unit: BinUnit,
  weekStart: WeekStart,
): SeriesBin[] {
  const bins: SeriesBin[] = [];
  let current: SeriesBin | null = null,
    currentKey = NaN;
  for (const item of series) {
    const key = binKey(item.day, unit, weekStart);
    if (!current || key !== currentKey) {
      current = {
        from: item.day,
        to: item.day,
        eligible: 0,
        recorded: 0,
        total: 0,
        best: null,
        scheduled: 0,
        met: 0,
        days: [],
      };
      currentKey = key;
      bins.push(current);
    }
    current.to = item.day;
    current.days.push(item);
    if (item.outcome === 'future' || item.outcome === 'outside') continue;
    current.eligible++;
    if (isRecorded(habit, item.value)) {
      current.recorded++;
      if (typeof item.value === 'number') {
        current.total += item.value;
        current.best = Math.max(current.best ?? item.value, item.value);
      }
    }
    if (item.outcome === 'met') current.met++;
    if (
      item.outcome === 'met' ||
      item.outcome === 'missed' ||
      item.outcome === 'open'
    )
      current.scheduled++;
  }
  return bins;
}

export type SuccessMode = 'goal' | 'period' | 'recording';
/** What "success" means today: a daily goal, a period quota, or recording. */
export function successMode(series: SeriesDay[]): SuccessMode {
  const last = series.at(-1);
  if (!last || last.outcome === 'track' || last.outcome === 'outside')
    return 'recording';
  return last.goal?.period ? 'period' : 'goal';
}

/** `from` is the first day an observation covers (a period's start). */
export type Observation = {
  day: number;
  met: boolean;
  from: number;
  period: boolean;
};

/**
 * Success observations from the habit's whole history (start through today).
 * Goal mode: each finished scheduled day, plus each finished, whole period of
 * a period goal (rest and policy-truncated periods are neutral). Recording
 * mode: every calendar day. Today only counts once it succeeds.
 */
export function observations(
  habit: Habit,
  series: SeriesDay[],
  mode: SuccessMode,
  today: string,
): Observation[] {
  const now = dayNumber(today),
    result: Observation[] = [];
  if (mode === 'recording') {
    for (const item of series) {
      if (item.outcome === 'future' || item.outcome === 'outside') continue;
      const met = isRecorded(habit, item.value);
      if (item.day < now || met)
        result.push({ day: item.day, met, from: item.day, period: false });
    }
    return result;
  }
  const goals = habit.goals ?? [];
  const periods = new Map<
    string,
    {
      goal: HabitGoal;
      from: number;
      to: number;
      scheduled: number;
      met: number;
      whole: boolean;
    }
  >();
  for (const item of series) {
    if (item.outcome === 'future' || item.outcome === 'outside') continue;
    const period = item.goal?.period;
    if (!period) {
      if (item.outcome === 'met' || item.outcome === 'missed')
        result.push({
          day: item.day,
          met: item.outcome === 'met',
          from: item.day,
          period: false,
        });
      continue;
    }
    const goal = item.goal!,
      anchor = dayNumber(period.anchor),
      index = Math.floor((item.day - anchor) / period.days),
      key = `${goal.id}:${index}`;
    let window = periods.get(key);
    if (!window) {
      const from = anchor + index * period.days,
        to = from + period.days - 1,
        next = goals[goals.indexOf(goal) + 1];
      // Periods cut short by the start, a goal change, or today are not judged.
      window = {
        goal,
        from,
        to,
        scheduled: 0,
        met: 0,
        whole:
          from >= Math.max(series[0].day, dayNumber(goal.from)) &&
          (!next || to < dayNumber(next.from)) &&
          to < now,
      };
      periods.set(key, window);
    }
    if (item.outcome === 'met') window.met++;
    if (item.outcome === 'met' || item.outcome === 'missed') window.scheduled++;
  }
  for (const window of periods.values()) {
    if (!window.whole || !window.scheduled) continue;
    result.push({
      day: window.to,
      met: periodMet(window.goal.period!, window.met),
      from: window.from,
      period: true,
    });
  }
  return result.sort((a, b) => a.day - b.day);
}

export const TREND_HALF_LIFE_DAYS = 14;
/** About three recent observations before the trend is worth drawing. */
export const TREND_MINIMUM_WEIGHT = 2.5;

/**
 * A weighted success rate for each day from `from` to `to`: every earlier
 * observation counts, and its weight halves for every half-life of calendar
 * days back. Normalising by total weight keeps early values unbiased.
 */
export function trendRates(
  obs: Observation[],
  from: number,
  to: number,
  halfLife = TREND_HALF_LIFE_DAYS,
  minimumWeight = 0,
): (number | null)[] {
  const decay = 0.5 ** (1 / halfLife),
    rates: (number | null)[] = [];
  let sum = 0,
    weight = 0,
    index = 0,
    day = obs.length ? Math.min(obs[0].day, from) : from;
  for (; day <= to; day++) {
    sum *= decay;
    weight *= decay;
    for (; index < obs.length && obs[index].day === day; index++) {
      sum += Number(obs[index].met);
      weight += 1;
    }
    if (day >= from)
      rates.push(
        weight > 1e-9 && weight >= minimumWeight ? sum / weight : null,
      );
  }
  return rates;
}

/**
 * The streak each day ends with. Goal: consecutive successful scheduled days;
 * off days, rest periods and no-goal days hold it. Period: consecutive met
 * periods. Recording: consecutive calendar days with an entry. An unfinished
 * today holds yesterday's value.
 */
export function streakValues(
  habit: Habit,
  series: SeriesDay[],
  mode: SuccessMode,
  obs: Observation[],
  today: string,
): number[] {
  const now = dayNumber(today),
    values: number[] = [];
  let streak = 0,
    next = 0;
  for (const item of series) {
    if (item.outcome === 'outside') streak = 0;
    else if (item.outcome !== 'future') {
      if (mode === 'recording') {
        if (isRecorded(habit, item.value)) streak++;
        else if (item.day < now) streak = 0;
      } else if (mode === 'goal') {
        if (item.outcome === 'met') streak++;
        else if (item.outcome === 'missed') streak = 0;
      } else {
        // Period streaks count whole periods and only continue through
        // period goals; rest and partial periods hold them.
        if (!item.goal?.period) streak = 0;
        for (; next < obs.length && obs[next].day <= item.day; next++)
          if (obs[next].period) streak = obs[next].met ? streak + 1 : 0;
      }
    }
    values.push(streak);
  }
  return values;
}

/** Ticks for a time axis: weeks, months or years depending on the span. */
export function timeTicks(
  from: number,
  to: number,
  weekStart: WeekStart,
): { day: number; kind: 'week' | 'month' | 'year' }[] {
  const span = to - from + 1,
    ticks: { day: number; kind: 'week' | 'month' | 'year' }[] = [];
  for (let day = from; day <= to; day++) {
    const date = dateKey(day);
    if (span <= 45) {
      if (weekdayOf(day) === (weekStart === 'monday' ? 1 : 0))
        ticks.push({ day, kind: 'week' });
    } else if (span <= 400) {
      if (date.endsWith('-01') && (span <= 120 || Number(date.slice(5, 7)) % 2))
        ticks.push({ day, kind: 'month' });
    } else if (date.endsWith('-01-01')) ticks.push({ day, kind: 'year' });
  }
  return ticks;
}

const NICE_STEPS = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
/** A rounded axis maximum close above the value, so bars use the height. */
export function niceMaximum(value: number) {
  if (!(value > 0)) return 1;
  const power = 10 ** Math.floor(Math.log10(value)),
    fraction = value / power;
  return NICE_STEPS.find((step) => fraction <= step + 1e-9)! * power;
}
