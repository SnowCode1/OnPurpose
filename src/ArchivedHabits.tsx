import { useMemo } from 'react';
import {
  archivedHabitDetails,
  archivedRecordRange,
} from './archivedHabitDetails';
import { descriptionExcerpt } from './descriptionReading';
import type { EntryValues } from './entries';
import { Text } from './Typography';
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import Animated from 'react-native-reanimated';
import type { Habit } from './habits';
import { habitTypeLabel } from './habits';
import { Icon } from './Icon';
import { HabitSymbol } from './HabitSymbol';
import { appear, disappear, rowTransition } from './motion';
import { useSheetScroll } from './SheetModal';
export function confirmArchivedHabitDeletion(
  habit: Habit,
  count: number,
  onDelete: (habit: Habit) => void,
) {
  const title = `Delete “${habit.name}”?`;
  const message = `This will remove the habit, its notes and ${count} recorded ${count === 1 ? 'day' : 'days'}. You can undo this in History. Earlier changes remain in backups.`;
  if (Platform.OS === 'web') {
    if (globalThis.confirm(`${title}\n\n${message}`)) onDelete(habit);
    return;
  }
  Alert.alert(
    title,
    message,
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete habit',
        style: 'destructive',
        onPress: () => onDelete(habit),
      },
    ],
    { cancelable: true },
  );
}

export function ArchivedHabits({
  sampleData = false,
  habits,
  values,
  editable,
  pending,
  error,
  onRestore,
  onDelete,
  onRetry,
}: {
  sampleData?: boolean;
  habits: Habit[];
  values: EntryValues;
  editable: boolean;
  pending: number;
  error: string | null;
  onRestore: (habit: Habit) => void;
  onDelete: (habit: Habit) => void;
  onRetry: () => void;
}) {
  const archived = useMemo(
    () => archivedHabitDetails(habits, values),
    [habits, values],
  );
  const excerpts = useMemo(
    () =>
      new Map(
        habits
          .filter((habit) => habit.archived && habit.description)
          .map((habit) => [habit.id, descriptionExcerpt(habit.description!)]),
      ),
    [habits],
  );
  const sheetScroll = useSheetScroll();
  return (
    <ScrollView contentContainerStyle={styles.body} {...sheetScroll}>
      <Text style={styles.description}>
        Restore a habit to return it to its place in the grid. Deleting removes
        it and its records; you can undo this in History.
      </Text>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {error ??
          (pending
            ? 'Saving changes…'
            : sampleData
              ? 'Sample · temporary'
              : 'Saved on this device')}
      </Text>
      {!!error && (
        <Pressable
          accessibilityRole="button"
          onPress={onRetry}
          style={styles.restore}
        >
          <Text style={styles.restoreText}>Retry saving</Text>
        </Pressable>
      )}
      {archived.map(({ habit, count, firstDate, lastDate }) => {
        return (
          <Animated.View
            key={habit.id}
            entering={appear}
            exiting={disappear}
            layout={rowTransition}
            style={styles.row}
          >
            <View style={styles.rowHeading}>
              <View style={styles.symbol}>
                {habit.icon ? (
                  <HabitSymbol icon={habit.icon} colour={habit.color} />
                ) : (
                  <View
                    style={[styles.dot, { backgroundColor: habit.color }]}
                  />
                )}
              </View>
              <Text style={[styles.name, { color: habit.color, flex: 1 }]}>
                {habit.name}
              </Text>
            </View>
            <View style={styles.details}>
              <Text style={styles.description}>
                {habitTypeLabel(habit)}
                {habit.unit ? ` · ${habit.unit}` : ''} · {count} recorded{' '}
                {count === 1 ? 'day' : 'days'}
              </Text>
              {firstDate && lastDate && (
                <Text style={styles.dateRange}>
                  {archivedRecordRange(firstDate, lastDate)}
                </Text>
              )}
              {!!excerpts.get(habit.id) && (
                <Text
                  numberOfLines={2}
                  ellipsizeMode="tail"
                  style={styles.note}
                >
                  {excerpts.get(habit.id)}
                </Text>
              )}
            </View>
            <View style={styles.actions}>
              <Pressable
                disabled={!editable}
                accessibilityRole="button"
                accessibilityLabel={`Restore ${habit.name}`}
                accessibilityState={{ disabled: !editable }}
                onPress={() => onRestore(habit)}
                style={[styles.action, { opacity: editable ? 1 : 0.4 }]}
              >
                <Text style={styles.restoreText}>Restore</Text>
              </Pressable>
              <Pressable
                disabled={!editable}
                accessibilityRole="button"
                accessibilityLabel={`Delete ${habit.name}`}
                accessibilityHint="Asks for confirmation before deleting this habit and its records."
                accessibilityState={{ disabled: !editable }}
                onPress={() =>
                  confirmArchivedHabitDeletion(habit, count, onDelete)
                }
                style={[styles.action, { opacity: editable ? 1 : 0.4 }]}
              >
                <Text style={styles.deleteText}>Delete</Text>
              </Pressable>
            </View>
          </Animated.View>
        );
      })}
      {!archived.length && (
        <Animated.View entering={appear} style={styles.empty}>
          <Icon name="archive" size={34} />
          <Text style={styles.name}>No archived habits</Text>
          <Text style={[styles.description, { textAlign: 'center' }]}>
            Hold a habit’s name on the grid and choose Archive when you want to
            put it aside.
          </Text>
        </Animated.View>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  body: { padding: 24, paddingTop: 12, gap: 16, flexGrow: 1 },
  description: { color: '#909090', fontSize: 13, lineHeight: 20 },
  status: { color: '#777777', fontSize: 12 },
  row: {
    gap: 10,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#242424',
  },
  rowHeading: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  symbol: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
  details: { marginLeft: 34, gap: 5 },
  dateRange: { color: '#777777', fontSize: 12, lineHeight: 18 },
  note: { color: '#B2B2B2', fontSize: 13, lineHeight: 20, marginTop: 3 },
  name: { color: '#DDDDDD', fontSize: 17, fontWeight: '500' },
  restore: {
    minHeight: 44,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1B1B1B',
    justifyContent: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
  action: {
    flexGrow: 1,
    flexBasis: 120,
    minHeight: 44,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1B1B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: { color: '#FF9C9C', fontSize: 13, fontWeight: '600' },
  restoreText: { color: '#D8D8D8', fontSize: 13, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 64,
    paddingHorizontal: 20,
  },
});
