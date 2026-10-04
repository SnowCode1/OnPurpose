export function localDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// Calendar arithmetic at local noon avoids assuming every day is 24 hours.
export function pastDay(today: string, daysAgo: number): Date {
  if (!Number.isInteger(daysAgo) || daysAgo < 0) {
    throw new Error('A history offset must be a non-negative integer.');
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

export function makeHistoryDays(today: string, count: number): GridDay[] {
  return Array.from({ length: count }, (_, daysAgo) => {
    const date = pastDay(today, daysAgo);
    return {
      key: localDateKey(date),
      daysAgo,
      label:
        daysAgo === 0
          ? 'Today'
          : date.toLocaleDateString(undefined, { weekday: 'short' }),
      number: date.getDate(),
      fullLabel: date.toLocaleDateString(undefined, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
    };
  });
}
