// iOS rubber-banding already resists this distance; only a direct drag released
// beyond the threshold unlocks dates. Momentum reaching the edge never does.
export const FUTURE_PULL_DISTANCE = 64;
export const FUTURE_BATCH = 30;

export function shouldRevealFuture(offset: number): boolean {
  'worklet';
  return offset <= -FUTURE_PULL_DISTANCE;
}

export function settledDay(
  offset: number,
  columnWidth: number,
  pastCount: number,
  futureCount: number,
  visibleDays: number,
): number {
  'worklet';
  if (columnWidth <= 0) return 0;
  const index = Math.max(
    0,
    Math.min(
      pastCount + futureCount - visibleDays,
      Math.round(offset / columnWidth),
    ),
  );
  return index - futureCount;
}
