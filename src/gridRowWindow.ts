// Keep real cells near the vertical viewport; names still measure every row.
// Two-row buckets avoid React updates for every vertical scroll pixel. The
// equally sized overscan covers the bucket's remaining travel before refilling.
export function gridRowBucket(offset: number, baseHeight: number) {
  const step = Math.max(1, baseHeight * 2);
  return Math.floor(Math.max(0, offset) / step) * step;
}
export function gridRowRange(
  rows: readonly { id: string }[],
  tops: Record<string, number>,
  heights: Record<string, number>,
  baseHeight: number,
  offset: number,
  viewportHeight: number,
) {
  if (viewportHeight <= 0 || !Number.isFinite(viewportHeight))
    return { start: 0, end: rows.length };
  const buffer = baseHeight * 2;
  const first = Math.max(0, offset - buffer);
  const last = offset + viewportHeight + buffer;
  let start = 0;
  while (
    start < rows.length &&
    tops[rows[start].id] + (heights[rows[start].id] ?? baseHeight) <= first
  )
    start++;
  let end = start;
  while (end < rows.length && tops[rows[end].id] < last) end++;
  return { start, end };
}
