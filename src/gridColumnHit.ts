// Cell coordinates are in the column's full content space, including vertical
// scrolling. Real rows keep their absolute tops even when other rows are omitted.
export function gridColumnHit<T extends { id: string }>(
  rows: readonly T[],
  tops: Record<string, { top: number }>,
  heights: Record<string, number>,
  baseHeight: number,
  y: number,
  currentTops?: Record<string, number>,
): T | null {
  if (!Number.isFinite(y) || y < 0) return null;
  for (const row of rows) {
    const top = currentTops?.[row.id] ?? tops[row.id]?.top;
    if (top === undefined) continue;
    if (y >= top && y < top + (heights[row.id] ?? baseHeight)) return row;
  }
  return null;
}
