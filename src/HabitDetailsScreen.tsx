import { memo, useState, type ComponentType } from 'react';
import { Pressable, StyleSheet, View, type TextProps } from 'react-native';
import { Text } from './Typography';
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
  onCellPress,
  editable,
}: {
  habit: Habit;
  weekStart: WeekStart;
  values: Record<string, number>;
  events: StoredEvent[];
  today: string;
  Heading: ComponentType<TextProps>;
  onBack: () => void;
  onDescriptionEdit: () => void;
  onDescriptionVersions?: () => void;
  onEdit: () => void;
  onCellPress: (habit: Habit, day: EntryDay) => void;
  editable: boolean;
}) {
  const [tab, setTab] = useState<'notes' | 'statistics'>(
    habit.description ? 'notes' : 'statistics',
  );
  const [visited, setVisited] = useState({
    notes: !!habit.description,
    statistics: !habit.description,
  });
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
      <View style={styles.tabFrame}>
        <View accessibilityRole="tablist" style={styles.tabs}>
          {(['notes', 'statistics'] as const).map((value) => (
            <Pressable
              key={value}
              accessibilityRole="tab"
              accessibilityLabel={value === 'notes' ? 'Notes' : 'Statistics'}
              accessibilityState={{ selected: tab === value }}
              aria-selected={tab === value}
              onPress={() => {
                setTab(value);
                setVisited((previous) =>
                  previous[value] ? previous : { ...previous, [value]: true },
                );
              }}
              style={[
                styles.tab,
                tab === value && {
                  backgroundColor: colorOnBlack(habit.color, 0.12),
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: tab === value ? accent : '#929292' },
                ]}
              >
                {value === 'notes' ? 'Notes' : 'Statistics'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        {visited.notes && (
          <View
            testID="habit-notes-panel"
            style={[
              StyleSheet.absoluteFill,
              { opacity: tab === 'notes' ? 1 : 0 },
            ]}
            pointerEvents={tab === 'notes' ? 'auto' : 'none'}
            accessibilityElementsHidden={tab !== 'notes'}
            aria-hidden={tab !== 'notes'}
            importantForAccessibility={
              tab === 'notes' ? 'auto' : 'no-hide-descendants'
            }
          >
            <DescriptionReader
              description={habit.description}
              colour={habit.color}
              editable={editable}
              onEdit={onDescriptionEdit}
              onVersions={onDescriptionVersions}
            />
          </View>
        )}
        {visited.statistics && (
          <View
            testID="habit-statistics-panel"
            style={[
              StyleSheet.absoluteFill,
              { opacity: tab === 'statistics' ? 1 : 0 },
            ]}
            pointerEvents={tab === 'statistics' ? 'auto' : 'none'}
            accessibilityElementsHidden={tab !== 'statistics'}
            aria-hidden={tab !== 'statistics'}
            importantForAccessibility={
              tab === 'statistics' ? 'auto' : 'no-hide-descendants'
            }
          >
            <HabitStatsScreen
              habit={habit}
              weekStart={weekStart}
              values={values}
              events={events}
              today={today}
              editable={editable}
              onCellPress={onCellPress}
            />
          </View>
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
  tabFrame: {
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  tabs: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 12,
    backgroundColor: '#141414',
  },
  tab: {
    flex: 1,
    minHeight: 44,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
  },
  tabText: { fontSize: 14, fontWeight: '600' },
});
