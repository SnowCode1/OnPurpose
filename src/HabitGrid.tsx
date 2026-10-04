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
import { isNumericHabit, type Habit } from './habits';
import { HabitName, type HabitAction } from './HabitName';
import { habitRowPositions } from './habitOrdering';
import { ReorderRow, type RowMotion } from './ReorderRow';
import { useHabitReorder } from './useHabitReorder';
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
import { appear, disappear, rowTransition, menuAppear } from './motion';

type Props = {
  sampleData?: boolean;
  HeadingComponent: ComponentType<TextProps>;
  DateButtonComponent: ComponentType<PressableProps>;
  today: string;
  habits: Habit[];
  values: Record<string, number>;
  onHabitPress: (habit: Habit) => void;
  onHabitAction: (habit: Habit, action: HabitAction) => void;
  onReorder: (ids: string[]) => boolean;
  editable: boolean;
  onCellPress: (habit: Habit, day: GridDay) => void;
  onHistoryPress: () => void;
  onSettingsPress: () => void;
  onAddHabit: () => void;
};

function dayMuting(daysAgo: number): number {
  if (daysAgo < 0) return 1;
  const progress = Math.max(0, Math.min(1, (daysAgo - 4) / 4));
  // Gentle start/end as the fade starts on day 5 and finishes on day 8.
  return progress * progress * (3 - 2 * progress);
}

