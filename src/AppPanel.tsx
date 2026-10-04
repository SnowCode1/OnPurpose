import { type ComponentType, type ReactNode } from 'react';
import type { Habit } from './habits';
import { ManageHabits } from './ManageHabits';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
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
export function AppPanel({
  page,
  visible,
  HeadingComponent,
  hapticsEnabled,
  onHapticsChange,
  onClose,
  snapshot,
  backupBusy,
  onUndo,
  onRedo,
  onExport,
  onRestore,
  onRecover,
  onRetry,
  onManage,
  onBack,
  onAddHabit,
  onEditHabit,
  onRestoreHabit,
  onReorderHabits,
  habitDialog,
}: {
  page: 'history' | 'settings' | 'habits';
  onManage: () => void;
  onBack: () => void;
  onAddHabit: () => void;
  onEditHabit: (habit: Habit) => void;
  onRestoreHabit: (habit: Habit) => void;
  onReorderHabits: () => void;
  habitDialog: ReactNode;
  visible: boolean;
  HeadingComponent: ComponentType<TextProps>;
  hapticsEnabled: boolean;
  onHapticsChange: (enabled: boolean) => void;
  onClose: () => void;
  snapshot: StoreSnapshot;
  backupBusy: boolean;
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
                  : page === 'habits'
                    ? 'Habits'
                    : 'Settings'}
              </HeadingComponent>
              {page === 'habits' && (
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
            {page === 'history' ? (
              <HistoryView
                snapshot={snapshot}
                backupBusy={backupBusy}
                onUndo={onUndo}
                onRedo={onRedo}
                onRetry={onRetry}
              />
            ) : page === 'habits' ? (
              <ManageHabits
                habits={snapshot.replay.state.habits}
                editable={editable}
                onAdd={onAddHabit}
                onEdit={onEditHabit}
                onRestore={onRestoreHabit}
                onReorder={onReorderHabits}
              />
            ) : (
              <ScrollView
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
              >
                <Action
                  label="Manage habits"
                  onPress={onManage}
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
                <Text
                  style={[styles.section, { marginTop: 32, marginBottom: 12 }]}
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
                  Backups include all changes and undo history. Save a copy
                  outside the app to protect against uninstalling it or losing
                  this device.
                </Text>
                <View style={styles.about}>
                  <Text style={styles.aboutName}>OnPurpose · Preview</Text>
                  <Text style={styles.description}>
                    Entries, colours, and settings are stored locally. The
                    habits can be edited, arranged, and archived.
                  </Text>
                </View>
              </ScrollView>
            )}
            {habitDialog}
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
