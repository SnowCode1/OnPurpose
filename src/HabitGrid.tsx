import type {
  CheckboxStyle,
  WeekStart,
  ColumnSpacing,
} from './displayPreferences';
import { Text, useAppWindowDimensions } from './Typography';
import { completedHabitsSelection } from './storage/selection';
import { visibleHabitRows } from './habitCompletion';
import { gridRowHeight, type RowSpacing } from './rowSpacing';
import {
  type ComponentType,
  type Ref,
  memo,
  useCallback,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
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
  View,
} from 'react-native';
import { type GridDay, createGridDayCache, calendarDay } from './calendar';
import type { Habit } from './habits';
import { HabitName, type HabitAction } from './HabitName';
import { habitRowPositions, moveHabit } from './habitOrdering';
import type { RowMotion } from './ReorderRow';
import { useHabitReorder } from './useHabitReorder';
import { createGridPalette } from './gridAppearance';
import { GridDateColumn, GridDateHeading } from './GridCells';
import { GridDateBackdrop, GridLoadingBackdrop } from './GridLoadingBackdrop';
import { gridRenderBudget } from './gridLoading';
import type { ChangeStore } from './storage/store';
import { recordPerformance } from './performance';
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
  rowSpacing: RowSpacing;
  checkboxStyle: CheckboxStyle;
  weekStart: WeekStart;
  columnSpacing: ColumnSpacing;
  dateFading: boolean;
  hideCompleted: boolean;
  sampleData?: boolean;
  HeadingComponent: ComponentType<TextProps>;
  DateButtonComponent: ComponentType<PressableProps>;
  today: string;
  habits: Habit[];
  store: ChangeStore;
  onHabitPress: (habit: Habit) => void;
  onHabitAction: (habit: Habit, action: HabitAction) => void;
  onReorder: (ids: string[]) => boolean;
  editable: boolean;
  onCellPress: (habit: Habit, day: GridDay) => void;
  onHistoryPress: () => void;
  onSettingsPress: () => void;
  onAddHabit: () => void;
};

