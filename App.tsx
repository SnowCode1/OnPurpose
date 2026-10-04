import { StatusBar } from 'expo-status-bar';
import { type ComponentType, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextProps,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { type GridDay, localDateKey } from './src/calendar';
import { HabitGrid } from './src/HabitGrid';
import { demoHabits, habitColors, type Habit } from './src/habits';
import { useLocalToday } from './src/useLocalToday';

// Metro removes this branch (and its module) from release JavaScript.
const PreviewHeading: ComponentType<TextProps> =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_PREVIEW === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- Keep native capture out of release JS.
      require('./src/dev/DevPreviewText').DevPreviewText
    : Text;

export default function App() {
  const today = useLocalToday();
  const [habits, setHabits] = useState(demoHabits);
  const [values, setValues] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<{
    key: string;
    habit: Habit;
    day: GridDay;
  } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = habits.find((habit) => habit.id === detailId);
  const [input, setInput] = useState('');
  const trimmed = input.trim().replace(',', '.');
  const numeric = Number(trimmed);
  const valid =
    trimmed === '' ||
    (/^\d+(\.\d*)?$/.test(trimmed) && Number.isFinite(numeric));
  const accent = editing?.habit.color ?? detail?.color ?? '#FFFFFF';

  function pressCell(habit: Habit, day: GridDay) {
    if (day.key > localDateKey(new Date())) return;
    const key = `${habit.id}:${day.key}`;
    if (habit.unit) {
      setInput(values[key] === undefined ? '' : String(values[key]));
      setEditing({ key, habit, day });
    } else {
      setValues((previous) => ({
        ...previous,
        [key]: previous[key] === 1 ? 0 : 1,
      }));
    }
  }

  function saveNumber() {
    if (!editing || !valid || editing.day.key > localDateKey(new Date()))
      return;
    setValues((previous) => {
      const next = { ...previous };
      if (trimmed === '') delete next[editing.key];
      else next[editing.key] = numeric;
      return next;
    });
    setEditing(null);
  }

  function closeDialog() {
    setEditing(null);
    setDetailId(null);
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.content}>
          <PreviewHeading style={styles.brand}>ONPURPOSE</PreviewHeading>
          <HabitGrid
            key={today}
            today={today}
            habits={habits}
            values={values}
            onHabitPress={(habit) => setDetailId(habit.id)}
            onCellPress={pressCell}
          />
          <Text style={styles.footer}>
            Demo · entries and colours reset on reload
          </Text>
        </View>
        <Modal
          visible={editing !== null || detail !== undefined}
          animationType="fade"
          transparent
          onRequestClose={closeDialog}
        >
          <KeyboardAvoidingView
            style={styles.overlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View accessibilityViewIsModal style={styles.dialog}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.eyebrow}>
                  {editing ? 'DAILY TOTAL' : 'HABIT DETAILS'}
                </Text>
                <PreviewHeading style={[styles.dialogTitle, { color: accent }]}>
                  {editing?.habit.name ?? detail?.name}
                </PreviewHeading>
                {editing ? (
                  <>
                    <Text style={styles.secondary}>
                      {editing.day.fullLabel}
                    </Text>
                    <View style={styles.inputRow}>
                      <TextInput
                        autoFocus
                        keyboardType="decimal-pad"
                        accessibilityLabel={`Daily total in ${editing.habit.unit}`}
                        value={input}
                        onChangeText={setInput}
                        onSubmitEditing={saveNumber}
                        selectionColor={accent}
                        placeholder="0"
                        placeholderTextColor="#555555"
                        style={[
                          styles.input,
                          { color: accent, borderColor: `${accent}66` },
                        ]}
                      />
                      <Text style={[styles.inputUnit, { color: accent }]}>
                        {editing.habit.unit}
                      </Text>
                    </View>
                    <Text style={styles.secondary}>
                      {valid
                        ? 'Leave blank to clear this entry.'
                        : 'Enter a number of zero or more.'}
                    </Text>
                    <View style={styles.actions}>
                      <Pressable
                        accessibilityRole="button"
                        onPress={closeDialog}
                        style={styles.action}
                      >
                        <Text style={styles.actionText}>Cancel</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        accessibilityState={{ disabled: !valid }}
                        disabled={!valid}
                        onPress={saveNumber}
                        style={[
                          styles.action,
                          styles.primaryAction,
                          { backgroundColor: accent, opacity: valid ? 1 : 0.4 },
                        ]}
                      >
                        <Text style={styles.primaryActionText}>Save total</Text>
                      </Pressable>
                    </View>
                  </>
                ) : detail ? (
                  <>
                    <Text style={styles.secondary}>
                      Statistics and streaks are coming next.
                    </Text>
                    <Text style={styles.sectionLabel}>ROW COLOUR</Text>
                    <View style={styles.swatches}>
                      {habitColors.map((color) => (
                        <Pressable
                          key={color.value}
                          accessibilityRole="radio"
                          accessibilityLabel={color.name}
                          accessibilityState={{
                            selected: detail.color === color.value,
                          }}
                          onPress={() =>
                            setHabits((previous) =>
                              previous.map((habit) =>
                                habit.id === detail.id
                                  ? { ...habit, color: color.value }
                                  : habit,
                              ),
                            )
                          }
                          style={styles.swatchTarget}
                        >
                          <View
                            style={[
                              styles.swatch,
                              { backgroundColor: color.value },
                            ]}
                          >
                            {detail.color === color.value && (
                              <Text
                                allowFontScaling={false}
                                style={styles.swatchCheck}
                              >
                                ✓
                              </Text>
                            )}
                          </View>
                        </Pressable>
                      ))}
                    </View>
                    <Text style={styles.secondary}>
                      Used for this habit’s name, checkboxes and numbers.
                    </Text>
                    <Pressable
                      accessibilityRole="button"
                      onPress={closeDialog}
                      style={[
                        styles.action,
                        styles.doneAction,
                        { borderColor: `${accent}66` },
                      ]}
                    >
                      <Text style={{ color: accent, fontWeight: '600' }}>
                        Done
                      </Text>
                    </Pressable>
                  </>
                ) : null}
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    alignSelf: 'center',
    paddingHorizontal: 18,
  },
  brand: {
    color: '#A0A0A0',
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 2.5,
    paddingTop: 12,
    paddingBottom: 18,
  },
  footer: {
    color: '#777777',
    fontSize: 10,
    textAlign: 'center',
    paddingVertical: 10,
  },
  overlay: {
    flex: 1,
    backgroundColor: '#000000BB',
    justifyContent: 'center',
    padding: 24,
  },
  dialog: {
    backgroundColor: '#101010',
    borderColor: '#2A2A2A',
    borderWidth: 1,
    padding: 24,
    borderRadius: 24,
    width: '100%',
    maxWidth: 420,
    maxHeight: '90%',
    alignSelf: 'center',
  },
  eyebrow: {
    color: '#929292',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  dialogTitle: { fontSize: 26, fontWeight: '600', marginBottom: 12 },
  secondary: { color: '#A1A1A1', fontSize: 13, lineHeight: 20 },
  inputRow: { marginVertical: 20 },
  input: { borderWidth: 1, borderRadius: 14, fontSize: 36, padding: 16 },
  inputUnit: { fontSize: 12, marginTop: 8 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 24,
  },
  action: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  actionText: { color: '#D0D0D0' },
  primaryAction: { borderRadius: 14 },
  primaryActionText: { color: '#000000', fontWeight: '600' },
  sectionLabel: {
    color: '#929292',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginTop: 28,
    marginBottom: 10,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginBottom: 12,
  },
  swatchTarget: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchCheck: { color: '#000000', fontSize: 20, fontWeight: '700' },
  doneAction: { borderWidth: 1, borderRadius: 14, marginTop: 24 },
});
