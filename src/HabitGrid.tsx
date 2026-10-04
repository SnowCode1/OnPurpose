import {
  type ComponentType,
  type Ref,
  memo,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  FlatList,
  type FlatListProps,
  type TextProps,
  Alert,
  Pressable,
  type PressableProps,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { type GridDay, makeGridDays, calendarDay } from './calendar';
import { type Habit } from './habits';
import { checkmarkColor, colorOnBlack, dimmedColor } from './colors';
import { gridLayout } from './gridLayout';
import Animated, {
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useGridScroll } from './useGridScroll';
import {
  FUTURE_BATCH,
  FUTURE_PULL_DISTANCE,
  futureRevealDay,
} from './gridNavigation';
import { feedback } from './haptics';
import { Icon } from './Icon';

type Props = {
  HeadingComponent: ComponentType<TextProps>;
  DateButtonComponent: ComponentType<PressableProps>;
  today: string;
  habits: Habit[];
  values: Record<string, number>;
  onHabitPress: (habit: Habit) => void;
  onCellPress: (habit: Habit, day: GridDay) => void;
  onHistoryPress: () => void;
  onSettingsPress: () => void;
};

function dayMuting(daysAgo: number): number {
  if (daysAgo < 0) return 1;
  const progress = Math.max(0, Math.min(1, (daysAgo - 4) / 4));
  // Gentle start/end as the fade starts on day 5 and finishes on day 8.
  return progress * progress * (3 - 2 * progress);
}

export const HabitGrid = memo(function HabitGrid({
  HeadingComponent,
  DateButtonComponent,
  today,
  habits,
  values,
  onHabitPress,
  onCellPress,
  onHistoryPress,
  onSettingsPress,
}: Props) {
  const { fontScale } = useWindowDimensions();
  const [width, setWidth] = useState(0);
  const [dayCount, setDayCount] = useState(90);
  const [futureCount, setFutureCount] = useState(0);
  const [rangeReset, setRangeReset] = useState(0);
  const pendingReveal = useRef<{
    futureCount: number;
    day: number;
    headerReady: boolean;
    bodyReady: boolean;
  } | null>(null);
  const [rightmostDay, setRightmostDay] = useState(0);
  const atTodayBoundary = rightmostDay === 0 && futureCount === 0;
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const days = useMemo(
    () => makeGridDays(today, dayCount, futureCount),
    [today, dayCount, futureCount],
  );
  const rowTones = useMemo(
    () =>
      Object.fromEntries(
        habits.map((habit) => [
          habit.id,
          {
            checkbox: colorOnBlack(habit.color, 170 / 255),
            number: colorOnBlack(habit.color, 0.65),
          },
        ]),
      ),
    [habits],
  );
  const recordedDays = useMemo(() => {
    const numericIds = new Set(
      habits.filter((habit) => habit.unit).map((habit) => habit.id),
    );
    const recorded = new Set<string>();
    for (const [key, value] of Object.entries(values)) {
      const separator = key.lastIndexOf(':');
      if (value === 1 || numericIds.has(key.slice(0, separator))) {
        recorded.add(key.slice(separator + 1));
      }
    }
    return recorded;
  }, [habits, values]);
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

  function revealFuture(offset?: number) {
    if (pendingReveal.current) return;
    stopSync();
    pendingReveal.current = {
      futureCount: futureCount + FUTURE_BATCH,
      day: futureRevealDay(offset ?? -columnWidth, columnWidth, futureCount),
      headerReady: false,
      bodyReady: false,
    };
    setFutureCount(futureCount + FUTURE_BATCH);
    // The pull already ticks at its threshold. Explicit menu access gets a tick.
    if (offset === undefined) feedback('selection');
  }

  const {
    header,
    body,
    stopSync,
    continueReveal,
    pull,
    headerScroll,
    bodyScroll,
  } = useGridScroll({
    columnWidth,
    visibleDays,
    dayCount,
    futureCount,
    onSettle: setRightmostDay,
    onReveal: revealFuture,
  });

  function revealWhenReady(list: 'header' | 'body', contentWidth: number) {
    const pending = pendingReveal.current;
    if (!pending) return;
    const expectedWidth = (dayCount + pending.futureCount) * columnWidth;
    if (contentWidth < expectedWidth - 1) return;
    if (list === 'header') pending.headerReady = true;
    else pending.bodyReady = true;
    if (!pending.headerReady || !pending.bodyReady) return;
    pendingReveal.current = null;
    setRightmostDay(pending.day);
    // Native anchoring preserves the visible dates as new columns are inserted.
    // Only after both lists have that content do we smoothly settle the pull.
    continueReveal((pending.futureCount + pending.day) * columnWidth);
  }
  const streakDistance = useSharedValue(0);
  const streakOpacity = useSharedValue(0);
  useAnimatedReaction(
    () => pull.value,
    (distance) => {
      if (distance > 0) {
        streakDistance.set(distance);
        streakOpacity.set(1);
      } else {
        // Keep the last geometry during the fade, avoiding a jump on release.
        streakOpacity.set(withTiming(0, { duration: 180 }));
      }
    },
  );
  const pullStreakStyle = useAnimatedStyle(() => {
    const progress = Math.min(1, streakDistance.value / FUTURE_PULL_DISTANCE);
    return {
      width: dateWidth * progress,
      opacity: streakOpacity.value * Math.min(1, streakDistance.value / 16),
    };
  });

  function returnToToday() {
    if (!atTodayBoundary) feedback('selection');
    stopSync();
    pendingReveal.current = null;
    setRightmostDay(0);
    if (futureCount) {
      setFutureCount(0);
      setRangeReset((reset) => reset + 1);
    } else {
      body.current?.scrollToOffset({ offset: 0, animated: false });
      header.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }

  function openDateActions() {
    feedback('selection');
    Alert.alert(
      'Browse dates',
      'Pull past the newest day and release to reveal future dates.',
      [
        { text: 'Show future dates', onPress: () => revealFuture() },
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
    maintainVisibleContentPosition: { minIndexForVisible: 0 },
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
          if (pendingReveal.current) {
            setRightmostDay(pendingReveal.current.day);
            pendingReveal.current = null;
          }
          setWidth(nextWidth);
          setDayCount((count) => Math.max(count, rightmostDay + 90));
        }
      }}
    >
      <View style={styles.toolbar}>
        <View style={styles.toolbarBrand}>
          <HeadingComponent accessibilityRole="header" style={styles.brand}>
            ONPURPOSE
          </HeadingComponent>
        </View>
        <View style={styles.toolbarCentre}>
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
              { opacity: atTodayBoundary ? 0 : pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={styles.todayText}>
              {rightmostDay < 0 ? '← Today' : 'Today →'}
            </Text>
          </Pressable>
        </View>
        <View style={styles.toolbarActions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="History"
            accessibilityHint="Opens change history"
            onPress={onHistoryPress}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: pressed ? '#171717' : 'transparent' },
            ]}
          >
            <Icon name="history" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Settings"
            onPress={onSettingsPress}
            style={({ pressed }) => [
              styles.iconButton,
              { backgroundColor: pressed ? '#171717' : 'transparent' },
            ]}
          >
            <Icon name="settings" />
          </Pressable>
        </View>
      </View>
      {width > 0 && (
        <>
          <View style={styles.header}>
            <Animated.View
              pointerEvents="none"
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={[styles.pullStreak, pullStreakStyle]}
            >
              <LinearGradient
                colors={['#8A8A8A00', '#8A8A8A']}
                locations={[0, 1]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.streakGradient}
              />
            </Animated.View>
            <View style={[styles.namesHeader, { width: nameWidth }]}>
              <DateButtonComponent
                style={styles.dateButton}
                accessibilityRole="button"
                accessibilityLabel={`${month} ${year}, browse dates`}
                onPress={openDateActions}
              >
                <Text style={styles.dateTitle}>{month} ⌄</Text>
                <Text style={styles.dateYear}>{year}</Text>
              </DateButtonComponent>
            </View>
            <DateColumns
              {...shared}
              ref={header}
              key={`header-${columnWidth}-${rangeReset}`}
              initialScrollIndex={rightmostDay + futureCount}
              style={{ width: dateWidth, flexGrow: 0 }}
              onScroll={headerScroll}
              onContentSizeChange={(contentWidth) =>
                revealWhenReady('header', contentWidth)
              }
              renderItem={({ item: day }) => {
                const amount = recordedDays.has(day.key)
                  ? 0
                  : dayMuting(day.daysAgo);
                return (
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
                        {
                          color: dimmedColor(
                            day.daysAgo === 0 ? '#FFFFFF' : '#979797',
                            amount,
                            0.56,
                          ),
                        },
                      ]}
                    >
                      {day.label}
                    </Text>
                    <Text
                      style={[
                        styles.dayNumber,
                        { color: dimmedColor('#E8E8E8', amount, 0.56) },
                      ]}
                    >
                      {day.number}
                    </Text>
                  </View>
                );
              }}
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
                key={`body-${columnWidth}-${rangeReset}`}
                initialScrollIndex={rightmostDay + futureCount}
                style={{ width: dateWidth, height: gridHeight, flexGrow: 0 }}
                onScroll={bodyScroll}
                onContentSizeChange={(contentWidth) =>
                  revealWhenReady('body', contentWidth)
                }
                renderItem={({ item: day }) => (
                  <View style={{ width: columnWidth }}>
                    {habits.map((habit) => {
                      const value = values[`${habit.id}:${day.key}`];
                      const checked = value === 1;
                      const recorded = habit.unit
                        ? value !== undefined
                        : checked;
                      const amount = dayMuting(day.daysAgo);
                      const emptyNumber = dimmedColor(
                        rowTones[habit.id].number,
                        amount,
                      );
                      const emptyCheckbox = dimmedColor(
                        rowTones[habit.id].checkbox,
                        amount,
                      );
                      const ruleColor = dimmedColor(habit.color, amount);
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
                              borderBottomColor: `${ruleColor}20`,
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
                                  color: recorded ? habit.color : emptyNumber,
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
                                    : emptyCheckbox,
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
  pullStreak: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    height: 1,
    zIndex: 2,
  },
  streakGradient: { width: '100%', height: '100%' },
  container: { flex: 1 },
  toolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
    marginBottom: 4,
  },
  toolbarBrand: { flex: 1, justifyContent: 'center' },
  toolbarCentre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  brand: {
    color: '#888888',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    paddingVertical: 12,
  },
  dateButton: {
    minHeight: 56,
    width: '100%',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  dateTitle: {
    color: '#E2E2E2',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.3,
  },
  dateYear: {
    color: '#858585',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  toolbarActions: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 2,
  },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  todayButton: {
    minHeight: 44,
    maxWidth: '100%',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#121212',
  },
  todayText: {
    color: '#C8C8C8',
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  header: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#363636',
  },
  namesHeader: {
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingRight: 10,
    minHeight: 56,
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
