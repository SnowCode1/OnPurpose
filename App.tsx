import { StatusBar } from 'expo-status-bar';
import { type ComponentType, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextProps,
  useColorScheme,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

// Metro removes this branch (and its module) from release JavaScript.
const PreviewHeading: ComponentType<TextProps> =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_PREVIEW === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- Keep native capture out of release JS.
      require('./src/dev/DevPreviewText').DevPreviewText
    : Text;

type Habit = { id: string; name: string; unit?: string };
const habits: Habit[] = [
  { id: 'walk', name: 'Go for a walk' },
  { id: 'read', name: 'Read', unit: 'minutes' },
  { id: 'water', name: 'Drink water', unit: 'glasses' },
  { id: 'stretch', name: 'Stretch' },
  { id: 'journal', name: 'Write a little' },
  { id: 'outside', name: 'Get outside' },
  { id: 'meditate', name: 'Meditate' },
  { id: 'cook', name: 'Cook a meal' },
  { id: 'tidy', name: 'Tidy up' },
  { id: 'connect', name: 'Call someone' },
  { id: 'learn', name: 'Learn something' },
  { id: 'sleep', name: 'Wind down' },
];

// Disposable interaction study: dates are captured at launch; no records are saved.
function makeDays() {
  return [2, 1, 0].map((offset) => {
    const date = new Date();
    date.setDate(date.getDate() - offset);
    return {
      key: `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`,
      label:
        offset === 0
          ? 'Today'
          : date.toLocaleDateString(undefined, { weekday: 'short' }),
      number: date.getDate(),
      fullLabel: date.toLocaleDateString(),
    };
  });
}

export default function App() {
  const dark = useColorScheme() === 'dark';
  const colors = dark
    ? {
        background: '#141A17',
        text: '#F2F5EE',
        muted: '#AAB8AD',
        line: '#34463A',
        accent: '#A8D8B8',
        selected: '#294333',
      }
    : {
        background: '#F7F8F2',
        text: '#20372B',
        muted: '#5F7065',
        line: '#CBD6CB',
        accent: '#315F43',
        selected: '#DDEBDC',
      };
  const [days] = useState(makeDays);
  const [values, setValues] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<{
    key: string;
    habit: Habit;
    date: string;
  } | null>(null);
  const [detail, setDetail] = useState<Habit | null>(null);
  const [input, setInput] = useState('');
  const trimmed = input.trim().replace(',', '.');
  const numeric = Number(trimmed);
  const valid =
    trimmed === '' ||
    (/^\d+(\.\d*)?$/.test(trimmed) && Number.isFinite(numeric));

  function saveNumber() {
    if (!editing || !valid) return;
    setValues((previous) => {
      const next = { ...previous };
      if (trimmed === '') delete next[editing.key];
      else next[editing.key] = numeric;
      return next;
    });
    setEditing(null);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[styles.screen, { backgroundColor: colors.background }]}
      >
        <StatusBar style={dark ? 'light' : 'dark'} />
        <View style={styles.content}>
          <View style={styles.heading}>
            <PreviewHeading style={[styles.eyebrow, { color: colors.muted }]}>
              ONPURPOSE · INTERACTION STUDY
            </PreviewHeading>
            <Text style={[styles.title, { color: colors.text }]}>
              A little, every day.
            </Text>
          </View>
          <View
            style={[
              styles.row,
              styles.columnHead,
              { borderColor: colors.line },
            ]}
          >
            <Text style={[styles.habitName, { color: colors.muted }]}>
              Your habits
            </Text>
            {days.map((day) => (
              <View key={day.key} style={styles.dayCell}>
                <Text style={[styles.dayLabel, { color: colors.muted }]}>
                  {day.label}
                </Text>
                <Text style={[styles.dayNumber, { color: colors.text }]}>
                  {day.number}
                </Text>
              </View>
            ))}
          </View>
          <ScrollView
            style={styles.list}
            contentContainerStyle={styles.listContent}
          >
            {habits.map((habit) => (
              <View
                key={habit.id}
                style={[styles.row, { borderColor: colors.line }]}
              >
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${habit.name}, habit details`}
                  onPress={() => setDetail(habit)}
                  style={({ pressed }) => [
                    styles.habitName,
                    styles.nameButton,
                    { opacity: pressed ? 0.6 : 1 },
                  ]}
                >
                  <Text style={[styles.name, { color: colors.text }]}>
                    {habit.name}
                  </Text>
                  {habit.unit && (
                    <Text style={[styles.unit, { color: colors.muted }]}>
                      {habit.unit}
                    </Text>
                  )}
                </Pressable>
                {days.map((day) => {
                  const key = `${habit.id}:${day.key}`;
                  const value = values[key];
                  const checked = value === 1;
                  return (
                    <Pressable
                      key={day.key}
                      testID={`cell-${key}`}
                      accessibilityRole={habit.unit ? 'button' : 'checkbox'}
                      accessibilityState={habit.unit ? undefined : { checked }}
                      accessibilityLabel={`${habit.name}, ${day.fullLabel}${habit.unit ? `, ${value === undefined ? 'not recorded' : `${value} ${habit.unit}`}` : ''}`}
                      accessibilityHint={
                        habit.unit
                          ? 'Opens daily total entry'
                          : 'Toggles completion'
                      }
                      onPress={() => {
                        if (habit.unit) {
                          setInput(value === undefined ? '' : String(value));
                          setEditing({ key, habit, date: day.fullLabel });
                        } else {
                          setValues((previous) => ({
                            ...previous,
                            [key]: previous[key] === 1 ? 0 : 1,
                          }));
                        }
                      }}
                      style={({ pressed }) => [
                        styles.dayCell,
                        styles.checkCell,
                        {
                          backgroundColor:
                            pressed ||
                            (habit.unit ? value !== undefined : checked)
                              ? colors.selected
                              : 'transparent',
                        },
                      ]}
                    >
                      <Text style={[styles.value, { color: colors.accent }]}>
                        {habit.unit
                          ? value === undefined
                            ? '—'
                            : String(value)
                          : checked
                            ? '✓'
                            : '○'}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            ))}
          </ScrollView>
          <Text style={[styles.footer, { color: colors.muted }]}>
            Demo only · changes are not saved
          </Text>
        </View>
        <Modal
          visible={editing !== null || detail !== null}
          animationType="fade"
          transparent
          onRequestClose={() => {
            setEditing(null);
            setDetail(null);
          }}
        >
          <View style={styles.overlay}>
            <View
              accessibilityViewIsModal
              style={[styles.dialog, { backgroundColor: colors.background }]}
            >
              <PreviewHeading
                style={[styles.dialogTitle, { color: colors.text }]}
              >
                {editing?.habit.name ?? detail?.name}
              </PreviewHeading>
              {editing ? (
                <>
                  <Text style={{ color: colors.muted }}>
                    {editing.date} · {editing.habit.unit}
                  </Text>
                  <TextInput
                    autoFocus
                    keyboardType="decimal-pad"
                    accessibilityLabel={`Daily total in ${editing.habit.unit}`}
                    value={input}
                    onChangeText={setInput}
                    onSubmitEditing={saveNumber}
                    style={[
                      styles.input,
                      { color: colors.text, borderColor: colors.line },
                    ]}
                  />
                  <Text style={{ color: colors.muted }}>
                    {valid
                      ? 'Leave blank to clear this entry.'
                      : 'Enter a number of zero or more.'}
                  </Text>
                  <View style={styles.actions}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => setEditing(null)}
                      style={styles.action}
                    >
                      <Text style={{ color: colors.text }}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !valid }}
                      disabled={!valid}
                      onPress={saveNumber}
                      style={[styles.action, { opacity: valid ? 1 : 0.4 }]}
                    >
                      <Text style={{ color: colors.accent }}>Save</Text>
                    </Pressable>
                  </View>
                </>
              ) : (
                <>
                  <Text style={[styles.detailText, { color: colors.muted }]}>
                    This is where this habit’s statistics and streaks will live.
                    They are not built yet.
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => setDetail(null)}
                    style={styles.action}
                  >
                    <Text style={{ color: colors.accent }}>Back to habits</Text>
                  </Pressable>
                </>
              )}
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 16,
  },
  heading: { paddingTop: 16, paddingBottom: 18 },
  eyebrow: { fontSize: 10, fontWeight: '600', letterSpacing: 1.2 },
  title: { fontSize: 28, fontWeight: '600', marginTop: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderBottomWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
  },
  columnHead: { paddingBottom: 8, alignItems: 'center' },
  habitName: { flex: 1, paddingRight: 8 },
  nameButton: { justifyContent: 'center', paddingVertical: 10, minHeight: 52 },
  name: { fontSize: 15, fontWeight: '500' },
  unit: { fontSize: 11, marginTop: 2 },
  dayCell: { width: 56, alignItems: 'center', justifyContent: 'center' },
  dayLabel: { fontSize: 11 },
  dayNumber: { fontSize: 16, marginTop: 3, fontWeight: '600' },
  checkCell: { minHeight: 52, borderRadius: 8, paddingVertical: 8 },
  value: { fontSize: 21, fontWeight: '500', fontVariant: ['tabular-nums'] },
  list: { flex: 1 },
  listContent: { paddingBottom: 12 },
  footer: { fontSize: 11, textAlign: 'center', paddingVertical: 10 },
  overlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    padding: 24,
    borderRadius: 20,
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  dialogTitle: { fontSize: 24, fontWeight: '600', marginBottom: 12 },
  detailText: { fontSize: 16, lineHeight: 24 },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    fontSize: 28,
    padding: 12,
    marginVertical: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginTop: 12,
  },
  action: {
    minHeight: 48,
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
});
