import { type ComponentType, type Ref, memo, useMemo, useState } from 'react';
import {
  FlatList,
  type FlatListProps,
  type TextProps,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { type GridDay, makeGridDays, calendarDay } from './calendar';
import { type Habit } from './habits';
import { checkmarkColor } from './colors';
import { gridLayout } from './gridLayout';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useGridScroll } from './useGridScroll';
import { FUTURE_BATCH, FUTURE_PULL_DISTANCE } from './gridNavigation';

type Props = {
  HeadingComponent: ComponentType<TextProps>;
  today: string;
  habits: Habit[];
  values: Record<string, number>;
  onHabitPress: (habit: Habit) => void;
  onCellPress: (habit: Habit, day: GridDay) => void;
};

export const HabitGrid = memo(function HabitGrid({
  HeadingComponent,
  today,
  habits,
  values,
  onHabitPress,
  onCellPress,
}: Props) {
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const [dayCount, setDayCount] = useState(90);
  const [futureCount, setFutureCount] = useState(0);
  const [rightmostDay, setRightmostDay] = useState(0);
  const atTodayBoundary = rightmostDay === 0 && futureCount === 0;
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const days = useMemo(
    () => makeGridDays(today, dayCount, futureCount),
    [today, dayCount, futureCount],
  );
  const { visibleDays, nameWidth, dateWidth, columnWidth } = gridLayout(
    width,
    fontScale,
  );
  const baseRowHeight = Math.max(52, Math.ceil(48 * fontScale));
  const gridHeight = habits.reduce(
    (total, habit) => total + (rowHeights[habit.id] ?? baseRowHeight),
    0,
  );
  const newest = calendarDay(today, rightmostDay);
  const oldest = calendarDay(today, rightmostDay + visibleDays - 1);
  const sameMonth =
    newest.getMonth() === oldest.getMonth() &&
    newest.getFullYear() === oldest.getFullYear();
  const month = sameMonth
    ? newest.toLocaleDateString(undefined, { month: 'long' })
    : `${oldest.toLocaleDateString(undefined, { month: 'short' })} – ${newest.toLocaleDateString(undefined, { month: 'short' })}`;
  const year =
    oldest.getFullYear() === newest.getFullYear()
      ? String(newest.getFullYear())
      : `${oldest.getFullYear()} – ${newest.getFullYear()}`;

  function revealFuture() {
    stopSync();
    setRightmostDay(-futureCount - Math.min(visibleDays, FUTURE_BATCH));
    setFutureCount((count) => count + FUTURE_BATCH);
  }

  const { header, body, stopSync, pull, headerScroll, bodyScroll } =
    useGridScroll({
      columnWidth,
      visibleDays,
      dayCount,
      futureCount,
      onSettle: setRightmostDay,
      onReveal: revealFuture,
    });
  const pullHintStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, pull.value / 20),
  }));
  const pullLabelStyle = useAnimatedStyle(() => ({
    opacity: pull.value < FUTURE_PULL_DISTANCE ? 1 : 0,
  }));
  const releaseLabelStyle = useAnimatedStyle(() => ({
    opacity: pull.value >= FUTURE_PULL_DISTANCE ? 1 : 0,
  }));
  const pullProgressStyle = useAnimatedStyle(() => ({
    width: 80 * Math.min(1, pull.value / FUTURE_PULL_DISTANCE),
  }));

  function returnToToday() {
    stopSync();
    setRightmostDay(0);
    if (futureCount) setFutureCount(0);
    else {
      body.current?.scrollToOffset({ offset: 0, animated: false });
      header.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }

  function openDateActions() {
    Alert.alert(
      'Browse dates',
      'Pull past the newest day and release to reveal future dates.',
      [
        { text: 'Show future dates', onPress: revealFuture },
        { text: 'Return to today', onPress: returnToToday },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  }

  const shared = {
    data: days,
    horizontal: true,
    inverted: true,
    bounces: true,
    alwaysBounceHorizontal: true,
    overScrollMode: 'auto' as const,
    showsHorizontalScrollIndicator: false,
    directionalLockEnabled: true,
    nestedScrollEnabled: true,
    snapToInterval: columnWidth,
    decelerationRate: 'fast' as const,
    scrollEventThrottle: 16,
    initialNumToRender: Math.max(6, visibleDays + 2),
    maxToRenderPerBatch: Math.max(12, visibleDays + 2),
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
      onLayout={(event) => {
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth !== width) {
          stopSync();
          setWidth(nextWidth);
          setDayCount((count) => Math.max(count, rightmostDay + 90));
        }
      }}
    >
      <View style={styles.toolbar}>
        <HeadingComponent style={styles.brand}>ONPURPOSE</HeadingComponent>
        <Animated.View
          pointerEvents="none"
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[styles.pullHint, pullHintStyle]}
        >
          <Animated.Text
            style={[styles.pullText, styles.overlaidPullText, pullLabelStyle]}
          >
            Pull for future dates
          </Animated.Text>
          <Animated.Text style={[styles.pullText, releaseLabelStyle]}>
            Release for future dates
          </Animated.Text>
          <View style={styles.pullTrack}>
            <Animated.View style={[styles.pullProgress, pullProgressStyle]} />
          </View>
        </Animated.View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Return to today"
          accessibilityElementsHidden={atTodayBoundary}
          importantForAccessibility={
            atTodayBoundary ? 'no-hide-descendants' : 'auto'
          }
          disabled={atTodayBoundary}
          onPress={returnToToday}
          style={({ pressed }) => [
            styles.todayButton,
            { opacity: atTodayBoundary ? 0 : pressed ? 0.65 : 1 },
          ]}
        >
          <Text style={styles.todayText}>
            {rightmostDay < 0 ? '← Today' : 'Today →'}
          </Text>
        </Pressable>
      </View>
      {width > 0 && (
        <>
          <View style={styles.header}>
            <Pressable
              style={[styles.namesHeader, { width: nameWidth }]}
              accessibilityRole="button"
              accessibilityLabel={`${month} ${year}, browse dates`}
              onPress={openDateActions}
            >
              <Text style={styles.month}>{month} ⌄</Text>
              <Text style={styles.year}>{year}</Text>
            </Pressable>
            <DateColumns
              {...shared}
              ref={header}
              key={`header-${columnWidth}-${futureCount}`}
              initialScrollIndex={rightmostDay + futureCount}
              style={{ width: dateWidth, flexGrow: 0 }}
              onScroll={headerScroll}
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
                        borderBottomColor: `${habit.color}20`,
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
              <DateColumns
                {...shared}
                ref={body}
                key={`body-${columnWidth}-${futureCount}`}
                initialScrollIndex={rightmostDay + futureCount}
                style={{ width: dateWidth, height: gridHeight, flexGrow: 0 }}
                onScroll={bodyScroll}
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
                              borderBottomColor: `${habit.color}20`,
                              backgroundColor: pressed
                                ? `${habit.color}20`
                                : day.daysAgo === 0
                                  ? '#090909'
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
                                  opacity: value === undefined ? 0.65 : 1,
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
                                    : `${habit.color}AA`,
                                  backgroundColor: checked
                                    ? habit.color
                                    : 'transparent',
                                },
                              ]}
                            >
                              {checked && (
                                <Text
                                  allowFontScaling={false}
                                  style={[
                                    styles.checkmark,
                                    { color: checkmarkColor(habit.color) },
                                  ]}
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
});

// Each width gets a fresh pair of lists, anchored to the same logical date.
// Freeze the initial index: later history loading must not trigger another jump.
function DateColumns({
  initialScrollIndex,
  ...props
}: Omit<FlatListProps<GridDay>, 'CellRendererComponent'> & {
  ref: Ref<FlatList<GridDay>>;
}) {
  const [initialIndex] = useState(initialScrollIndex);
  return <Animated.FlatList {...props} initialScrollIndex={initialIndex} />;
}

const styles = StyleSheet.create({
  pullHint: {
    position: 'absolute',
    right: 0,
    top: 5,
    alignItems: 'flex-end',
    backgroundColor: '#000000',
    zIndex: 1,
    paddingVertical: 4,
  },
  pullText: { color: '#BBBBBB', fontSize: 11 },
  overlaidPullText: { position: 'absolute', top: 4, right: 0 },
  pullTrack: {
    width: 80,
    height: 2,
    marginTop: 7,
    backgroundColor: '#252525',
    overflow: 'hidden',
    borderRadius: 1,
  },
  pullProgress: { height: 2, backgroundColor: '#DADADA' },
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: 8,
  },
  brand: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.5,
    paddingVertical: 12,
  },
  month: {
    color: '#E8E8E8',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  year: {
    color: '#929292',
    fontSize: 11,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  todayButton: {
    minHeight: 44,
    justifyContent: 'center',
    paddingLeft: 16,
    paddingRight: 4,
  },
  todayText: { color: '#DADADA', fontSize: 13, fontWeight: '500' },
  header: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#363636',
  },
  namesHeader: {
    justifyContent: 'center',
    paddingRight: 10,
    paddingVertical: 8,
  },
  dayHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    minHeight: 56,
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
    backgroundColor: '#090909',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  todayLabel: { color: '#FFFFFF' },
  rows: { flex: 1 },
  rowsContent: { paddingBottom: 8 },
  gridBody: { flexDirection: 'row', alignItems: 'flex-start' },
  habit: {
    justifyContent: 'center',
    paddingRight: 12,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  habitName: { fontSize: 15, lineHeight: 20, fontWeight: '500' },
  unit: { fontSize: 11, lineHeight: 13, marginTop: 2, opacity: 0.8 },
  cell: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
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
