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
  checkboxStyle: 'boxes',
  weekDividers: true,
  tapAnimations: true,
  textScale: 1,
  hideCompleted: false,
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

export type CheckboxStyle = 'boxes' | 'marks';
export const checkboxStyleOptions = [
  { value: 'boxes', label: 'Checkboxes' },
  { value: 'marks', label: 'Ticks & crosses' },
] as const;
export function isCheckboxStyle(value: unknown): value is CheckboxStyle {
  return value === 'boxes' || value === 'marks';
}
// Fixed calendar weeks keep their shade when Today changes or the range expands.
// UTC arithmetic reads the saved local date without device timezone/DST shifts.
export function isShadedWeek(date: string, start: WeekStart): boolean {
  const day = Date.parse(`${date}T12:00:00Z`) / 86_400_000;
  // The first Monday/Sunday after the Unix epoch was January 5/4, 1970.
  const week = Math.floor((day - (start === 'monday' ? 4 : 3)) / 7);
  return ((week % 2) + 2) % 2 === 0;
}
