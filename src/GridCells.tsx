import { cellEntryLabel, entryLabel } from './entries';
import { evaluateGoal, checkboxChecked } from './habitGoals';
import { Text } from './Typography';
import { memo, useMemo, useSyncExternalStore } from 'react';
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
  fontScale,
  disabled,
  onPress,
}: CellProps) {
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
            ? 'Toggle this day’s completion'
            : numeric
              ? 'Edit this day’s total'
              : habit.type === 'categorical'
                ? 'Choose categories for this day'
                : 'Read or edit this day’s text'
        }
        onPress={() => onPress(habit, day)}
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
          <View
            style={[
              styles.checkbox,
              {
                borderColor: checked ? habit.color : tone.checkbox,
                backgroundColor: checked ? habit.color : 'transparent',
              },
            ]}
          >
            {checked && (
              <Text
                allowFontScaling={false}
                style={[styles.checkmark, { color: palette.checkmark }]}
              >
                ✓
              </Text>
            )}
          </View>
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
          disabled={disabled}
          onPress={onPress}
        />
      ))}
    </View>
  );
});
export const GridDateHeading = memo(function GridDateHeading({
  dateFading,
  store,
  habits,
  day,
  width,
}: {
  dateFading: boolean;
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
    />
  );
});
export const GridDateLabel = memo(function GridDateLabel({
  day,
  width,
  recorded,
  dateFading,
}: {
  day: GridDay;
  width: number;
  recorded: boolean;
  dateFading: boolean;
}) {
  const tone = dateTones[recorded || !dateFading ? 0 : dayTone(day.daysAgo)];
  return (
    <View
      style={[
        styles.dayHeader,
        { width },
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
  weekday: { fontSize: 11, fontWeight: '500' },
  dayNumber: {
    fontSize: 19,
    fontWeight: '600',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  todayColumn: {
    backgroundColor: '#090909',
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
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#000000',
    fontSize: 17,
    lineHeight: 20,
    fontWeight: '700',
  },
});
