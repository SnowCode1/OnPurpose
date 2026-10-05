import { sameValue } from './src/storage/model';
import { DailyRecordDialog } from './src/DailyRecordDialog';
import { sameEntry, type EntryValue } from './src/entries';
import { TypographyProvider, TextInput, Text } from './src/Typography';
import { DescriptionVersions } from './src/DescriptionVersions';
import { descriptionVersions } from './src/descriptionVersions';
import { DescriptionEditor } from './src/DescriptionEditor';
import { descriptionDraftKey } from './src/descriptionDrafts';
import { applyPlaceholderDescriptions } from './src/storage/presetDescriptions';
import { displayDefaults } from './src/displayPreferences';
import { useGridDisplayPreferences } from './src/useGridDisplayPreferences';
import type { RowSpacing } from './src/rowSpacing';
import { habitTrackingStart } from './src/statistics';
import { StatusBar } from 'expo-status-bar';
import {
  type ComponentType,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
  type TextProps,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { type EntryDay } from './src/calendar';
import { PerformanceBoundary } from './src/PerformanceBoundary';
import { HabitDetailsScreen } from './src/HabitDetailsScreen';
import { HabitGrid } from './src/HabitGrid';
import { habitType, isNumericHabit, type Habit } from './src/habits';
import { randomUUID } from 'expo-crypto';
import { HabitDialog, type HabitDialogMode } from './src/HabitDialog';
import { displayedHabitOrder, moveHabit } from './src/habitOrdering';
import type { HabitAction } from './src/HabitName';
import { checkmarkColor } from './src/colors';
import { useLocalToday } from './src/useLocalToday';
import { feedback, setHapticsEnabled } from './src/haptics';
import { AppPanel } from './src/AppPanel';
import { usePersistentStore, useStoreOpening } from './src/usePersistentStore';
import type { ChangeStore } from './src/storage/store';
import { applyPresetIcons } from './src/storage/presetIcons';
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

// One global capture listener reaches native sheets and DOM editors alike.
const previewTools: typeof import('./src/dev/DevPreviewCapture') | null =
  __DEV__ && process.env.EXPO_PUBLIC_DEV_PREVIEW === 'true'
    ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- Development-only sensor/capture code.
      require('./src/dev/DevPreviewCapture')
    : null;
const PreviewCapture = previewTools?.DevPreviewCapture;
const PreviewControls = previewTools?.DevPreviewControls;

// Development sample history is excluded from production bundles.
const SampleDataMode:
  typeof import('./src/dev/SampleDataMode').SampleDataMode | null = __DEV__
  ? // eslint-disable-next-line @typescript-eslint/no-require-imports -- Do not bundle sample fixtures in release JS.
    require('./src/dev/SampleDataMode').SampleDataMode
  : null;

export default function App() {
  return (
    <>
      {PreviewCapture && <PreviewCapture />}
      <StoreApp />
    </>
  );
}
function StoreApp() {
  const { store, error, retry } = useStoreOpening();
  if (!store) return <StorageGate error={error} onRetry={retry} />;
  if (SampleDataMode)
    return (
      <SampleDataMode store={store}>
        {(activeStore, sampleData, developmentControls) => (
          <PersistentApp
            key={sampleData ? 'sample' : 'real'}
            store={activeStore}
            sampleData={sampleData}
            developmentControls={developmentControls}
          />
        )}
      </SampleDataMode>
    );
  return <PersistentApp store={store} />;
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

function PersistentApp({
  store,
  sampleData = false,
  developmentControls,
}: {
  store: ChangeStore;
  sampleData?: boolean;
  developmentControls?: ReactNode;
}) {
  const snapshot = usePersistentStore(store);
  useEffect(() => {
    if (!sampleData && snapshot.status === 'ready') {
      applyPresetIcons(store);
      applyPlaceholderDescriptions(store);
    }
  }, [store, snapshot.status, sampleData]);
  const {
    habits,
    values,
    hapticsEnabled,
    rowSpacing = 'standard',
    columnSpacing = displayDefaults.columnSpacing,
    weekStart = displayDefaults.weekStart,
    dateFading = displayDefaults.dateFading,
    hideCompleted = displayDefaults.hideCompleted,
    textScale = displayDefaults.textScale,
  } = snapshot.replay.state;
  const activeHabits = useMemo(
    () => habits.filter((habit) => !habit.archived),
    [habits],
  );
  const [backupBusy, setBackupBusy] = useState(false);
  useEffect(() => {
    setHapticsEnabled(hapticsEnabled);
  }, [hapticsEnabled]);
  const today = useLocalToday();
  const [panel, setPanel] = useState<{
    page: 'history' | 'settings' | 'archive';
    visible: boolean;
    deferGrid: boolean;
  }>({ page: 'history', visible: false, deferGrid: false });
  const gridDisplay = useGridDisplayPreferences(
    { rowSpacing, columnSpacing, textScale, dateFading, hideCompleted },
    panel.deferGrid,
  );
  const [editing, setEditing] = useState<{
    key: string;
    habit: Habit;
    day: EntryDay;
  } | null>(null);
  const [recording, setRecording] = useState<{
    key: string;
    habit: Habit;
    day: EntryDay;
  } | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const detail = habits.find((habit) => habit.id === detailId);
  const [habitMode, setHabitMode] = useState<HabitDialogMode>('edit');
  const [newHabit, setNewHabit] = useState<Habit | null>(null);
  const [descriptionId, setDescriptionId] = useState<string | null>(null);
  const descriptionHabit = habits.find((habit) => habit.id === descriptionId);
  const [versionsId, setVersionsId] = useState<string | null>(null);
  const versionsHabit = habits.find((habit) => habit.id === versionsId);
  const [statsId, setStatsId] = useState<string | null>(null);
  const statsHabit = habits.find(
    (habit) => habit.id === statsId && !habit.archived,
  );
  const versions = useMemo(() => {
    const id = versionsId ?? statsId;
    return id ? descriptionVersions(snapshot.replay.undo, id) : [];
  }, [snapshot.replay.undo, versionsId, statsId]);
  const editable = store.canEdit() && !backupBusy;
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
    (habit: Habit, day: EntryDay) => {
      if (!store.canEdit()) return;
      const key = `${habit.id}:${day.key}`;
      const before = store.getSnapshot().replay.state.values[key] ?? null;
      if (isNumericHabit(habit)) {
        setInput(before === null ? '' : String(before));
        setEditing({ key, habit, day });
        feedback('selection');
      } else if (habitType(habit) !== 'checkbox') {
        setRecording({ key, habit, day });
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
    [store, setInput, setEditing],
  );

  const openDetails = useCallback((habit: Habit) => {
    setStatsId(habit.id);
    feedback('selection');
  }, []);

  const openHistory = useCallback(() => {
    feedback('selection');
    setPanel({ page: 'history', visible: true, deferGrid: true });
  }, []);
  const openSettings = useCallback(() => {
    feedback('selection');
    setPanel({ page: 'settings', visible: true, deferGrid: true });
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

  function saveRecord(after: EntryValue | null): boolean {
    if (!recording || !store.canEdit()) return false;
    const before =
      store.getSnapshot().replay.state.values[recording.key] ?? null;
    if (sameEntry(before, after)) return true;
    const accepted = store.change({
      kind: 'entry',
      habitId: recording.habit.id,
      date: recording.day.key,
      before,
      after,
    });
    if (accepted) feedback(after === null ? 'undo' : 'confirm');
    return accepted;
  }
  function closeDialog() {
    setEditing(null);
    setRecording(null);
    setDetailId(null);
    setNewHabit(null);
  }

  function applyColour(colour: string): boolean {
    const habit = store
      .getSnapshot()
      .replay.state.habits.find((habit) => habit.id === detailId);
    if (!habit || !store.canEdit()) return false;
    if (colour === habit.color) return true;
    const accepted = store.change({
      kind: 'colour',
      habitId: habit.id,
      before: habit.color,
      after: colour,
    });
    if (accepted) feedback('confirm');
    return accepted;
  }
  const saveHabit = useCallback(
    (after: Habit): boolean => {
      const current = store.getSnapshot().replay.state.habits;
      const before = current.find((habit) => habit.id === after.id) ?? null;
      if (
        before &&
        before.name === after.name &&
        before.color === after.color &&
        before.unit === after.unit &&
        habitType(before) === habitType(after) &&
        sameValue(before.categories, after.categories) &&
        before.archived === after.archived &&
        before.icon === after.icon &&
        before.startDate === after.startDate &&
        before.description === after.description
      )
        return true;
      const accepted = store.change({
        kind: 'habit',
        habitId: after.id,
        index: before ? current.indexOf(before) : current.length,
        before,
        after,
      });
      if (accepted) feedback('confirm');
      return accepted;
    },
    [store],
  );
  const restoreDescription = useCallback(
    (id: string, description: string | undefined) => {
      const current = store
        .getSnapshot()
        .replay.state.habits.find((habit) => habit.id === id);
      if (!current || !editable) return false;
      const { description: _description, ...rest } = current;
      return saveHabit({ ...rest, ...(description ? { description } : {}) });
    },
    [store, editable, saveHabit],
  );
  const reorderHabits = useCallback(
    (ids: string[]): boolean => {
      const current = store.getSnapshot().replay.state.habits;
      const before = current.map((habit) => habit.id),
        after = displayedHabitOrder(current, ids);
      if (before.join('|') === after.join('|')) return false;
      return store.change({ kind: 'order', before, after });
    },
    [store],
  );
  const habitAction = useCallback(
    (habit: Habit, action: HabitAction) => {
      if (!store.canEdit()) return;
      if (action === 'archive') {
        saveHabit({ ...habit, archived: true });
        return;
      }
      if (action === 'moveUp' || action === 'moveDown') {
        const ids = store
          .getSnapshot()
          .replay.state.habits.filter((habit) => !habit.archived)
          .map((habit) => habit.id);
        if (
          reorderHabits(
            moveHabit(
              ids,
              habit.id,
              ids.indexOf(habit.id) + (action === 'moveUp' ? -1 : 1),
            ),
          )
        )
          feedback('selection');
        return;
      }
      if (action === 'reorder') return; // Grid owns reorder mode.
      setNewHabit(null);
      setDetailId(habit.id);
      setHabitMode(action === 'colour' ? 'colour' : 'edit');
      feedback('selection');
    },
    [store, saveHabit, reorderHabits],
  );
  const addHabit = useCallback(() => {
    if (!store.canEdit()) return;
    if (store.getSnapshot().replay.state.habits.length >= 1000) {
      Alert.alert(
        'Habit limit reached',
        'This preview supports up to 1,000 habits, including archived habits.',
      );
      return;
    }
    setDetailId(null);
    setNewHabit({
      id: randomUUID(),
      name: '',
      color: '#82E6BC',
      type: 'checkbox',
      startDate: today,
    });
    setHabitMode('create');
  }, [store, today]);

  const closeStats = useCallback(() => setStatsId(null), []);
  const editStats = useCallback(() => {
    if (statsHabit) habitAction(statsHabit, 'edit');
  }, [statsHabit, habitAction]);

  function undo() {
    if (store.undo()) feedback('undo');
  }
  function redo() {
    if (store.redo()) feedback('confirm');
  }
  async function backupAction(action: () => Promise<void>) {
    if (sampleData) return;
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

  const habitDialog =
    detail || newHabit ? (
      <HabitDialog
        key={detail?.id ?? newHabit?.id}
        habit={(detail ?? newHabit)!}
        initialStartDate={habitTrackingStart(
          (detail ?? newHabit)!,
          values,
          snapshot.events,
          today,
        )}
        temporary={sampleData}
        mode={habitMode}
        Heading={PreviewHeading}
        onClose={closeDialog}
        onSave={saveHabit}
        onColour={applyColour}
        editable={editable}
      />
    ) : null;

  const overlays = (
    <>
      {descriptionHabit && (
        <DescriptionEditor
          key={descriptionHabit.id}
          title={descriptionHabit.name}
          colour={descriptionHabit.color}
          initialValue={descriptionHabit.description ?? ''}
          draftKey={descriptionDraftKey(descriptionHabit.id)}
          temporary={sampleData}
          editable={editable}
          Heading={PreviewHeading}
          onClose={() => setDescriptionId(null)}
          onApply={(description) =>
            restoreDescription(descriptionHabit.id, description)
          }
        />
      )}
      {versionsHabit && (
        <DescriptionVersions
          key={versionsHabit.id}
          habit={versionsHabit}
          actions={versions}
          state={snapshot.replay.state}
          editable={editable}
          Heading={PreviewHeading}
          onRestore={restoreDescription}
          onClose={() => setVersionsId(null)}
        />
      )}
      <Modal
        visible={editing !== null}
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
                  <Text style={styles.secondary}>{editing.day.fullLabel}</Text>
                  <View style={styles.inputRow}>
                    <TextInput
                      autoFocus
                      keyboardType="decimal-pad"
                      accessibilityLabel={`Daily total${editing.habit.unit ? ` in ${editing.habit.unit}` : ''}`}
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
                        {
                          backgroundColor: accent,
                          opacity: valid ? 1 : 0.4,
                        },
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
              ) : null}
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
      {recording && (
        <DailyRecordDialog
          key={recording.key}
          habit={recording.habit}
          day={recording.day}
          value={values[recording.key]}
          editable={editable}
          Heading={PreviewHeading}
          onClose={() => setRecording(null)}
          onSave={saveRecord}
        />
      )}
      {habitDialog}
      <AppPanel
        sampleData={sampleData}
        developmentControls={
          developmentControls || PreviewControls ? (
            <>
              {developmentControls}
              {PreviewControls && <PreviewControls />}
            </>
          ) : undefined
        }
        page={panel.page}
        onArchive={() =>
          setPanel({ page: 'archive', visible: true, deferGrid: true })
        }
        onBack={() =>
          setPanel({ page: 'settings', visible: true, deferGrid: true })
        }
        onRestoreHabit={(habit) => saveHabit({ ...habit, archived: false })}
        visible={panel.visible}
        HeadingComponent={PreviewHeading}
        snapshot={snapshot}
        backupBusy={backupBusy}
        onRestoreDescription={restoreDescription}
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
        columnSpacing={columnSpacing}
        weekStart={weekStart}
        hideCompleted={hideCompleted}
        onHideCompletedChange={(after) => {
          if (!editable) return;
          const before =
            store.getSnapshot().replay.state.hideCompleted ??
            displayDefaults.hideCompleted;
          if (store.change({ kind: 'hideCompleted', before, after }))
            feedback('selection');
        }}
        dateFading={dateFading}
        onColumnSpacingChange={(after) => {
          if (!editable) return;
          const before =
            store.getSnapshot().replay.state.columnSpacing ??
            displayDefaults.columnSpacing;
          if (store.change({ kind: 'columnSpacing', before, after }))
            feedback('selection');
        }}
        onWeekStartChange={(after) => {
          if (!editable) return;
          const before =
            store.getSnapshot().replay.state.weekStart ??
            displayDefaults.weekStart;
          if (store.change({ kind: 'weekStart', before, after }))
            feedback('selection');
        }}
        onDateFadingChange={(after) => {
          if (!editable) return;
          const before =
            store.getSnapshot().replay.state.dateFading ??
            displayDefaults.dateFading;
          if (store.change({ kind: 'dateFading', before, after }))
            feedback('selection');
        }}
        textScale={textScale}
        onTextScaleChange={(after) => {
          if (!editable) return;
          const before =
            store.getSnapshot().replay.state.textScale ??
            displayDefaults.textScale;
          if (store.change({ kind: 'textScale', before, after }))
            feedback('selection');
        }}
        rowSpacing={rowSpacing}
        onRowSpacingChange={(after: RowSpacing) => {
          if (!editable) return;
          const before =
            store.getSnapshot().replay.state.rowSpacing ?? 'standard';
          if (store.change({ kind: 'rowSpacing', before, after }))
            feedback('selection');
        }}
        hapticsEnabled={hapticsEnabled}
        onHapticsChange={changeHaptics}
        onClose={() =>
          setPanel((previous) => ({ ...previous, visible: false }))
        }
        onDismiss={() =>
          setPanel((previous) =>
            previous.visible || !previous.deferGrid
              ? previous
              : { ...previous, deferGrid: false },
          )
        }
      />
    </>
  );

  const saveError = snapshot.error && (
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
  );

  return (
    <TypographyProvider scale={textScale}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <StatusBar style="light" />
          {!statsHabit && saveError}
          <View style={{ flex: 1 }}>
            <View
              style={styles.content}
              pointerEvents={statsHabit ? 'none' : 'auto'}
              accessibilityElementsHidden={!!statsHabit}
              importantForAccessibility={
                statsHabit ? 'no-hide-descendants' : 'auto'
              }
            >
              <TypographyProvider scale={gridDisplay.textScale}>
                <PerformanceBoundary name="grid">
                  <HabitGrid
                    columnSpacing={gridDisplay.columnSpacing}
                    dateFading={gridDisplay.dateFading}
                    hideCompleted={gridDisplay.hideCompleted}
                    rowSpacing={gridDisplay.rowSpacing}
                    sampleData={sampleData}
                    HeadingComponent={PreviewHeading}
                    DateButtonComponent={PreviewDateButton}
                    key={today}
                    today={today}
                    habits={activeHabits}
                    editable={editable}
                    onHabitAction={habitAction}
                    onReorder={reorderHabits}
                    store={store}
                    onHabitPress={openDetails}
                    onCellPress={pressCell}
                    onHistoryPress={openHistory}
                    onSettingsPress={openSettings}
                    onAddHabit={addHabit}
                  />
                </PerformanceBoundary>
              </TypographyProvider>
            </View>
            {statsHabit && (
              <Modal
                visible
                animationType="slide"
                presentationStyle="pageSheet"
                allowSwipeDismissal
                supportedOrientations={[
                  'portrait',
                  'landscape-left',
                  'landscape-right',
                ]}
                onRequestClose={closeStats}
                backdropColor="#000000"
              >
                <SafeAreaProvider>
                  <SafeAreaView style={styles.screen}>
                    {saveError}
                    <PerformanceBoundary name="statistics">
                      <HabitDetailsScreen
                        weekStart={weekStart}
                        key={statsHabit.id}
                        habit={statsHabit}
                        values={values}
                        events={snapshot.events}
                        today={today}
                        Heading={PreviewHeading}
                        editable={editable}
                        onBack={closeStats}
                        onCellPress={pressCell}
                        onDescriptionEdit={() =>
                          setDescriptionId(statsHabit.id)
                        }
                        onDescriptionVersions={
                          versions.length
                            ? () => setVersionsId(statsHabit.id)
                            : undefined
                        }
                        onEdit={editStats}
                      />
                    </PerformanceBoundary>
                    {overlays}
                  </SafeAreaView>
                </SafeAreaProvider>
              </Modal>
            )}
          </View>
          {!statsHabit && overlays}
        </SafeAreaView>
      </SafeAreaProvider>
    </TypographyProvider>
  );
}

const styles = StyleSheet.create({
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
});
