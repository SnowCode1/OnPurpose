import { StatusBar } from 'expo-status-bar';
import { type ComponentType, useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  type PressableProps,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  type TextProps,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { type GridDay } from './src/calendar';
import { HabitGrid } from './src/HabitGrid';
import { type Habit } from './src/habits';
import { ColourPicker } from './src/ColourPicker';
import { checkmarkColor } from './src/colors';
import { useLocalToday } from './src/useLocalToday';
import { feedback, setHapticsEnabled } from './src/haptics';
import { AppPanel } from './src/AppPanel';
import { usePersistentStore, useStoreOpening } from './src/usePersistentStore';
import type { ChangeStore } from './src/storage/store';
import { shareBackup, chooseBackup } from './src/storage/backups';

// Metro removes this branch (and its module) from release JavaScript.
const PreviewHeading: ComponentType<TextProps> =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_PREVIEW === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- Keep native capture out of release JS.
      require('./src/dev/DevPreviewText').DevPreviewText
    : Text;

const PreviewDateButton: ComponentType<PressableProps> =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_PREVIEW === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- Keep native capture out of release JS.
      require('./src/dev/DevPreviewText').DevPreviewButton
    : Pressable;

export default function App() {
  const { store, error, retry } = useStoreOpening();
  return store ? (
    <PersistentApp store={store} />
  ) : (
    <StorageGate error={error} onRetry={retry} />
  );
}

function StorageGate({
  error,
  onRetry,
}: {
  error: boolean;
  onRetry: () => void;
}) {
  return (
    <SafeAreaProvider>
      <SafeAreaView
        style={[
          styles.screen,
          { justifyContent: 'center', padding: 24, gap: 16 },
        ]}
      >
        <StatusBar style="light" />
        {error ? (
          <>
            <Text style={styles.secondary}>
              Saved data could not be opened. Your database has not been reset.
            </Text>
            <Pressable
              accessibilityRole="button"
              style={styles.action}
              onPress={onRetry}
            >
              <Text style={styles.actionText}>Retry</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator
            color="#888888"
            accessibilityLabel="Opening saved habits"
          />
        )}
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

function PersistentApp({ store }: { store: ChangeStore }) {
  const snapshot = usePersistentStore(store);
  const { habits, values, hapticsEnabled } = snapshot.replay.state;
  const [backupBusy, setBackupBusy] = useState(false);
  useEffect(() => {
    setHapticsEnabled(hapticsEnabled);
  }, [hapticsEnabled]);
  const today = useLocalToday();
  const [panel, setPanel] = useState<{
    page: 'history' | 'settings';
    visible: boolean;
  }>({ page: 'history', visible: false });
  const [editing, setEditing] = useState<{
    key: string;
    habit: Habit;
    day: GridDay;
  } | null>(null);
  const [draftColor, setDraftColor] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = habits.find((habit) => habit.id === detailId);
  const [input, setInput] = useState('');
  const trimmed = input.trim().replace(',', '.');
  const numeric = Number(trimmed);
  const valid =
    trimmed === '' ||
    (/^\d+(\.\d*)?$/.test(trimmed) &&
      Number.isFinite(numeric) &&
      numeric <= Number.MAX_SAFE_INTEGER);
  const accent = editing?.habit.color ?? detail?.color ?? '#FFFFFF';

  const pressCell = useCallback(
    (habit: Habit, day: GridDay) => {
      if (!store.canEdit()) return;
      const key = `${habit.id}:${day.key}`;
      const before = store.getSnapshot().replay.state.values[key] ?? null;
      if (habit.unit) {
        setInput(before === null ? '' : String(before));
        setEditing({ key, habit, day });
        feedback('selection');
      } else {
        const after = before === 1 ? null : 1;
        if (
          store.change({
            kind: 'entry',
            habitId: habit.id,
            date: day.key,
            before,
            after,
          })
        )
          feedback(after === null ? 'undo' : 'confirm');
      }
    },
    [store],
  );

  const openDetails = useCallback((habit: Habit) => {
    setDraftColor(habit.color);
    setDetailId(habit.id);
  }, []);

  const openHistory = useCallback(() => {
    feedback('selection');
    setPanel({ page: 'history', visible: true });
  }, []);
  const openSettings = useCallback(() => {
    feedback('selection');
    setPanel({ page: 'settings', visible: true });
  }, []);

  function changeHaptics(value: boolean) {
    const before = store.getSnapshot().replay.state.hapticsEnabled;
    if (store.change({ kind: 'haptics', before, after: value })) {
      setHapticsEnabled(value);
      if (value) feedback('selection');
    }
  }

  function saveNumber() {
    if (!editing || !valid || !store.canEdit()) return;
    const before = store.getSnapshot().replay.state.values[editing.key] ?? null;
    const after = trimmed === '' ? null : numeric;
    if (
      before !== after &&
      !store.change({
        kind: 'entry',
        habitId: editing.habit.id,
        date: editing.day.key,
        before,
        after,
      })
    )
      return;
    setEditing(null);
    if (before !== after) feedback(after === null ? 'undo' : 'confirm');
  }

  function closeDialog() {
    setEditing(null);
    setDetailId(null);
    setDraftColor(null);
  }

  function applyColour() {
    if (!detail || !draftColor || !store.canEdit()) return;
    if (
      draftColor !== detail.color &&
      !store.change({
        kind: 'colour',
        habitId: detail.id,
        before: detail.color,
        after: draftColor,
      })
    )
      return;
    if (draftColor !== detail.color) feedback('confirm');
    closeDialog();
  }

  function undo() {
    if (store.undo()) feedback('undo');
  }
  function redo() {
    if (store.redo()) feedback('confirm');
  }
  async function backupAction(action: () => Promise<void>) {
    setBackupBusy(true);
    try {
      await action();
    } catch (error) {
      Alert.alert(
        'Backup could not be completed',
        error instanceof Error
          ? error.message
          : 'Your saved data has been kept. Please try again.',
      );
    } finally {
      setBackupBusy(false);
    }
  }
  async function restoreBackup() {
    await backupAction(async () => {
      const archive = await chooseBackup();
      if (!archive) return;
      const confirmed = await new Promise<boolean>((resolve) =>
        Alert.alert(
          'Restore this backup?',
          `This backup has ${archive.replay.state.habits.length} habits and ${archive.events.length - 1} changes. It will replace your current entries, colours, and settings. A copy of the current data will be kept on this device.`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            {
              text: 'Restore',
              style: 'destructive',
              onPress: () => resolve(true),
            },
          ],
          { cancelable: false },
        ),
      );
      if (confirmed) await store.exclusive(() => store.replace(archive.events));
    });
  }
  async function recoverPrevious() {
    Alert.alert(
      'Return to the pre-restore copy?',
      'This replaces the current data. A copy of the current data will also be kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore copy',
          style: 'destructive',
          onPress: () => {
            void backupAction(() =>
              store.exclusive(async () => {
                await store.replace(await store.recoveryEvents());
              }),
            );
          },
        },
      ],
    );
  }

  if (snapshot.status !== 'ready')
    return (
      <StorageGate
        error={snapshot.status === 'load-error'}
        onRetry={() => {
          void store.retry();
        }}
      />
    );

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        {snapshot.error && (
          <View
            accessibilityLiveRegion="assertive"
            style={{
              paddingHorizontal: 18,
              paddingVertical: 8,
              backgroundColor: '#251C16',
            }}
          >
            <Text style={styles.secondary}>{snapshot.error}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void store.retry();
              }}
              style={styles.action}
            >
              <Text style={styles.actionText}>Retry saving</Text>
            </Pressable>
          </View>
        )}
        <View style={styles.content}>
          <HabitGrid
            HeadingComponent={PreviewHeading}
            DateButtonComponent={PreviewDateButton}
            key={today}
            today={today}
            habits={habits}
            values={values}
            onHabitPress={openDetails}
            onCellPress={pressCell}
            onHistoryPress={openHistory}
            onSettingsPress={openSettings}
          />
        </View>
        <Modal
          visible={editing !== null || detail !== undefined}
          animationType="fade"
          supportedOrientations={[
            'portrait',
            'landscape-left',
            'landscape-right',
          ]}
          transparent
          onRequestClose={closeDialog}
        >
          <KeyboardAvoidingView
            style={styles.overlay}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View accessibilityViewIsModal style={styles.dialog}>
              {detail && !editing && (
                <View style={styles.dialogHeader}>
                  <Text style={[styles.eyebrow, { marginBottom: 0 }]}>
                    HABIT DETAILS
                  </Text>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Close without applying colour"
                    onPress={closeDialog}
                    style={styles.closeButton}
                  >
                    <Text allowFontScaling={false} style={styles.closeText}>
                      ×
                    </Text>
                  </Pressable>
                </View>
              )}
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {editing && <Text style={styles.eyebrow}>DAILY TOTAL</Text>}
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
                        <Text
                          style={[
                            styles.primaryActionText,
                            { color: checkmarkColor(accent) },
                          ]}
                        >
                          Save total
                        </Text>
                      </Pressable>
                    </View>
                  </>
                ) : detail ? (
                  <>
                    <Text style={styles.secondary}>
                      Statistics and streaks are coming next.
                    </Text>
                    <ColourPicker
                      key={detail.id}
                      color={detail.color}
                      onChange={setDraftColor}
                    />
                  </>
                ) : null}
              </ScrollView>
              {detail && !editing && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !draftColor }}
                  disabled={!draftColor}
                  onPress={applyColour}
                  style={[
                    styles.action,
                    styles.doneAction,
                    { opacity: draftColor ? 1 : 0.4 },
                  ]}
                >
                  <Text style={styles.actionText}>Done</Text>
                </Pressable>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>
        <AppPanel
          page={panel.page}
          visible={panel.visible}
          HeadingComponent={PreviewHeading}
          snapshot={snapshot}
          backupBusy={backupBusy}
          onUndo={undo}
          onRedo={redo}
          onExport={() => {
            void backupAction(() => shareBackup(store));
          }}
          onRestore={() => {
            void restoreBackup();
          }}
          onRecover={() => {
            void recoverPrevious();
          }}
          onRetry={() => {
            void store.retry();
          }}
          hapticsEnabled={hapticsEnabled}
          onHapticsChange={changeHaptics}
          onClose={() =>
            setPanel((previous) => ({ ...previous, visible: false }))
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  dialogHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -10,
    marginBottom: 4,
  },
  closeButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
  closeText: { color: '#BBBBBB', fontSize: 27, lineHeight: 30 },
  screen: { flex: 1, backgroundColor: '#000000' },
  content: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 18,
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
  doneAction: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333333',
    marginTop: 12,
  },
});
