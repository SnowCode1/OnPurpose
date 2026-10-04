import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { type GridDay, makeHistoryDays, pastDay } from './calendar';
import { type Habit } from './habits';

type Props = {
  today: string;
  habits: Habit[];
  values: Record<string, number>;
  onHabitPress: (habit: Habit) => void;
  onCellPress: (habit: Habit, day: GridDay) => void;
};

export function HabitGrid({
  today,
  habits,
  values,
  onHabitPress,
  onCellPress,
}: Props) {
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const [dayCount, setDayCount] = useState(90);
  const [position, setPosition] = useState({ width: 0, day: 0 });
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const header = useRef<FlatList<GridDay>>(null);
  const body = useRef<FlatList<GridDay>>(null);
  const driver = useRef<'header' | 'body'>('body');
  const days = useMemo(
    () => makeHistoryDays(today, dayCount),
    [today, dayCount],
  );
  const visibleDays = fontScale > 1.35 || width < 320 ? 2 : 3;
  const nameWidth = Math.round(width * 0.46);
  const dateWidth = width - nameWidth;
  const columnWidth = dateWidth / visibleDays;
  const rightmostDay = position.width === columnWidth ? position.day : 0;
  const baseRowHeight = Math.max(54, Math.ceil(48 * fontScale));
  const gridHeight = habits.reduce(
    (total, habit) => total + (rowHeights[habit.id] ?? baseRowHeight),
    0,
  );
  const newest = pastDay(today, rightmostDay);
  const oldest = pastDay(today, rightmostDay + visibleDays - 1);
  const month = newest.toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
  const range = `${oldest.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} – ${newest.toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}`;

  useEffect(() => {
    driver.current = 'body';
    header.current?.scrollToOffset({ offset: 0, animated: false });
    body.current?.scrollToOffset({ offset: 0, animated: false });
  }, [columnWidth]);

  function sync(
    source: 'header' | 'body',
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) {
    if (driver.current !== source) return;
    const offset = Math.max(0, event.nativeEvent.contentOffset.x);
    const follower = source === 'body' ? header : body;
    follower.current?.scrollToOffset({ offset, animated: false });
    const day = Math.min(
      dayCount - visibleDays,
      Math.max(0, Math.round(offset / columnWidth)),
    );
    setPosition((previous) =>
      previous.width === columnWidth && previous.day === day
        ? previous
        : { width: columnWidth, day },
    );
  }

  function returnToToday() {
    driver.current = 'body';
    // An immediate jump also avoids traversing years of dates in an animation.
    body.current?.scrollToOffset({ offset: 0, animated: false });
    header.current?.scrollToOffset({ offset: 0, animated: false });
    setPosition({ width: columnWidth, day: 0 });
  }

  const shared = {
    data: days,
    horizontal: true,
    inverted: true,
    bounces: false,
    overScrollMode: 'never' as const,
    showsHorizontalScrollIndicator: false,
    directionalLockEnabled: true,
    nestedScrollEnabled: true,
    snapToInterval: columnWidth,
    decelerationRate: 'fast' as const,
    scrollEventThrottle: 16,
    initialNumToRender: 6,
    maxToRenderPerBatch: 12,
    windowSize: 5,
    removeClippedSubviews: false,
    keyExtractor: (day: GridDay) => day.key,
    getItemLayout: (_: unknown, index: number) => ({
      length: columnWidth,
      offset: columnWidth * index,
      index,
    }),
    onEndReached: () => setDayCount((count) => count + 90),
    onEndReachedThreshold: 2,
  };

  return (
    <View
      style={styles.container}
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      <View style={styles.period}>
        <View style={styles.periodText}>
          <Text style={styles.month}>{month}</Text>
          <Text style={styles.range}>{range}</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return to today"
          accessibilityState={{ disabled: rightmostDay === 0 }}
          disabled={rightmostDay === 0}
          onPress={returnToToday}
          style={({ pressed }) => [
            styles.todayButton,
            { opacity: rightmostDay === 0 ? 0.45 : pressed ? 0.65 : 1 },
          ]}
        >
          <Text style={styles.todayText}>Today ↗</Text>
        </Pressable>
      </View>
      {width > 0 && (
        <>
          <View style={styles.header}>
            <View style={[styles.namesHeader, { width: nameWidth }]}>
              <Text style={styles.habitsLabel}>HABITS</Text>
            </View>
            <FlatList
              {...shared}
              ref={header}
              style={{ width: dateWidth, flexGrow: 0 }}
              onScrollBeginDrag={() => {
                driver.current = 'header';
              }}
              onScroll={(event) => sync('header', event)}
              renderItem={({ item: day }) => (
                <View
                  style={[
                    styles.dayHeader,
                    { width: columnWidth },
                    day.daysAgo === 0 && styles.todayColumn,
                  ]}
                >
                  <Text
                    style={[
                      styles.weekday,
                      day.daysAgo === 0 && styles.todayLabel,
                    ]}
                  >
                    {day.label}
                  </Text>
                  <Text style={styles.dayNumber}>{day.number}</Text>
                </View>
              )}
            />
          </View>
          <ScrollView
            style={styles.rows}
            directionalLockEnabled
            nestedScrollEnabled
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.rowsContent}
          >
            <View style={styles.gridBody}>
              <View style={{ width: nameWidth }}>
                {habits.map((habit) => (
                  <Pressable
                    key={habit.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${habit.name}, details and colour`}
                    onPress={() => onHabitPress(habit)}
                    onLayout={(event) => {
                      const height = event.nativeEvent.layout.height;
                      setRowHeights((previous) =>
                        previous[habit.id] === height
                          ? previous
                          : { ...previous, [habit.id]: height },
                      );
                    }}
                    style={({ pressed }) => [
                      styles.habit,
                      {
                        minHeight: baseRowHeight,
                        borderBottomColor: `${habit.color}24`,
                        backgroundColor: pressed
                          ? `${habit.color}15`
                          : '#000000',
                      },
                    ]}
                  >
                    <Text style={[styles.habitName, { color: habit.color }]}>
                      {habit.name}
                    </Text>
                    {habit.unit && (
                      <Text style={[styles.unit, { color: habit.color }]}>
                        {habit.unit}
                      </Text>
                    )}
                  </Pressable>
                ))}
              </View>
              <FlatList
                {...shared}
                ref={body}
                // Width changes remount the list so columns start aligned at Today.
                key={columnWidth}
                style={{ width: dateWidth, height: gridHeight, flexGrow: 0 }}
                onScrollBeginDrag={() => {
                  driver.current = 'body';
                }}
                onScroll={(event) => sync('body', event)}
                renderItem={({ item: day }) => (
                  <View style={{ width: columnWidth }}>
                    {habits.map((habit) => {
                      const value = values[`${habit.id}:${day.key}`];
                      const checked = value === 1;
                      return (
                        <Pressable
                          key={habit.id}
                          testID={`cell-${habit.id}-${day.key}`}
                          accessibilityRole={habit.unit ? 'button' : 'checkbox'}
                          accessibilityState={
                            habit.unit ? undefined : { checked }
                          }
                          accessibilityLabel={`${habit.name}, ${day.fullLabel}${habit.unit ? `, ${value === undefined ? 'not recorded' : `${value} ${habit.unit}`}` : ''}`}
                          accessibilityHint={
                            habit.unit
                              ? 'Edit this day’s total'
                              : 'Toggle this day’s completion'
                          }
                          onPress={() => onCellPress(habit, day)}
                          style={({ pressed }) => [
                            styles.cell,
                            {
                              height: rowHeights[habit.id] ?? baseRowHeight,
                              borderBottomColor: `${habit.color}24`,
                              backgroundColor: pressed
                                ? `${habit.color}20`
                                : day.daysAgo === 0
                                  ? '#0B0B0B'
                                  : '#000000',
                            },
                          ]}
                        >
                          {habit.unit ? (
                            <Text
                              numberOfLines={1}
                              adjustsFontSizeToFit
                              minimumFontScale={0.65}
                              style={[
                                styles.numeric,
                                {
                                  color: habit.color,
                                  opacity: value === undefined ? 0.55 : 1,
                                },
                              ]}
                            >
                              {value === undefined ? '—' : String(value)}
                            </Text>
                          ) : (
                            <View
                              style={[
                                styles.checkbox,
                                {
                                  borderColor: checked
                                    ? habit.color
                                    : `${habit.color}88`,
                                  backgroundColor: checked
                                    ? habit.color
                                    : 'transparent',
                                },
                              ]}
                            >
                              {checked && (
                                <Text
                                  allowFontScaling={false}
                                  style={styles.checkmark}
                                >
                                  ✓
                                </Text>
                              )}
                            </View>
                          )}
                        </Pressable>
                      );
                    })}
                  </View>
                )}
              />
            </View>
          </ScrollView>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  period: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
  },
  periodText: { flex: 1, paddingRight: 8 },
  month: {
    color: '#F4F4F4',
    fontSize: 24,
    fontWeight: '600',
    letterSpacing: -0.6,
  },
  range: { color: '#929292', fontSize: 12, marginTop: 5 },
  todayButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#3A3A3A',
  },
  todayText: { color: '#E5E5E5', fontSize: 13, fontWeight: '500' },
  header: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#363636',
  },
  namesHeader: { justifyContent: 'center' },
  habitsLabel: {
    color: '#8B8B8B',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.6,
  },
  dayHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    minHeight: 60,
  },
  weekday: { color: '#979797', fontSize: 11, fontWeight: '500' },
  dayNumber: {
    color: '#E8E8E8',
    fontSize: 19,
    fontWeight: '600',
    marginTop: 3,
    fontVariant: ['tabular-nums'],
  },
  todayColumn: {
    backgroundColor: '#0B0B0B',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  todayLabel: { color: '#FFFFFF' },
  rows: { flex: 1 },
  rowsContent: { paddingBottom: 8 },
  gridBody: { flexDirection: 'row', alignItems: 'flex-start' },
  habit: {
    justifyContent: 'center',
    paddingRight: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  habitName: { fontSize: 15, fontWeight: '500' },
  unit: { fontSize: 11, marginTop: 3, opacity: 0.8 },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  numeric: { fontSize: 20, fontWeight: '500', fontVariant: ['tabular-nums'] },
  checkbox: {
    width: 23,
    height: 23,
    borderRadius: 7,
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
