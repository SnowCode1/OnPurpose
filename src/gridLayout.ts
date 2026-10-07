import {
  columnSpacingOptions,
  type ColumnSpacing,
  type NameColumnWidth,
} from './displayPreferences.ts';
// Fill the available space with whole days while keeping names and touch
// targets readable. Larger system text gets more space, rather than clipping.
export function gridLayout(
  width: number,
  fontScale: number,
  spacing: ColumnSpacing = 'standard',
  names: NameColumnWidth = 'standard',
) {
  const scale = Math.max(1, fontScale);
  const minimumDayWidth =
    columnSpacingOptions.find((option) => option.value === spacing)!.width *
    scale;
  const factor = names === 'narrow' ? 0.8 : names === 'wide' ? 1.2 : 1;
  const nameWidth = Math.max(
    0,
    Math.min(
      Math.round(
        Math.max(140 * scale, Math.min(width * 0.4, 200 * scale)) * factor,
      ),
      width - 48 * scale,
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
