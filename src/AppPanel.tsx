import { type ColumnSpacing, type WeekStart } from './displayPreferences';
import { type RowSpacing } from './rowSpacing';
import { useState, type ComponentType, type ReactNode } from 'react';
import {
  SettingsScreen,
  settingsTitles,
  type SettingsPage,
} from './SettingsScreen';
import type { Habit } from './habits';
import { ArchivedHabits } from './ArchivedHabits';
import Animated from 'react-native-reanimated';
import { appear } from './motion';
import {
  Modal,
  Pressable,
  StyleSheet,
  type TextProps,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { HistoryView } from './HistoryView';
import type { StoreSnapshot } from './storage/store';

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
  hideCompleted,
  onHideCompletedChange,
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
  hideCompleted: boolean;
  onHideCompletedChange: (value: boolean) => void;
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
  const context = visible ? page : 'closed';
  const [navigation, setNavigation] = useState<{
    context: string;
    page: SettingsPage;
  }>({ context, page: 'index' });
  // Reset navigation together with a new presentation, without an effect render.
  if (navigation.context !== context) setNavigation({ context, page: 'index' });
  const settingsPage =
    navigation.context === context ? navigation.page : 'index';
  const setSettingsPage = (next: SettingsPage) =>
    setNavigation({ context, page: next });
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
              {(page === 'archive' ||
                (page === 'settings' && settingsPage !== 'index')) && (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Back to Settings"
                  onPress={
                    page === 'archive' ? onBack : () => setSettingsPage('index')
                  }
                  style={styles.close}
                >
                  <View style={{ transform: [{ rotate: '90deg' }] }}>
                    <Icon name="chevron" size={18} />
                  </View>
                </Pressable>
              )}
              <HeadingComponent accessibilityRole="header" style={styles.title}>
                {page === 'history'
                  ? 'History'
                  : page === 'archive'
                    ? 'Archived habits'
                    : settingsTitles[settingsPage]}
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
            <Animated.View
              key={page === 'settings' ? settingsPage : page}
              entering={appear}
              style={{ flex: 1 }}
            >
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
                <SettingsScreen
                  page={settingsPage}
                  onPage={setSettingsPage}
                  sampleData={sampleData}
                  developmentControls={developmentControls}
                  snapshot={snapshot}
                  backupBusy={backupBusy}
                  textScale={textScale}
                  onTextScaleChange={onTextScaleChange}
                  rowSpacing={rowSpacing}
                  onRowSpacingChange={onRowSpacingChange}
                  columnSpacing={columnSpacing}
                  onColumnSpacingChange={onColumnSpacingChange}
                  weekStart={weekStart}
                  onWeekStartChange={onWeekStartChange}
                  dateFading={dateFading}
                  onDateFadingChange={onDateFadingChange}
                  hideCompleted={hideCompleted}
                  onHideCompletedChange={onHideCompletedChange}
                  hapticsEnabled={hapticsEnabled}
                  onHapticsChange={onHapticsChange}
                  onArchive={onArchive}
                  onRetry={onRetry}
                  onExport={onExport}
                  onRestore={onRestore}
                  onRecover={onRecover}
                />
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
  title: { flex: 1, fontSize: 24, fontWeight: '600', color: '#E8E8E8' },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#151515',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
