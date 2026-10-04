import { localDateKey } from './calendar.ts';
import { isNumericHabit } from './habits.ts';
import type { HistoryAction, StoredState } from './storage/model.ts';
import type { IconName } from './Icon.tsx';

export type HistorySection = {
  key: string;
  date: string;
  data: HistoryAction[];
};

// Keep the log's newest-first sequence, including when the device clock changes.
// A date may have another section if it recurs after a clock/time-zone adjustment.
export function historySections(
  actions: HistoryAction[],
  limit: number,
): HistorySection[] {
  const sections: HistorySection[] = [];
  let count = 0;
  for (let index = actions.length - 1; index >= 0 && count < limit; index--) {
    const event = actions[index];
    const date = localDateKey(new Date(event.recordedAt));
    let section = sections.at(-1);
    if (!section || section.date !== date) {
      section = { key: `${date}:${event.id}`, date, data: [] };
      sections.push(section);
    }
    section.data.push(event);
    count++;
  }
  return sections;
}

export function historyDayLabel(date: string, today: string): string {
  const day = new Date(`${date}T12:00:00`);
  const yesterday = new Date(`${today}T12:00:00`);
  yesterday.setDate(yesterday.getDate() - 1);
  const fullDate = day.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    ...(date.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}),
  });
  if (date === today) return `Today · ${fullDate}`;
  if (date === localDateKey(yesterday)) return `Yesterday · ${fullDate}`;
  return day.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...(date.slice(0, 4) !== today.slice(0, 4) ? { year: 'numeric' } : {}),
  });
}

export function historyPresentation(event: HistoryAction, state: StoredState) {
  const change = event.change;
  if (change.kind === 'order')
    return {
      title: 'Habit order',
      summary: 'Rearranged habits',
      icon: 'reorder' as const,
      color: '#ACB8C5',
      effectiveDate: null,
    };
  if (change.kind === 'habit') {
    const habit = change.after ?? change.before!;
    const summary = !change.before
      ? 'Habit added'
      : !change.after
        ? 'Habit removed'
        : change.before.archived !== change.after.archived
          ? change.after.archived
            ? 'Archived'
            : 'Restored'
          : change.before.icon !== change.after.icon &&
              change.before.name === change.after.name &&
              change.before.color === change.after.color &&
              change.before.unit === change.after.unit &&
              change.before.startDate === change.after.startDate &&
              isNumericHabit(change.before) === isNumericHabit(change.after)
            ? change.after.icon
              ? 'Icon changed'
              : 'Icon removed'
            : 'Habit edited';
    return {
      title: habit.name,
      summary,
      icon: (summary === 'Archived' ? 'archive' : 'edit') as IconName,
      color: habit.color,
      effectiveDate: null,
    };
  }
  const habit = state.habits.find((habit) => habit.id === change.habitId);
  const title = habit?.name ?? 'Habit';
  let icon: IconName;
  let summary: string;
  if (change.kind === 'colour') {
    icon = 'palette';
    summary = 'Colour changed';
  } else if (habit && isNumericHabit(habit)) {
    icon = change.after === null ? 'erase' : 'number';
    const before =
      change.before === null
        ? '—'
        : `${change.before}${change.after === null && habit.unit ? ` ${habit.unit}` : ''}`;
    const after =
      change.after === null
        ? 'Cleared'
        : `${change.after}${habit.unit ? ` ${habit.unit}` : ''}`;
    summary = `${before} → ${after}`;
  } else {
    icon = change.after === null ? 'unchecked' : 'checked';
    summary = change.after === null ? 'Unchecked' : 'Checked';
  }
  const recordedDay = localDateKey(new Date(event.recordedAt));
  const effectiveDate =
    change.kind === 'entry' && change.date !== recordedDay ? change.date : null;
  return {
    title,
    summary,
    icon,
    color: habit?.color ?? '#ACB8C5',
    effectiveDate,
  };
}
