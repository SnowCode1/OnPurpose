import { useState } from 'react';
import type { RowSpacing } from './rowSpacing.ts';
import type {
  ColumnSpacing,
  NameColumnWidth,
  CheckboxStyle,
  WeekStart,
} from './displayPreferences.ts';

export type GridDisplayPreferences = {
  rowSpacing: RowSpacing;
  checkboxStyle: CheckboxStyle;
  weekDividers: boolean;
  tapAnimations: boolean;
  weekStart: WeekStart;
  columnSpacing: ColumnSpacing;
  nameColumnWidth: NameColumnWidth;
  textScale: number;
  dateFading: boolean;
  hideCompleted: boolean;
};

export function useGridDisplayPreferences(
  current: GridDisplayPreferences,
  deferred: boolean,
) {
  const [displayed, setDisplayed] = useState(current);
  // Hold presentation geometry only. Settings and persistence always receive
  // current values; keep the mounted grid and its scroll/reorder state intact.
  if (
    !deferred &&
    Object.keys(current).some(
      (key) =>
        displayed[key as keyof GridDisplayPreferences] !==
        current[key as keyof GridDisplayPreferences],
    )
  )
    setDisplayed(current);
  // Completion filtering is prepared while Settings is still covering the grid.
  return deferred
    ? { ...displayed, hideCompleted: current.hideCompleted }
    : current;
}
