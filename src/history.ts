import { localDateKey } from './calendar.ts';
import type { ChangeEvent, StoredEvent, StoredState } from './storage/model.ts';
import type { IconName } from './Icon.tsx';

export type HistorySection = { key: string; date: string; data: ChangeEvent[] };

// Keep the log's newest-first sequence, including when the device clock changes.
// A date may have another section if it recurs after a clock/time-zone adjustment.
export function historySections(
  events: StoredEvent[],
  limit: number,
): HistorySection[] {
  const sections: HistorySection[] = [];
  let count = 0;
  for (let index = events.length - 1; index >= 0 && count < limit; index--) {
    const event = events[index];
    if (event.type === 'initialize') continue;
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

export function historyPresentation(event: ChangeEvent, state: StoredState) {
  const change = event.change;
  const habit =
    change.kind === 'haptics'
      ? undefined
      : state.habits.find((habit) => habit.id === change.habitId);
  const title =
    habit?.name ?? (change.kind === 'haptics' ? 'Haptic feedback' : 'Habit');
  let icon: IconName;
  let summary: string;
  if (change.kind === 'haptics') {
    icon = 'haptics';
    summary = `${change.before ? 'On' : 'Off'} → ${change.after ? 'On' : 'Off'}`;
  } else if (change.kind === 'colour') {
    icon = 'palette';
    summary = 'Colour changed';
  } else if (habit?.unit) {
    icon = change.after === null ? 'erase' : 'number';
    const before =
      change.before === null
        ? '—'
        : `${change.before}${change.after === null ? ` ${habit.unit}` : ''}`;
    const after =
      change.after === null ? 'Cleared' : `${change.after} ${habit.unit}`;
    summary = `${before} → ${after}`;
  } else {
    icon = change.after === null ? 'unchecked' : 'checked';
    summary = change.after === null ? 'Unchecked' : 'Checked';
  }
  if (event.type !== 'change') {
    icon = event.type;
    summary = `${event.type === 'undo' ? 'Undo' : 'Redo'} · ${summary}`;
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
