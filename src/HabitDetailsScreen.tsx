import { RecordStatsScreen } from './RecordStatsScreen';
import type { EntryValues } from './entries';
import { memo, useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, View, type TextProps } from 'react-native';
import { Text, useAppWindowDimensions } from './Typography';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useHabitPages } from './useHabitPages';
import { DescriptionReader } from './DescriptionReader';
import { HabitStatsScreen } from './HabitStatsScreen';
import { HabitSymbol } from './HabitSymbol';
import { Icon } from './Icon';
import { colorOnBlack, contrastOnBlack } from './colors';
import type { Habit } from './habits';
import type { WeekStart } from './displayPreferences';
import type { StoredEvent } from './storage/model';
import type { EntryDay } from './calendar';

export const HabitDetailsScreen = memo(function HabitDetailsScreen({
  habit,
  weekStart,
  values,
  events,
  today,
  Heading,
  onBack,
  onDescriptionEdit,
  onDescriptionVersions,
  onEdit,
  onGoalEdit,
  onCellPress,
  editable,
}: {
  habit: Habit;
  weekStart: WeekStart;
  values: EntryValues;
  events: StoredEvent[];
  today: string;
  Heading: ComponentType<TextProps>;
  onBack: () => void;
  onDescriptionEdit: () => void;
  onDescriptionVersions?: () => void;
  onEdit: () => void;
  onGoalEdit: () => void;
  onCellPress: (habit: Habit, day: EntryDay) => void;
  editable: boolean;
}) {
  const StatsContent =
    habit.type === 'categorical' || habit.type === 'text'
      ? RecordStatsScreen
      : HabitStatsScreen;
  const [width, setWidth] = useState(0);
  const [islandHeight, setIslandHeight] = useState(54);
  const { fontScale } = useAppWindowDimensions();
  const pages = useHabitPages(!!habit.description, width);
  const { tab, visited, offset, pageWidth } = pages;
  const islandWidth = Math.min(
    Math.max(0, width - 32),
    Math.round(248 * Math.max(1, fontScale)),
  );
  const islandInset = 4 + StyleSheet.hairlineWidth;
  const segmentWidth = Math.max(0, (islandWidth - 2 * islandInset) / 2);
  const selectionStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateX:
          pageWidth.get() > 0
            ? Math.max(0, Math.min(1, offset.get() / pageWidth.get())) *
              segmentWidth
            : 0,
      },
    ],
  }));
  const bottomInset = islandHeight + 40;
  const accent = contrastOnBlack(habit.color) >= 4.5 ? habit.color : '#DADADA';
  return (
    <View style={styles.screen} accessibilityViewIsModal>
      <View style={styles.header}>
        <Pressable
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="Close habit details and return to habit grid"
          style={styles.nav}
        >
          <Text style={styles.navText}>Close</Text>
        </Pressable>
        <View style={styles.title}>
          <HabitSymbol icon={habit.icon} colour={habit.color} size={20} />
          <Heading
            accessibilityRole="header"
            numberOfLines={1}
            style={[styles.name, { color: accent }]}
          >
            {habit.name}
          </Heading>
        </View>
        <Pressable
          onPress={tab === 'notes' ? onDescriptionEdit : onEdit}
          disabled={!editable}
          accessibilityRole="button"
          accessibilityLabel={
            tab === 'notes' ? 'Edit description' : `Edit ${habit.name}`
          }
          accessibilityState={{ disabled: !editable }}
          style={[
            styles.nav,
            { alignItems: 'flex-end', opacity: editable ? 1 : 0.35 },
          ]}
        >
          {tab === 'notes' ? (
            <Text style={styles.navText}>Edit</Text>
          ) : (
            <Icon name="edit" />
          )}
        </Pressable>
      </View>
      <View
        style={{ flex: 1 }}
        onLayout={(event) => {
          const next = event.nativeEvent.layout.width;
          setWidth((previous) => (previous === next ? previous : next));
        }}
      >
        {width > 0 && (
          <>
            <Animated.ScrollView
              testID="habit-pager"
              ref={pages.pager}
              horizontal
              pagingEnabled
              directionalLockEnabled
              bounces={false}
              alwaysBounceVertical={false}
              alwaysBounceHorizontal={false}
              showsHorizontalScrollIndicator={false}
              contentInsetAdjustmentBehavior="never"
              contentContainerStyle={{ height: '100%' }}
              scrollEventThrottle={16}
              onScroll={pages.onScroll}
              onScrollBeginDrag={pages.prepare}
              onContentSizeChange={pages.align}
            >
              <View
                testID="habit-notes-panel"
                style={{ width, height: '100%' }}
                pointerEvents={tab === 'notes' ? 'auto' : 'none'}
                accessibilityElementsHidden={tab !== 'notes'}
                aria-hidden={tab !== 'notes'}
                importantForAccessibility={
                  tab === 'notes' ? 'auto' : 'no-hide-descendants'
                }
              >
                {visited.notes && (
                  <DescriptionReader
                    description={habit.description}
                    colour={habit.color}
                    editable={editable}
                    onEdit={onDescriptionEdit}
                    onVersions={onDescriptionVersions}
                    bottomInset={bottomInset}
                  />
                )}
              </View>
              <View
                testID="habit-statistics-panel"
                style={{ width, height: '100%' }}
                pointerEvents={tab === 'statistics' ? 'auto' : 'none'}
                accessibilityElementsHidden={tab !== 'statistics'}
                aria-hidden={tab !== 'statistics'}
                importantForAccessibility={
                  tab === 'statistics' ? 'auto' : 'no-hide-descendants'
                }
              >
                {visited.statistics && (
                  <StatsContent
                    habit={habit}
                    weekStart={weekStart}
                    values={values}
                    events={events}
                    today={today}
                    editable={editable}
                    onCellPress={onCellPress}
                    onGoalEdit={onGoalEdit}
                    bottomInset={bottomInset}
                  />
                )}
              </View>
            </Animated.ScrollView>
            <LinearGradient
              colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.85)', '#000000']}
              locations={[0, 0.72, 1]}
              style={[styles.fade, { height: islandHeight + 48 }]}
              pointerEvents="none"
              accessible={false}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              aria-hidden
            />
            <View style={styles.tabFrame} pointerEvents="box-none">
              <View
                accessibilityRole="tablist"
                accessibilityLabel="Habit views"
                style={[styles.tabs, { width: islandWidth }]}
                onLayout={(event) => {
                  // Native events are pooled; deferred updates retain only the value.
                  const height = event.nativeEvent.layout.height;
                  setIslandHeight((previous) =>
                    previous === height ? previous : height,
                  );
                }}
              >
                <Animated.View
                  pointerEvents="none"
                  accessible={false}
                  style={[
                    styles.selection,
                    {
                      width: segmentWidth,
                      left: islandInset,
                      top: islandInset,
                      bottom: islandInset,
                      backgroundColor: colorOnBlack(habit.color, 0.16),
                    },
                    selectionStyle,
                  ]}
                />
                {(['notes', 'statistics'] as const).map((value) => (
                  <Pressable
                    key={value}
                    accessibilityRole="tab"
                    accessibilityLabel={
                      value === 'notes' ? 'Notes' : 'Statistics'
                    }
                    accessibilityState={{ selected: tab === value }}
                    aria-selected={tab === value}
                    onPress={() => pages.select(value)}
                    style={styles.tab}
                  >
                    <Text
                      style={[
                        styles.tabText,
                        { color: tab === value ? accent : '#A0A0A0' },
                      ]}
                    >
                      {value === 'notes' ? 'Notes' : 'Statistics'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </>
        )}
      </View>
    </View>
  );
});
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    minHeight: 56,
    gap: 8,
  },
  nav: { minHeight: 44, minWidth: 60, justifyContent: 'center' },
  navText: { color: '#BBBBBB', fontSize: 15 },
  title: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  name: { fontSize: 16, fontWeight: '600', flexShrink: 1 },
  fade: { position: 'absolute', left: 0, right: 0, bottom: 0 },
  tabFrame: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 12,
    alignItems: 'center',
  },
  tabs: {
    flexDirection: 'row',
    padding: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#363636',
    borderRadius: 18,
    backgroundColor: '#181818',
    shadowColor: '#000000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  selection: {
    position: 'absolute',
    left: 5,
    top: 5,
    bottom: 5,
    borderRadius: 13,
  },
  tab: {
    flex: 1,
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
  },
  tabText: { fontSize: 14, fontWeight: '600', textAlign: 'center' },
});
