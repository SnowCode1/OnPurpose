export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Calendar arithmetic at local noon avoids assuming every day is 24 hours.
export function calendarDay(today: string, daysAgo: number): Date {
  if (!Number.isInteger(daysAgo)) {
    throw new Error('A calendar offset must be an integer.');
  }
  const date = new Date(`${today}T12:00:00`);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

export function millisecondsUntilTomorrow(now: Date): number {
  const tomorrow = new Date(now);
  tomorrow.setHours(24, 0, 0, 100);
  return tomorrow.getTime() - now.getTime();
}

export type GridDay = {
  key: string;
  daysAgo: number;
  label: string;
  number: number;
  fullLabel: string;
};

export type EntryDay = Pick<GridDay, 'key' | 'fullLabel'>;

export function entryDay(key: string): EntryDay {
  return {
    key,
    fullLabel: calendarDay(key, 0).toLocaleDateString(undefined, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }),
  };
}

export function makeGridDays(
  today: string,
  count: number,
  futureCount = 0,
): GridDay[] {
  return Array.from({ length: count + futureCount }, (_, index) => {
    const daysAgo = index - futureCount;
    const date = calendarDay(today, daysAgo);
    return {
      ...entryDay(localDateKey(date)),
      daysAgo,
      label:
        daysAgo === 0
          ? 'Today'
          : date.toLocaleDateString(undefined, { weekday: 'short' }),
      number: date.getDate(),
    };
  });
}
