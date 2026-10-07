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
// Use the saved local date directly; device timezone must not shift its weekday.
export function beginsWeek(date: string, start: WeekStart): boolean {
  return (
    new Date(`${date}T12:00:00Z`).getUTCDay() === (start === 'monday' ? 1 : 0)
  );
}
