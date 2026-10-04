import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import type { Habit } from './habits';
import { isNumericHabit } from './habits';
import { Icon } from './Icon';
import { appear, disappear, rowTransition } from './motion';
export function ArchivedHabits({
  habits,
  values,
  editable,
  pending,
  error,
  onRestore,
  onRetry,
}: {
  habits: Habit[];
  values: Record<string, number>;
  editable: boolean;
  pending: number;
  error: string | null;
  onRestore: (habit: Habit) => void;
  onRetry: () => void;
}) {
  const archived = habits.filter((habit) => habit.archived);
  return (
    <ScrollView contentContainerStyle={styles.body}>
      <Text style={styles.description}>
        Your records stay here. Restore a habit to return it to its place in the
        grid.
      </Text>
      <Text accessibilityLiveRegion="polite" style={styles.status}>
        {error ?? (pending ? 'Saving changes…' : 'Saved on this device')}
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
      {archived.map((habit) => {
        const count = Object.keys(values).filter((key) =>
          key.startsWith(`${habit.id}:`),
        ).length;
        return (
          <Animated.View
            key={habit.id}
            entering={appear}
            exiting={disappear}
            layout={rowTransition}
            style={styles.row}
          >
            <View style={[styles.dot, { backgroundColor: habit.color }]} />
            <View style={{ flex: 1, gap: 5 }}>
              <Text style={[styles.name, { color: habit.color }]}>
                {habit.name}
              </Text>
              <Text style={styles.description}>
                {isNumericHabit(habit)
                  ? (habit.unit ?? 'Daily total')
                  : 'Checkbox'}{' '}
                · {count} recorded {count === 1 ? 'day' : 'days'}
              </Text>
            </View>
            <Pressable
              disabled={!editable}
              accessibilityRole="button"
              accessibilityLabel={`Restore ${habit.name}`}
              accessibilityState={{ disabled: !editable }}
              onPress={() => onRestore(habit)}
              style={[styles.restore, { opacity: editable ? 1 : 0.4 }]}
            >
              <Text style={styles.restoreText}>Restore</Text>
            </Pressable>
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#242424',
  },
  dot: { width: 6, height: 28, borderRadius: 3 },
  name: { color: '#DDDDDD', fontSize: 17, fontWeight: '500' },
  restore: {
    minHeight: 44,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#1B1B1B',
    justifyContent: 'center',
  },
  restoreText: { color: '#D8D8D8', fontSize: 13, fontWeight: '600' },
  empty: {
    alignItems: 'center',
    gap: 16,
    paddingTop: 64,
    paddingHorizontal: 20,
  },
});
