import { Text, useAppWindowDimensions } from './Typography';
import {
  columnSpacingOptions,
  weekStartOptions,
  type ColumnSpacing,
  type WeekStart,
} from './displayPreferences';
import { rowSpacingOptions, type RowSpacing } from './rowSpacing';
import { type ComponentType, type ReactNode } from 'react';
import type { Habit } from './habits';
import { ArchivedHabits } from './ArchivedHabits';
import { TextSizeSetting } from './TextSizeSetting';
import Animated from 'react-native-reanimated';
import { appear } from './motion';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  type TextProps,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { HistoryView } from './HistoryView';
import type { StoreSnapshot } from './storage/store';

function Action({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.action,
        { opacity: disabled ? 0.35 : pressed ? 0.6 : 1 },
      ]}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}
function ChoiceSetting<T extends string>({
  label,
  description,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  description: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled: boolean;
}) {
  const { fontScale } = useAppWindowDimensions();
  return (
    <View style={{ gap: 8 }}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.description}>{description}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {options.map((option) => (
          <Pressable
            key={option.value}
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${option.label}`}
            accessibilityState={{ selected: value === option.value, disabled }}
            disabled={disabled}
            onPress={() => onChange(option.value)}
            style={({ pressed }) => ({
              flexGrow: 1,
              flexBasis: 90 * Math.max(1, fontScale),
              minHeight: 48,
              padding: 12,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: value === option.value ? '#74BBA525' : '#181818',
              opacity: disabled ? 0.35 : pressed ? 0.6 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: '500',
                color: value === option.value ? '#9BDBBE' : '#AAAAAA',
              }}
            >
              {option.label}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
export function AppPanel({
  sampleData = false,
  developmentControls,
  page,
  visible,
  HeadingComponent,
  columnSpacing,
  onColumnSpacingChange,
  weekStart,
  onWeekStartChange,
  dateFading,
  onDateFadingChange,
  textScale,
  onTextScaleChange,
  rowSpacing,
  onRowSpacingChange,
  hapticsEnabled,
  onHapticsChange,
  onClose,
  snapshot,
  backupBusy,
  onRestoreDescription,
  onUndo,
  onRedo,
  onExport,
  onRestore,
  onRecover,
  onRetry,
  onArchive,
  onBack,
  onRestoreHabit,
}: {
  sampleData?: boolean;
  developmentControls?: ReactNode;
  page: 'history' | 'settings' | 'archive';
  onArchive: () => void;
  onBack: () => void;
  onRestoreHabit: (habit: Habit) => void;
  visible: boolean;
  HeadingComponent: ComponentType<TextProps>;
  columnSpacing: ColumnSpacing;
  onColumnSpacingChange: (value: ColumnSpacing) => void;
  weekStart: WeekStart;
  onWeekStartChange: (value: WeekStart) => void;
  dateFading: boolean;
  onDateFadingChange: (value: boolean) => void;
  textScale: number;
  onTextScaleChange: (value: number) => void;
  rowSpacing: RowSpacing;
  onRowSpacingChange: (value: RowSpacing) => void;
  hapticsEnabled: boolean;
  onHapticsChange: (enabled: boolean) => void;
  onClose: () => void;
  snapshot: StoreSnapshot;
  backupBusy: boolean;
  onRestoreDescription: (id: string, text: string | undefined) => boolean;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  onRestore: () => void;
  onRecover: () => void;
  onRetry: () => void;
}) {
  const editable = !snapshot.error && !snapshot.busy && !backupBusy;
  const status =
    snapshot.error ??
    (snapshot.pending
      ? `Saving ${snapshot.pending} ${snapshot.pending === 1 ? 'change' : 'changes'}…`
      : sampleData
        ? 'Sample changes kept for this session'
        : 'Saved on this device');
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      allowSwipeDismissal
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      onRequestClose={onClose}
      backdropColor="#000000"
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <View accessibilityViewIsModal style={styles.content}>
            <View style={styles.header}>
              <HeadingComponent accessibilityRole="header" style={styles.title}>
                {page === 'history'
                  ? 'History'
                  : page === 'archive'
                    ? 'Archived habits'
                    : 'Settings'}
              </HeadingComponent>
              {page === 'archive' && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to Settings"
                  onPress={onBack}
                  style={styles.close}
                >
                  <Text style={{ color: '#CCCCCC' }}>‹</Text>
                </Pressable>
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Close ${page}`}
                onPress={onClose}
                style={({ pressed }) => [
                  styles.close,
                  { opacity: pressed ? 0.55 : 1 },
                ]}
              >
                <Icon name="close" size={18} />
              </Pressable>
            </View>
            <Animated.View key={page} entering={appear} style={{ flex: 1 }}>
              {page === 'history' ? (
                <HistoryView
                  Heading={HeadingComponent}
                  sampleData={sampleData}
                  snapshot={snapshot}
                  backupBusy={backupBusy}
                  onRestoreDescription={onRestoreDescription}
                  onUndo={onUndo}
                  onRedo={onRedo}
                  onRetry={onRetry}
                />
              ) : page === 'archive' ? (
                <ArchivedHabits
                  sampleData={sampleData}
                  habits={snapshot.replay.state.habits}
                  editable={editable}
                  onRestore={onRestoreHabit}
                  values={snapshot.replay.state.values}
                  pending={snapshot.pending}
                  error={snapshot.error}
                  onRetry={onRetry}
                />
              ) : (
                <ScrollView
                  contentContainerStyle={styles.body}
                  showsVerticalScrollIndicator={false}
                >
                  {developmentControls && (
                    <View
                      pointerEvents={
                        backupBusy || snapshot.busy ? 'none' : 'auto'
                      }
                      accessibilityElementsHidden={backupBusy || snapshot.busy}
                    >
                      {developmentControls}
                    </View>
                  )}
                  <Action
                    label={`Archived habits · ${snapshot.replay.state.habits.filter((habit) => habit.archived).length}`}
                    onPress={onArchive}
                  />
                  <Text style={[styles.section, { marginTop: 28 }]}>
                    DISPLAY
                  </Text>
                  <View style={{ gap: 24 }}>
                    <TextSizeSetting
                      key={textScale}
                      value={textScale}
                      editable={editable}
                      onChange={onTextScaleChange}
                    />
                    <ChoiceSetting
                      label="Row spacing"
                      description="Fit more habits, or give each one more room. Larger text still has space to grow."
                      value={rowSpacing}
                      options={rowSpacingOptions}
                      onChange={onRowSpacingChange}
                      disabled={!editable}
                    />
                    <ChoiceSetting
                      label="Column spacing"
                      description="Compact shows more days. Wider columns give numbers more room."
                      value={columnSpacing}
                      options={columnSpacingOptions}
                      onChange={onColumnSpacingChange}
                      disabled={!editable}
                    />
                    <View style={styles.preference}>
                      <View style={styles.preferenceText}>
                        <Text style={styles.label}>Fade distant dates</Text>
                        <Text style={styles.description}>
                          Dim empty cells and dates in the grid’s older and
                          future days. Turn off for stronger contrast; recorded
                          entries stay bright.
                        </Text>
                      </View>
                      <Switch
                        accessibilityLabel="Fade distant dates"
                        disabled={!editable}
                        value={dateFading}
                        onValueChange={onDateFadingChange}
                        trackColor={{ false: '#303030', true: '#74BBA5' }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="#303030"
                      />
                    </View>
                  </View>
                  <Text style={[styles.section, { marginTop: 28 }]}>
                    CALENDAR
                  </Text>
                  <ChoiceSetting
                    label="Week starts on"
                    description="Used by the statistics calendar and weekday breakdown."
                    value={weekStart}
                    options={weekStartOptions}
                    onChange={onWeekStartChange}
                    disabled={!editable}
                  />
                  <Text style={[styles.section, { marginTop: 28 }]}>
                    FEEDBACK
                  </Text>
                  <View style={styles.preference}>
                    <View style={styles.preferenceText}>
                      <Text style={styles.label}>Haptic feedback</Text>
                      <Text style={styles.description}>
                        A short pulse when you record or change something.
                      </Text>
                    </View>
                    <Switch
                      accessibilityLabel="Haptic feedback"
                      disabled={!editable}
                      value={hapticsEnabled}
                      onValueChange={onHapticsChange}
                      trackColor={{ false: '#303030', true: '#74BBA5' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#303030"
                    />
                  </View>
                  {!sampleData && (
                    <>
                      <Text
                        style={[
                          styles.section,
                          { marginTop: 32, marginBottom: 12 },
                        ]}
                      >
                        LOCAL DATA
                      </Text>
                      <Text
                        accessibilityLiveRegion="polite"
                        style={styles.description}
                      >
                        {status}
                      </Text>
                      {snapshot.error && (
                        <Action label="Retry saving" onPress={onRetry} />
                      )}
                      <Action
                        label={backupBusy ? 'Working…' : 'Export backup'}
                        onPress={onExport}
                        disabled={!editable}
                      />
                      <Action
                        label="Restore backup…"
                        onPress={onRestore}
                        disabled={!editable}
                      />
                      {snapshot.hasRecovery && (
                        <Action
                          label="Restore pre-restore copy…"
                          onPress={onRecover}
                          disabled={!editable}
                        />
                      )}
                      <Text style={styles.description}>
                        Backups include all changes and undo history. Save a
                        copy outside the app to protect against uninstalling it
                        or losing this device.
                      </Text>
                    </>
                  )}
                  <View style={styles.about}>
                    <Text style={styles.aboutName}>OnPurpose · Preview</Text>
                    <Text style={styles.description}>
                      {sampleData
                        ? 'Sample data is temporary. Your saved habits and entries are untouched.'
                        : 'Entries, colours, and settings are stored locally. The habits can be edited, arranged, and archived.'}
                    </Text>
                  </View>
                </ScrollView>
              )}
            </Animated.View>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  content: { flex: 1, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: {
    minHeight: 72,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  title: { flexShrink: 1, fontSize: 24, fontWeight: '600', color: '#E8E8E8' },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flexGrow: 1, padding: 24, paddingTop: 20 },
  section: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.3,
    color: '#858585',
  },
  preference: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#252525',
  },
  preferenceText: { flex: 1, gap: 6 },
  label: { fontSize: 17, fontWeight: '500', color: '#E0E0E0' },
  description: { fontSize: 14, lineHeight: 21, color: '#969696' },
  about: { marginTop: 36, gap: 6 },
  aboutName: { fontSize: 13, fontWeight: '500', color: '#B8B8B8' },
  action: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#151515',
    justifyContent: 'center',
    marginVertical: 4,
  },
});
