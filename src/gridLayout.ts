import {
  AUTO_COLUMN_WIDTH,
  autoNameWidth,
  type GridSizing,
} from './gridSizing.ts';
// Fill the available space with whole days while keeping names and touch
// targets readable. Larger system text gets more space, rather than clipping.
export function gridLayout(
  width: number,
  fontScale: number,
  sizing: Pick<GridSizing, 'nameWidth' | 'nameFactor' | 'columnWidth'> = {
    nameWidth: 'auto',
    nameFactor: 1,
    columnWidth: 'auto',
  },
) {
  const scale = Math.max(1, fontScale);
  const minimumDayWidth =
    (sizing.columnWidth === 'auto' ? AUTO_COLUMN_WIDTH : sizing.columnWidth) *
    scale;
  const preferredName =
    sizing.nameWidth === 'auto'
      ? autoNameWidth(width, scale) * sizing.nameFactor
      : sizing.nameWidth * scale;
  const nameWidth = Math.max(
    0,
    Math.min(Math.round(preferredName), width - minimumDayWidth),
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
