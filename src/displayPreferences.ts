import { isRowSpacing, type RowSpacing } from './rowSpacing.ts';

export type ColumnSpacing = RowSpacing;
export const columnSpacingOptions = [
  { value: 'compact', label: 'Compact', width: 48 },
  { value: 'standard', label: 'Standard', width: 64 },
  { value: 'roomy', label: 'Roomy', width: 80 },
] as const;
export const isColumnSpacing = isRowSpacing;
export type WeekStart = 'monday' | 'sunday';
export const weekStartOptions = [
  { value: 'monday', label: 'Monday' },
  { value: 'sunday', label: 'Sunday' },
] as const;
export function isWeekStart(value: unknown): value is WeekStart {
  return value === 'monday' || value === 'sunday';
}
export const displayDefaults = {
  columnSpacing: 'compact',
  weekStart: 'monday',
  dateFading: true,
} as const;
export function weekDayOrder(start: WeekStart): number[] {
  return Array.from(
    { length: 7 },
    (_, index) => (index + (start === 'monday' ? 1 : 0)) % 7,
  );
}
