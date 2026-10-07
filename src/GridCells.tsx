import { cellEntryLabel, entryLabel } from './entries';
import { evaluateGoal, checkboxChecked } from './habitGoals';
import { GridCheckboxMark, type CheckboxFeedback } from './GridCheckboxMark';
import {
  isShadedWeek,
  type WeekStart,
  type CheckboxStyle,
} from './displayPreferences';
import { Text } from './Typography';
import { memo, useMemo, useRef, useSyncExternalStore } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { GridDay } from './calendar';
import { habitType, isNumericHabit, type Habit } from './habits';
import { ReorderRow, type RowMotion } from './ReorderRow';
import { dayTone, dateTones, type GridPalette } from './gridAppearance';
import { entrySelection, recordedDaySelection } from './storage/selection';
import type { ChangeStore } from './storage/store';
import { recordPerformance } from './performance';
import {
  GRID_ENTRY_FONT_SIZE,
  GRID_ENTRY_LINE_HEIGHT,
  gridEntryTextLines,
} from './gridEntryText';

type CellProps = {
  store: ChangeStore;
  habit: Habit;
  day: GridDay;
  palette: GridPalette;
  motion: RowMotion;
  height: number;
  width: number;
  checkboxStyle: CheckboxStyle;
  tapAnimations: boolean;
  fontScale: number;
  disabled: boolean;
  onPress: (habit: Habit, day: GridDay) => void;
};
const GridCell = memo(function GridCell({
  store,
  habit,
  day,
  palette,
  motion,
  height,
  width,
  checkboxStyle,
  tapAnimations,
  fontScale,
  disabled,
  onPress,
}: CellProps) {
  const mark = useRef<CheckboxFeedback>(null);
  const selection = useMemo(
    () => entrySelection(store, `${habit.id}:${day.key}`),
    [store, habit.id, day.key],
  );
  const value = useSyncExternalStore(
    selection.subscribe,
    selection.getSnapshot,
  );
  recordPerformance('grid.cell.render');
  const numeric = isNumericHabit(habit);
  const checkbox = habitType(habit) === 'checkbox';
  const checked = checkboxChecked(habit, value, day.key);
  const recorded = value !== undefined;
  const goal = evaluateGoal(habit, value, day.key);
  const tone = palette.tones[dayTone(day.daysAgo)];
  return (
    <ReorderRow motion={motion}>
      <Pressable
        testID={`cell-${habit.id}-${day.key}`}
        disabled={disabled}
        accessibilityRole={checkbox ? 'checkbox' : 'button'}
        accessibilityState={checkbox ? { checked, disabled } : { disabled }}
        accessibilityLabel={`${habit.name}, ${day.fullLabel}${checkbox ? '' : `, ${value === undefined ? 'not recorded' : entryLabel(habit, value) + (habit.unit ? ` ${habit.unit}` : '')}`}, ${goal.active ? (goal.met ? 'goal met' : recorded ? 'goal not met' : 'not recorded') : 'tracking only'}${goal.active && !goal.scheduled ? ', not scheduled' : ''}`}
        accessibilityHint={
          checkbox
            ? 'Toggle this day’s checkbox state'
            : numeric
              ? 'Edit this day’s total'
              : habit.type === 'categorical'
                ? 'Choose categories for this day'
                : 'Read or edit this day’s text'
        }
        onPress={() => {
          onPress(habit, day);
          const next =
            store.getSnapshot().replay.state.values[`${habit.id}:${day.key}`];
          if (
            checkbox &&
            tapAnimations &&
            checkboxChecked(habit, next, day.key) !== checked
          )
            mark.current?.pulse();
        }}
        style={({ pressed }) => [
          styles.cell,
          {
            height,
            borderBottomColor: tone.rule,
            backgroundColor: pressed
              ? `${habit.color}20`
              : goal.met
                ? palette.completedBackground
                : day.daysAgo === 0
                  ? '#090909'
                  : '#000000',
          },
        ]}
      >
        {!checkbox ? (
          <Text
            numberOfLines={numeric ? 1 : gridEntryTextLines(height, fontScale)}
            adjustsFontSizeToFit={numeric}
            minimumFontScale={numeric ? 0.65 : undefined}
            ellipsizeMode="tail"
            style={[
              numeric ? styles.numeric : styles.textEntry,
              { color: recorded ? habit.color : tone.number },
            ]}
          >
            {cellEntryLabel(habit, value)}
          </Text>
        ) : (
          <GridCheckboxMark
            ref={mark}
            checked={checked}
            style={checkboxStyle}
            checkmark={palette.checkmark}
            size={Math.max(
              0,
              Math.min(28 * fontScale, height - 16, width - 16),
            )}
            colour={goal.met ? habit.color : tone.checkbox}
          />
        )}
      </Pressable>
    </ReorderRow>
  );
});
export const GridDateColumn = memo(function GridDateColumn({
  store,
  habits,
  day,
  palettes,
  motions,
  heights,
  baseHeight,
  checkboxStyle,
  tapAnimations,
  fontScale,
  width,
  height,
  disabled,
  onPress,
}: {
  store: ChangeStore;
  habits: Habit[];
  day: GridDay;
  palettes: Record<string, GridPalette>;
  motions: Record<string, RowMotion>;
  heights: Record<string, number>;
  baseHeight: number;
  checkboxStyle: CheckboxStyle;
  tapAnimations: boolean;
  fontScale: number;
  width: number;
  height: number;
  disabled: boolean;
  onPress: CellProps['onPress'];
}) {
  return (
    <View style={{ width, height, backgroundColor: '#000000' }}>
      {habits.map((habit) => (
        <GridCell
          key={habit.id}
          store={store}
          habit={habit}
          day={day}
          palette={palettes[habit.id]}
          motion={motions[habit.id]}
          height={heights[habit.id] ?? baseHeight}
          fontScale={fontScale}
          width={width}
          tapAnimations={tapAnimations}
          checkboxStyle={checkboxStyle}
          disabled={disabled}
          onPress={onPress}
        />
      ))}
    </View>
  );
});
export const GridDateHeading = memo(function GridDateHeading({
  dateFading,
  weekStart,
  weekDividers,
  store,
  habits,
  day,
  width,
}: {
  dateFading: boolean;
  weekStart: WeekStart;
  weekDividers: boolean;
  store: ChangeStore;
  habits: Habit[];
  day: GridDay;
  width: number;
}) {
  const selection = useMemo(
    () => recordedDaySelection(store, habits, day.key),
    [store, habits, day.key],
  );
  const recorded = useSyncExternalStore(
    selection.subscribe,
    selection.getSnapshot,
  );
  recordPerformance('grid.heading.render');
  return (
    <GridDateLabel
      day={day}
      width={width}
      recorded={recorded}
      dateFading={dateFading}
      weekDividers={weekDividers}
      weekStart={weekStart}
    />
  );
});
export const GridDateLabel = memo(function GridDateLabel({
  day,
  width,
  recorded,
  dateFading,
  weekStart,
  weekDividers,
}: {
  day: GridDay;
  width: number;
  recorded: boolean;
  dateFading: boolean;
  weekStart: WeekStart;
  weekDividers: boolean;
}) {
  const tone = dateTones[recorded || !dateFading ? 0 : dayTone(day.daysAgo)];
  return (
    <View
      testID="date-heading"
      style={[
        styles.dayHeader,
        { width },
        weekDividers && isShadedWeek(day.key, weekStart) && styles.shadedWeek,
        day.daysAgo === 0 && styles.todayColumn,
      ]}
    >
      <Text
        style={[
          styles.weekday,
          { color: day.daysAgo === 0 ? '#FFFFFF' : tone.label },
        ]}
      >
        {day.label}
      </Text>
      <Text style={[styles.dayNumber, { color: tone.number }]}>
        {day.number}
      </Text>
    </View>
  );
});
const styles = StyleSheet.create({
  dayHeader: {
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 56,
  },
  shadedWeek: { backgroundColor: '#0C0C0C' },
  weekday: { fontSize: 11, fontWeight: '500' },
  dayNumber: {
    fontSize: 19,
    fontWeight: '600',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  todayColumn: {
    backgroundColor: '#191919',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  textEntry: {
    fontSize: GRID_ENTRY_FONT_SIZE,
    lineHeight: GRID_ENTRY_LINE_HEIGHT,
    fontWeight: '500',
    width: '100%',
    textAlign: 'center',
  },
  numeric: { fontSize: 18, fontWeight: '500', fontVariant: ['tabular-nums'] },
});
