import { scheduledCount, type GoalCycle } from './goalTiming.ts';
import type { EntryValues } from './entries.ts';
import type { Habit } from './habits.ts';
import {
  allWeekdays,
  defaultSuccessRule,
  evaluateGoal,
  type SuccessRule,
} from './habitGoals.ts';
const DAY = 86400000;
const ordinal = (date: string) => Date.parse(`${date}T00:00:00Z`) / DAY;
const dateKey = (day: number) => new Date(day * DAY).toISOString().slice(0, 10);
const weekday = (day: number) => (((day + 4) % 7) + 7) % 7;

// Count opportunities by policy intervals/weeks, never by allocating every day
// in an imported lifetime history. Recording totals/averages stay independent.
export function completionStatistics(
  habit: Habit,
  values: EntryValues,
  trackingStart: string,
  today: string,
  start: string,
) {
  const first = ordinal(trackingStart),
    end = ordinal(today);
  const policies: {
    from: number;
    to: number;
    rule: SuccessRule;
    weekdays: number[];
    cycle?: GoalCycle;
  }[] = [];
  const goals = habit.goals ?? [];
  policies.push({
    from: first,
    to: goals.length ? ordinal(goals[0].from) - 1 : end,
    rule: defaultSuccessRule(habit),
    weekdays: allWeekdays,
  });
  for (let i = 0; i < goals.length; i++)
    policies.push({
      from: Math.max(first, ordinal(goals[i].from)),
      to: i + 1 < goals.length ? ordinal(goals[i + 1].from) - 1 : end,
      rule: goals[i].rule,
      weekdays: goals[i].weekdays,
      cycle: goals[i].cycle,
    });
  function eligible(from: number, to: number, onlyWeekday?: number) {
    let count = 0;
    for (const policy of policies) {
      if (policy.rule.kind === 'none') continue;
      const a = Math.max(first, from, policy.from),
        b = Math.min(end, to, policy.to);
      if (b < a) continue;
      count += scheduledCount(policy, a, b, onlyWeekday);
    }
    return count;
  }
  const successes = Object.entries(values)
    .filter(([key]) => key.startsWith(`${habit.id}:`))
    .map(([key, value]) => ({ date: key.slice(habit.id.length + 1), value }))
    .filter(
      ({ date, value }) =>
        date >= trackingStart &&
        date <= today &&
        evaluateGoal(habit, value, date).scheduled &&
        evaluateGoal(habit, value, date).met,
    )
    .map((item) => ordinal(item.date))
    .sort((a, b) => a - b);
  let longest = 0,
    run = 0,
    previous = -Infinity;
  for (const day of successes) {
    run =
      previous !== -Infinity && eligible(previous + 1, day - 1) === 0
        ? run + 1
        : 1;
    longest = Math.max(longest, run);
    previous = day;
  }
  const last = successes.at(-1);
  const current =
    last === undefined || eligible(last + 1, end - (last === end ? 0 : 1)) > 0
      ? 0
      : run;
  const active = evaluateGoal(
    habit,
    values[`${habit.id}:${today}`],
    today,
  ).active;
  return {
    ...summarizeCompletion(
      {
        first,
        end,
        periods: policies,
        successDates: new Set(successes.map(dateKey)),
      },
      start,
      today,
    ),
    active,
    streak: current,
    bestStreak: longest,
    first,
    end,
    periods: policies,
    successDates: new Set(successes.map(dateKey)),
  };
}

export function summarizeCompletion(
  data: {
    first: number;
    end: number;
    periods: {
      from: number;
      to: number;
      rule: SuccessRule;
      weekdays: number[];
      cycle?: GoalCycle;
    }[];
    successDates: Set<string>;
  },
  from: string,
  to: string,
  onlyWeekday?: number,
) {
  const a = ordinal(from),
    b = ordinal(to);
  let days = 0;
  for (const policy of data.periods) {
    if (policy.rule.kind === 'none') continue;
    const lower = Math.max(data.first, a, policy.from),
      upper = Math.min(data.end, b, policy.to);
    if (upper < lower) continue;
    days += scheduledCount(policy, lower, upper, onlyWeekday);
  }
  let count = 0;
  for (const date of data.successDates) {
    const day = ordinal(date);
    if (
      day >= a &&
      day <= b &&
      (onlyWeekday === undefined || weekday(day) === onlyWeekday)
    )
      count++;
  }
  return { eligible: days, successes: count, rate: days ? count / days : null };
}
