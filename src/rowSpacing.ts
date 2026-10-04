export const rowSpacingOptions = [
  { value: 'compact', label: 'Compact', height: 44 },
  { value: 'standard', label: 'Standard', height: 52 },
  { value: 'roomy', label: 'Roomy', height: 64 },
] as const;
export type RowSpacing = (typeof rowSpacingOptions)[number]['value'];
export function isRowSpacing(value: unknown): value is RowSpacing {
  return rowSpacingOptions.some((option) => option.value === value);
}
export function gridRowHeight(spacing: RowSpacing, fontScale: number) {
  const height = rowSpacingOptions.find(
    (option) => option.value === spacing,
  )!.height;
  return Math.max(height, Math.ceil((height - 4) * fontScale));
}
