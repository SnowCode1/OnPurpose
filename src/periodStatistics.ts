import type { Habit } from './habits.ts';
import type { EntryValues } from './entries.ts';
import { ruleIsMet } from './habitGoals.ts';
import {
  cycleLengths,
  ordinal,
  timingDate,
  scheduledCount,
  scheduledOn,
  periodWindow,
  periodMet,
  type GoalPeriod,
} from './goalTiming.ts';

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
export type PeriodResult = {
  id: string;
  start: string;
  end: string;
  count: number;
  period: GoalPeriod;
  status: 'met' | 'missed' | 'progress' | 'rest' | 'partial';
};
// Only changed counts need individual evaluation. Empty windows share the same
// result; cycle/weekday eligibility repeats, so enormous histories stay bounded.
export function periodStatistics(
  habit: Habit,
  values: EntryValues,
  trackingStart: string,
  today: string,
  rangeStart: string,
) {
  const first = ordinal(trackingStart),
    now = ordinal(today),
    range = ordinal(rangeStart);
  const records = Object.entries(values)
    .filter(([key]) => key.startsWith(`${habit.id}:`))
    .map(([key, value]) => ({
      day: ordinal(key.slice(habit.id.length + 1)),
      value,
    }));
  let eligible = 0,
    met = 0,
    streak = 0,
    bestStreak = 0;
  const recent: PeriodResult[] = [];
  let current: PeriodResult | null = null;
  const goals = habit.goals ?? [];
  for (let g = 0; g < goals.length; g++) {
    const goal = goals[g],
      period = goal.period;
    if (goal.from > today) break;
    if (!period || goal.rule.kind === 'none') {
      streak = 0;
      continue;
    }
    const start = Math.max(first, ordinal(goal.from));
    const stop = Math.min(
      now,
      g + 1 < goals.length ? ordinal(goals[g + 1].from) - 1 : now,
    );
    if (stop < start) continue;
    const anchor = ordinal(period.anchor),
      length = period.days;
    const initial = Math.ceil((start - anchor) / length);
    const last = Math.floor((stop - anchor + 1) / length) - 1;
    // Today is still open, including its last day. Policy-truncated periods
    // never become failures and do not silently prorate their target.
    const final = Math.min(last, Math.floor((now - anchor) / length) - 1);
    const counts = new Map<number, number>();
    for (const { day, value } of records) {
      if (
        day < start ||
        day > stop ||
        !scheduledOn(goal, day) ||
        !ruleIsMet(goal.rule, value)
      )
        continue;
      const index = Math.floor((day - anchor) / length);
      counts.set(index, (counts.get(index) ?? 0) + 1);
    }
    const phaseDays = goal.cycle ? cycleLengths(goal.cycle).total * 7 : 7;
    const repeat = phaseDays / gcd(phaseDays, length);
    const prefix = [0];
    for (let i = 0; i < repeat; i++) {
      const a = anchor + i * length;
      prefix.push(
        prefix[i] + Number(scheduledCount(goal, a, a + length - 1) > 0),
      );
    }
    const before = (index: number) => {
      const whole = Math.floor(index / repeat),
        rest = ((index % repeat) + repeat) % repeat;
      return whole * prefix[repeat] + prefix[rest];
    };
    const opportunities = (a: number, b: number) =>
      b < a ? 0 : before(b + 1) - before(a);
    const active = (index: number) => opportunities(index, index) > 0;
    const zeroMet = periodMet(period, 0);
    const rangeFirst = Math.max(initial, Math.ceil((range - anchor) / length));
    eligible += opportunities(rangeFirst, final);
    if (zeroMet) met += opportunities(rangeFirst, final);
    for (const [index, count] of counts)
      if (index >= rangeFirst && index <= final && active(index))
        met += Number(periodMet(period, count)) - Number(zeroMet);
    let cursor = initial;
    const applyRun = (success: boolean, amount: number) => {
      if (!amount) return;
      streak = success ? streak + amount : 0;
      bestStreak = Math.max(bestStreak, streak);
    };
    for (const [index, count] of [...counts].sort((a, b) => a[0] - b[0])) {
      if (index < initial || index > final) continue;
      applyRun(zeroMet, opportunities(cursor, index - 1));
      applyRun(periodMet(period, count), Number(active(index)));
      cursor = index + 1;
    }
    applyRun(zeroMet, opportunities(cursor, final));
    const result = (index: number): PeriodResult => {
      const a = anchor + index * length,
        b = a + length - 1,
        count = counts.get(index) ?? 0;
      const partial = a < start || (b > stop && stop < now);
      const rest =
        scheduledCount(
          goal,
          Math.max(a, start),
          Math.min(b, goals[g + 1] ? ordinal(goals[g + 1].from) - 1 : b),
        ) === 0;
      return {
        id: `${goal.id}:${index}`,
        start: timingDate(Math.max(a, start)),
        end: timingDate(
          Math.min(b, goals[g + 1] ? ordinal(goals[g + 1].from) - 1 : b),
        ),
        count,
        period,
        status: rest
          ? 'rest'
          : partial
            ? 'partial'
            : b >= now
              ? 'progress'
              : periodMet(period, count)
                ? 'met'
                : 'missed',
      };
    };
    const lastVisible = Math.floor((stop - anchor) / length);
    // At most eight rows per policy; retain only the eight most recent overall.
    for (
      let i = Math.max(Math.floor((start - anchor) / length), lastVisible - 7);
      i <= lastVisible;
      i++
    ) {
      const row = result(i);
      if (ordinal(row.end) >= range) recent.push(row);
      if (
        start <= now &&
        stop === now &&
        periodWindow(period, today).index === i
      )
        current = row;
    }
  }
  return {
    eligible,
    met,
    streak,
    bestStreak,
    current,
    recent: recent.sort((a, b) => b.start.localeCompare(a.start)).slice(0, 8),
  };
}
