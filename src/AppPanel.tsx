import { type ComponentType, useMemo, useState } from 'react';
import {
  FlatList,
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
import { describeChange, type ChangeEvent } from './storage/model';
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
}: {
  page: 'history' | 'settings';
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
  const [historyCount, setHistoryCount] = useState(100);
  const editable = !snapshot.error && !snapshot.busy && !backupBusy;
  const changes = useMemo(
    () =>
      (page === 'history' ? snapshot.events : []).filter(
        (event): event is ChangeEvent => event.type !== 'initialize',
      ),
    [page, snapshot.events],
  );
  const history = changes.slice(-historyCount).reverse();
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
                {page === 'history' ? 'History' : 'Settings'}
              </HeadingComponent>
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
              <FlatList
                data={history}
                keyExtractor={(event) => event.id}
                contentContainerStyle={styles.body}
                ListHeaderComponent={
                  <View style={{ gap: 12, marginBottom: 20 }}>
                    <Text
                      accessibilityLiveRegion="polite"
                      style={styles.description}
                    >
                      {status}
                    </Text>
                    {snapshot.error && (
                      <Action label="Retry saving" onPress={onRetry} />
                    )}
                    <View style={styles.actions}>
                      <Action
                        label="Undo last change"
                        onPress={onUndo}
                        disabled={!editable || !snapshot.replay.undo.length}
                      />
                      <Action
                        label="Redo"
                        onPress={onRedo}
                        disabled={!editable || !snapshot.replay.redo.length}
                      />
                    </View>
                    <Text style={styles.description}>
                      Changes are kept in order. Undo adds a reversing change.
                    </Text>
                  </View>
                }
                ListEmptyComponent={
                  <View style={styles.empty}>
                    <Icon name="history" size={36} color="#747474" />
                    <Text style={styles.emptyTitle}>No changes yet</Text>
                    <Text style={styles.description}>
                      Your entries and edits will appear here.
                    </Text>
                  </View>
                }
                ListFooterComponent={
                  changes.length > historyCount ? (
                    <Action
                      label="Show older changes"
                      onPress={() => setHistoryCount((count) => count + 100)}
                    />
                  ) : null
                }
                renderItem={({ item }) => (
                  <View style={styles.record}>
                    <Text style={styles.label}>
                      {item.type === 'undo'
                        ? 'Undo · '
                        : item.type === 'redo'
                          ? 'Redo · '
                          : ''}
                      {describeChange(item.change, snapshot.replay.state)}
                    </Text>
                    {item.change.kind === 'entry' && (
                      <Text style={styles.description}>
                        {new Date(
                          `${item.change.date}T12:00:00`,
                        ).toLocaleDateString(undefined, {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    )}
                    <Text style={styles.timestamp}>
                      {new Date(item.recordedAt).toLocaleString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                      {item.sequence > snapshot.events.length - snapshot.pending
                        ? ' · Saving…'
                        : ''}
                    </Text>
                  </View>
                )}
              />
            ) : (
              <ScrollView
                contentContainerStyle={styles.body}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.section}>FEEDBACK</Text>
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
                    sample habits remain until habit editing is added.
                  </Text>
                </View>
              </ScrollView>
            )}
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
  empty: { alignItems: 'center', paddingTop: 40, gap: 14 },
  emptyTitle: {
    fontSize: 19,
    fontWeight: '500',
    color: '#DDDDDD',
    textAlign: 'center',
  },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  action: {
    minHeight: 48,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#151515',
    justifyContent: 'center',
    marginVertical: 4,
  },
  record: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#252525',
    gap: 6,
  },
  timestamp: { fontSize: 12, color: '#707070' },
});
