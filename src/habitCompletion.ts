import { isNumericHabit, type Habit } from './habits.ts';
// One place for completion conditions. Checkbox checks are defined today;
// numeric totals are records, not completion, until per-habit rules are designed.
export function habitIsComplete(habit: Habit, value: number | undefined) {
  return !isNumericHabit(habit) && value === 1;
}
export function completionMask(
  habits: readonly Habit[],
  values: Readonly<Record<string, number>>,
  day: string,
) {
  return habits
    .map((habit) =>
      habitIsComplete(habit, values[`${habit.id}:${day}`]) ? '1' : '0',
    )
    .join('');
}
export function visibleHabitRows(
  habits: Habit[],
  mask: string,
  hideCompleted: boolean,
  showingCompleted: boolean,
  rightmostDay: number,
) {
  return !hideCompleted || showingCompleted || rightmostDay !== 0
    ? habits
    : habits.filter((_, index) => mask[index] !== '1');
}