export const HabitGrid = memo(function HabitGrid({
  sampleData = false,
  HeadingComponent,
  DateButtonComponent,
  today,
  habits: sourceHabits,
  values,
  onHabitPress,
  onHabitAction,
  onReorder,
  editable,
  onCellPress,
  onHistoryPress,
  onSettingsPress,
  onAddHabit,
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
  const baseRowHeight = Math.max(52, Math.ceil(48 * fontScale));
  const {
    root: reorderRoot,
    scroll: reorderScroll,
    viewport: reorderViewport,
    bounds: reorderBounds,
    updateOffset: updateVerticalOffset,
    measure: measureReorder,
    menu: habitMenu,
    setMenu: setHabitMenu,
    mode: reorderMode,
    setMode: setReorderMode,
    rowTops,
    dragId,
    dragY,
    bodyTop,
    scrollOffset,
    cancel: cancelReorder,
    beginOrMove: moveReorder,
    drop: dropReorder,
    hold: holdHabit,
  } = useHabitReorder(sourceHabits, rowHeights, baseRowHeight, onReorder);
  // Keep sibling order stable during preview swaps; only animated Y targets move.
  const habits = sourceHabits;
  const menuHabit = sourceHabits.find((habit) => habit.id === habitMenu?.id);
  const [menuHeight, setMenuHeight] = useState(250);
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
      habits.filter(isNumericHabit).map((habit) => habit.id),
    );
    const activeIds = new Set(habits.map((habit) => habit.id));
    const recorded = new Set<string>();
    for (const [key, value] of Object.entries(values)) {
      const separator = key.lastIndexOf(':');
      if (!activeIds.has(key.slice(0, separator))) continue;
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
  const { tops, total: gridHeight } = habitRowPositions(
    habits.map((habit) => habit.id),
    rowHeights,
    baseRowHeight,
  );
  const rowMotion: Record<string, RowMotion> = {};
  for (const habit of habits) {
    rowMotion[habit.id] = {
      id: habit.id,
      rowTops,
      active: dragId === habit.id,
      top: tops[habit.id] ?? 0,
      dragY,
      bodyTop,
      scrollOffset,
    };
  }
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
    scrollToToday,
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
    scrollToToday(() => {
      setRightmostDay(0);
      if (futureCount) {
        setFutureCount(0);
        setRangeReset((reset) => reset + 1);
      }
    });
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
      collapsable={false}
      ref={reorderRoot}
      style={styles.container}
      onLayout={(event) => {
        measureReorder();
        const nextWidth = event.nativeEvent.layout.width;
        if (nextWidth !== width) {
          cancelReorder();
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
      <View
        accessibilityElementsHidden={!!habitMenu}
        importantForAccessibility={habitMenu ? 'no-hide-descendants' : 'auto'}
        style={styles.toolbar}
      >
        <View style={styles.toolbarBrand}>
          <HeadingComponent accessibilityRole="header" style={styles.brand}>
            {sampleData ? 'SAMPLE DATA' : 'ONPURPOSE'}
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
      {reorderMode && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: '#999999', fontSize: 12, flex: 1 }}>
            Drag a habit to arrange your list
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              cancelReorder();
              setReorderMode(false);
            }}
            style={{ minHeight: 44, padding: 12 }}
          >
            <Text style={{ color: '#DDDDDD' }}>Done</Text>
          </Pressable>
        </View>
      )}
      {width > 0 && (
        <>
          <View
            accessibilityElementsHidden={!!habitMenu}
            importantForAccessibility={
              habitMenu ? 'no-hide-descendants' : 'auto'
            }
            style={styles.header}
          >
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
          <View
            accessibilityElementsHidden={!!habitMenu}
            importantForAccessibility={
              habitMenu ? 'no-hide-descendants' : 'auto'
            }
            collapsable={false}
            ref={reorderViewport}
            onLayout={measureReorder}
            style={{ flex: 1 }}
          >
            <ScrollView
              ref={reorderScroll}
              onLayout={measureReorder}
              onScroll={(event) => {
                updateVerticalOffset(event.nativeEvent.contentOffset.y);
              }}
              scrollEventThrottle={16}
              scrollEnabled={!habitMenu && !dragId}
              style={styles.rows}
              directionalLockEnabled
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.rowsContent}
            >
              {!habits.length && (
                <View
                  style={{ paddingVertical: 60, alignItems: 'center', gap: 16 }}
                >
                  <Text style={{ color: '#888888', fontSize: 14 }}>
                    A little space for your next intention.
                  </Text>
                </View>
              )}
              <View style={styles.gridBody}>
                <View style={{ width: nameWidth, height: gridHeight }}>
                  {habits.map((habit) => (
                    <HabitName
                      key={habit.id}
                      habit={habit}
                      height={baseRowHeight}
                      selected={habitMenu?.id === habit.id}
                      motion={rowMotion[habit.id]}
                      reorder={reorderMode}
                      disabled={!editable}
                      onPress={() => {
                        if (habitMenu) setHabitMenu(null);
                        else onHabitPress(habit);
                      }}
                      onHold={(anchor) => holdHabit(habit.id, anchor)}
                      onDrag={(pageY, startY) =>
                        moveReorder(habit.id, pageY, startY)
                      }
                      onDrop={dropReorder}
                      onCancel={cancelReorder}
                      onAction={(action) => {
                        if (action === 'reorder') setReorderMode(true);
                        else onHabitAction(habit, action);
                      }}
                      onLayout={(event) => {
                        const height = event.nativeEvent.layout.height;
                        setRowHeights((previous) =>
                          previous[habit.id] === height
                            ? previous
                            : { ...previous, [habit.id]: height },
                        );
                      }}
                    />
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
                    <View style={{ width: columnWidth, height: gridHeight }}>
                      {habits.map((habit) => {
                        const value = values[`${habit.id}:${day.key}`];
                        const checked = value === 1;
                        const recorded = isNumericHabit(habit)
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
                          <ReorderRow
                            key={habit.id}
                            motion={rowMotion[habit.id]}
                          >
                            <Pressable
                              testID={`cell-${habit.id}-${day.key}`}
                              disabled={!editable || !!dragId || reorderMode}
                              accessibilityRole={
                                isNumericHabit(habit) ? 'button' : 'checkbox'
                              }
                              accessibilityState={
                                isNumericHabit(habit) ? undefined : { checked }
                              }
                              accessibilityLabel={`${habit.name}, ${day.fullLabel}${isNumericHabit(habit) ? `, ${value === undefined ? 'not recorded' : `${value}${habit.unit ? ` ${habit.unit}` : ''}`}` : ''}`}
                              accessibilityHint={
                                isNumericHabit(habit)
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
                              {isNumericHabit(habit) ? (
                                <Text
                                  numberOfLines={1}
                                  adjustsFontSizeToFit
                                  minimumFontScale={0.65}
                                  style={[
                                    styles.numeric,
                                    {
                                      color: recorded
                                        ? habit.color
                                        : emptyNumber,
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
                          </ReorderRow>
                        );
                      })}
                    </View>
                  )}
                />
              </View>
              <Animated.View layout={rowTransition}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Add habit"
                  accessibilityState={{
                    disabled: !editable || reorderMode || !!dragId,
                  }}
                  disabled={!editable || reorderMode || !!dragId}
                  onPress={onAddHabit}
                  style={({ pressed }) => ({
                    minHeight: 52,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 10,
                    paddingVertical: 12,
                    opacity:
                      !editable || reorderMode || dragId
                        ? 0.3
                        : pressed
                          ? 0.5
                          : 1,
                  })}
                >
                  <Icon name="plus" size={18} color="#777777" />
                  <Text style={{ color: '#888888', fontSize: 14 }}>
                    Add habit
                  </Text>
                </Pressable>
              </Animated.View>
            </ScrollView>
          </View>
        </>
      )}
      {habitMenu && menuHabit && (
        <Animated.View
          entering={appear}
          exiting={disappear}
          pointerEvents="box-none"
          style={StyleSheet.absoluteFill}
          accessibilityViewIsModal
        >
          {/* Leave the selected name reachable: a second hold can start a drag,
              and the original held touch is never covered by a new hit target. */}
          {[
            {
              top: 0,
              left: 0,
              right: 0,
              height: Math.max(0, habitMenu.anchor.y - reorderBounds.rootY),
            },
            {
              top: Math.max(
                0,
                habitMenu.anchor.y -
                  reorderBounds.rootY +
                  habitMenu.anchor.height,
              ),
              left: 0,
              right: 0,
              bottom: 0,
            },
            {
              top: Math.max(0, habitMenu.anchor.y - reorderBounds.rootY),
              left: nameWidth,
              right: 0,
              height: habitMenu.anchor.height,
            },
          ].map((frame, index) => (
            <Pressable
              key={index}
              accessible={index === 0}
              accessibilityRole="button"
              accessibilityLabel="Dismiss habit actions"
              onPress={() => setHabitMenu(null)}
              style={[{ position: 'absolute' }, frame]}
            />
          ))}
          <Animated.View
            entering={menuAppear}
            onLayout={(event) => setMenuHeight(event.nativeEvent.layout.height)}
            style={{
              position: 'absolute',
              left: Math.max(0, Math.min(nameWidth - 12, width - 224)),
              top: Math.max(
                52,
                Math.min(
                  habitMenu.anchor.y -
                    reorderBounds.rootY +
                    habitMenu.anchor.height +
                    4,
                  reorderBounds.rootHeight - menuHeight - 8,
                ),
              ),
              width: 224,
              maxHeight: '85%',
              borderRadius: 17,
              backgroundColor: '#191919',
              borderWidth: 1,
              borderColor: '#333333',
              shadowColor: '#000000',
              shadowOpacity: 0.5,
              shadowRadius: 16,
              elevation: 10,
              overflow: 'hidden',
            }}
          >
            <ScrollView>
              <Text
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 14,
                  paddingBottom: 8,
                  color: menuHabit.color,
                  fontSize: 13,
                  fontWeight: '600',
                }}
              >
                {menuHabit.name}
              </Text>
              {(
                [
                  ['colour', 'Colour', 'palette'],
                  ['edit', 'Edit habit', 'edit'],
                  ['reorder', 'Reorder', 'reorder'],
                  ['archive', 'Archive', 'archive'],
                ] as const
              ).map(([action, label, icon]) => (
                <Pressable
                  key={action}
                  accessibilityRole="button"
                  onPress={() => {
                    setHabitMenu(null);
                    if (action === 'reorder') setReorderMode(true);
                    else onHabitAction(menuHabit, action);
                  }}
                  style={({ pressed }) => ({
                    minHeight: 46,
                    paddingHorizontal: 16,
                    paddingVertical: 11,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    backgroundColor: pressed ? '#292929' : 'transparent',
                  })}
                >
                  <Icon name={icon} size={18} />
                  <Text style={{ color: '#DDDDDD', fontSize: 15, flex: 1 }}>
                    {label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </Animated.View>
        </Animated.View>
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
