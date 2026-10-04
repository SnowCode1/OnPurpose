// Fill the available space with whole days while keeping names and touch
// targets readable. Larger system text gets more space, rather than clipping.
export function gridLayout(width: number, fontScale: number) {
  const scale = Math.max(1, fontScale);
  const minimumDayWidth = 48 * scale;
  const nameWidth = Math.max(
    0,
    Math.min(
      Math.round(Math.max(140 * scale, Math.min(width * 0.4, 200 * scale))),
      width - minimumDayWidth,
    ),
  );
  const dateWidth = Math.max(0, width - nameWidth);
  const visibleDays = Math.max(1, Math.floor(dateWidth / minimumDayWidth));
  return {
    nameWidth,
    dateWidth,
    visibleDays,
    columnWidth: dateWidth / visibleDays,
  };
}
