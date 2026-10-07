export const formatStatistic = (value: number | null) =>
  value === null
    ? '—'
    : value.toLocaleString(undefined, { maximumFractionDigits: 1 });
export const statisticDateLabel = (key: string, withYear = false) =>
  new Date(`${key}T12:00:00`).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' as const } : {}),
  });