export const HabitGrid = memo(function HabitGrid({
  rowSpacing,
  checkboxStyle,
  weekStart,
  columnSpacing,
  dateFading,
  hideCompleted,
  sampleData = false,
  HeadingComponent,
  DateButtonComponent,
  today,
  habits: sourceHabits,
  store,
  onHabitPress,
  onHabitAction,
  onReorder,
  editable,
  onCellPress,
  onHistoryPress,
  onSettingsPress,
  onAddHabit,
}: Props) {
  recordPerformance('grid.container.render');
  const { fontScale } = useAppWindowDimensions();
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
  const [completionView, setCompletionView] = useState({
    enabled: hideCompleted,
    show: false,
  });
  if (completionView.enabled !== hideCompleted)
    setCompletionView({ enabled: hideCompleted, show: false });
  const showCompleted =
    completionView.enabled === hideCompleted && completionView.show;
  const completionSelection = useMemo(
    () => completedHabitsSelection(store, sourceHabits, today, hideCompleted),
    [store, sourceHabits, today, hideCompleted],
  );
  const completed = useSyncExternalStore(
    completionSelection.subscribe,
    completionSelection.getSnapshot,
  );
  const completedCount = [...completed].filter((value) => value === '1').length;
  const habits = useMemo(
    () =>
      visibleHabitRows(
        sourceHabits,
        completed,
        hideCompleted,
        showCompleted,
        rightmostDay,
      ),
    [sourceHabits, completed, hideCompleted, showCompleted, rightmostDay],
  );
  const [rowHeights, setRowHeights] = useState<Record<string, number>>({});
  const baseRowHeight = gridRowHeight(rowSpacing, fontScale);
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
  } = useHabitReorder(habits, rowHeights, baseRowHeight, onReorder);
  // Keep sibling order stable during preview swaps; only animated Y targets move.
  const menuHabit = sourceHabits.find((habit) => habit.id === habitMenu?.id);
  const [menuHeight, setMenuHeight] = useState(250);
  const dateCache = useMemo(() => createGridDayCache(today), [today]);
  const days = useMemo(
    () => dateCache(dayCount, futureCount),
    [dateCache, dayCount, futureCount],
  );
  const palettes = useMemo(
    () =>
      Object.fromEntries(
        habits.map((habit) => [
          habit.id,
          createGridPalette(habit.color, dateFading),
        ]),
      ),
    [habits, dateFading],
  );
  const { visibleDays, nameWidth, dateWidth, columnWidth } = gridLayout(
    width,
    fontScale,
    columnSpacing,
  );
  const { tops, total: gridHeight } = useMemo(
    () =>
      habitRowPositions(
        habits.map((habit) => habit.id),
        rowHeights,
        baseRowHeight,
      ),
    [habits, rowHeights, baseRowHeight],
  );
  const rowMotion = useMemo(
    () =>
      Object.fromEntries(
        habits.map((habit) => [
          habit.id,
          {
            id: habit.id,
            rowTops,
            active: dragId === habit.id,
            top: tops[habit.id] ?? 0,
            dragY,
            bodyTop,
            scrollOffset,
          } satisfies RowMotion,
        ]),
      ),
    [habits, rowTops, dragId, tops, dragY, bodyTop, scrollOffset],
  );
  const renderHeading = useCallback(
    ({ item: day }: { item: GridDay }) => (
      <GridDateHeading
        weekStart={weekStart}
        dateFading={dateFading}
        store={store}
        habits={sourceHabits}
        day={day}
        width={columnWidth}
      />
    ),
    [store, sourceHabits, columnWidth, dateFading, weekStart],
  );
  const cellsDisabled = !editable || !!dragId || reorderMode;
  const renderColumn = useCallback(
    ({ item: day }: { item: GridDay }) => (
      <GridDateColumn
        store={store}
        habits={habits}
        day={day}
        palettes={palettes}
        motions={rowMotion}
        heights={rowHeights}
        checkboxStyle={checkboxStyle}
        weekStart={weekStart}
        baseHeight={baseRowHeight}
        fontScale={fontScale}
        width={columnWidth}
        height={gridHeight}
        disabled={cellsDisabled}
        onPress={onCellPress}
      />
    ),
    [
      store,
      habits,
      palettes,
      rowMotion,
      rowHeights,
      baseRowHeight,
      checkboxStyle,
      weekStart,
      fontScale,
      columnWidth,
      gridHeight,
      cellsDisabled,
      onCellPress,
    ],
  );
  function actOnHabit(habit: Habit, action: HabitAction) {
    if (action === 'moveUp' || action === 'moveDown') {
      const ids = habits.map((row) => row.id);
      if (
        onReorder(
          moveHabit(
            ids,
            habit.id,
            ids.indexOf(habit.id) + (action === 'moveUp' ? -1 : 1),
          ),
        )
      )
        feedback('selection');
    } else onHabitAction(habit, action);
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
    offset,
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

  const renderBudget = gridRenderBudget(visibleDays);
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
    maxToRenderPerBatch: renderBudget.bodyBatch,
    updateCellsBatchingPeriod: renderBudget.batchPeriod,
    windowSize: renderBudget.bodyWindow,
    removeClippedSubviews: false,
    keyExtractor: (day: GridDay) => day.key,
    maintainVisibleContentPosition: { minIndexForVisible: 0 },
    getItemLayout: (_: unknown, index: number) => ({
      length: columnWidth,
      offset: columnWidth * index,
      index,
    }),
    // Both lists may request the same expansion; use this rendered boundary once.
    onEndReached: () => setDayCount((count) => Math.max(count, dayCount + 90)),
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
            <View
              style={{ width: dateWidth, minHeight: 56, overflow: 'hidden' }}
            >
              <GridDateBackdrop
                weekStart={weekStart}
                dateFading={dateFading}
                days={days}
                width={columnWidth}
                offset={offset}
              />
              <DateColumns
                {...shared}
                maxToRenderPerBatch={renderBudget.headerBatch}
                windowSize={renderBudget.headerWindow}
                ref={header}
                key={`header-${columnWidth}-${rangeReset}`}
                initialScrollIndex={rightmostDay + futureCount}
                style={{ width: dateWidth, flex: 1 }}
                onScroll={headerScroll}
                onContentSizeChange={(contentWidth) =>
                  revealWhenReady('header', contentWidth)
                }
                renderItem={renderHeading}
              />
            </View>
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
                  style={{ paddingVertical: 24, alignItems: 'center', gap: 16 }}
                >
                  <Text style={{ color: '#888888', fontSize: 14 }}>
                    {sourceHabits.length
                      ? 'Completed habits are hidden.'
                      : 'No habits yet.'}
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
                        else actOnHabit(habit, action);
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
                <View
                  style={{
                    width: dateWidth,
                    height: gridHeight,
                    overflow: 'hidden',
                  }}
                >
                  <GridLoadingBackdrop
                    habits={habits}
                    motions={rowMotion}
                    heights={rowHeights}
                    baseHeight={baseRowHeight}
                    columnWidth={columnWidth}
                    viewportWidth={dateWidth}
                    maximumOffset={Math.max(
                      0,
                      days.length * columnWidth - dateWidth,
                    )}
                    offset={offset}
                  />
                  <DateColumns
                    {...shared}
                    ref={body}
                    key={`body-${columnWidth}-${rangeReset}`}
                    initialScrollIndex={rightmostDay + futureCount}
                    style={{
                      width: dateWidth,
                      height: gridHeight,
                      flexGrow: 0,
                    }}
                    onScroll={bodyScroll}
                    onContentSizeChange={(contentWidth) =>
                      revealWhenReady('body', contentWidth)
                    }
                    renderItem={renderColumn}
                  />
                </View>
              </View>
              {hideCompleted && completedCount > 0 && rightmostDay === 0 && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={
                    showCompleted
                      ? 'Hide completed habits'
                      : `Show ${completedCount} completed habits`
                  }
                  disabled={!!dragId || reorderMode}
                  onPress={() =>
                    setCompletionView((value) => ({
                      enabled: hideCompleted,
                      show: !value.show,
                    }))
                  }
                  style={{
                    minHeight: 48,
                    justifyContent: 'center',
                    paddingVertical: 12,
                  }}
                >
                  <Text style={{ color: '#AAAAAA', fontSize: 14 }}>
                    {showCompleted
                      ? 'Hide completed'
                      : `Show completed · ${completedCount}`}
                  </Text>
                </Pressable>
              )}
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
                    else actOnHabit(menuHabit, action);
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
  rows: { flex: 1 },
  rowsContent: { paddingBottom: 8 },
  gridBody: { flexDirection: 'row', alignItems: 'flex-start' },
});
