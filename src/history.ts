import { sameValue } from './storage/model.ts';
import { entryLabel } from './entries.ts';
import { localDateKey } from './calendar.ts';
import { habitType, isNumericHabit } from './habits.ts';
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

// Keep names/types for older actions after deletion, without returning these
// habits or their records to the live grid/archive/statistics state.
export function historyDisplayState(
  state: StoredState,
  actions: HistoryAction[],
): StoredState {
  const habits = new Map(state.habits.map((habit) => [habit.id, habit]));
  for (let index = actions.length - 1; index >= 0; index--) {
    const change = actions[index].change;
    if (
      change.kind === 'deleteHabit' &&
      change.before &&
      !habits.has(change.habitId)
    )
      habits.set(change.habitId, change.before.habit);
  }
  return habits.size === state.habits.length
    ? state
    : { ...state, habits: [...habits.values()] };
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
  if (change.kind === 'deleteHabit') {
    const habit = (change.before ?? change.after)!.habit;
    return {
      title: habit.name,
      summary: 'Habit deleted',
      icon: 'erase' as const,
      color: habit.color,
      effectiveDate: null,
    };
  }
  if (change.kind === 'habit') {
    const habit = change.after ?? change.before!;
    const descriptionChanged =
      change.before &&
      change.after &&
      change.before.description !== change.after.description;
    const summary = descriptionChanged
      ? change.after?.description
        ? 'Description edited'
        : 'Description cleared'
      : !change.before
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
                change.before.description === change.after.description &&
                habitType(change.before) === habitType(change.after) &&
                sameValue(change.before.categories, change.after.categories)
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
  } else if (habit && habitType(habit) !== 'checkbox') {
    icon =
      change.after === null
        ? 'erase'
        : habit.type === 'categorical'
          ? 'categories'
          : 'text';
    const compact = (value: typeof change.before) => {
      const label = entryLabel(habit, value).replace(/\s+/g, ' ');
      return label.length > 55 ? label.slice(0, 54) + '…' : label;
    };
    summary = `${compact(change.before)} → ${change.after === null ? 'Cleared' : compact(change.after)}`;
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
