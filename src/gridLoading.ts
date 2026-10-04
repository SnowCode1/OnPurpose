// The inverted grid moves older dates rightwards as its native offset increases.
// Repeat one extra column at either edge so a fast fling never outruns the dashes.
export function loadingStripOffset(offset: number, columnWidth: number) {
  'worklet';
  if (columnWidth <= 0) return 0;
  return (((offset % columnWidth) + columnWidth) % columnWidth) - columnWidth;
}

// Cover only rubber-band space beyond the real content, so pulling at Today
// does not suggest that unopened future dates are loading.
export function loadingEdgeMasks(
  offset: number,
  maximum: number,
  width: number,
) {
  'worklet';
  return {
    right: Math.max(-width, Math.min(0, offset)),
    left: Math.min(width, Math.max(0, offset - maximum)),
  };
}

export function gridRenderBudget(visibleDays: number) {
  return {
    bodyBatch: Math.max(2, visibleDays + 1),
    headerBatch: Math.max(12, visibleDays * 3),
    batchPeriod: 16,
    bodyWindow: 5,
    headerWindow: 11,
  };
}
