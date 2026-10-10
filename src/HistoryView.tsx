import { Text } from './Typography';
import { DescriptionHistory } from './DescriptionHistory';
import { memo, useMemo, useState, type ComponentType } from 'react';
import {
  Pressable,
  SectionList,
  StyleSheet,
  View,
  type TextProps,
} from 'react-native';
import { Icon } from './Icon';
import {
  historyDayLabel,
  historyDisplayState,
  historyPresentation,
  historySections,
} from './history';
import type { HistoryAction, StoredState } from './storage/model';
import type { StoreSnapshot } from './storage/store';
import { useLocalToday } from './useLocalToday';
import { useSheetScroll } from './SheetModal';
import { themedStyles, useTheme } from './ThemeContext';

const HistoryRow = memo(function HistoryRow({
  event,
  state,
  pending,
  onDescriptionPress,
}: {
  event: HistoryAction;
  state: StoredState;
  pending: boolean;
  onDescriptionPress: (event: HistoryAction) => void;
}) {
  const theme = useTheme();
  const styles = useStyles();
  const row = historyPresentation(event, state);
  const accent = theme.colour(row.color);
  const time = new Date(event.recordedAt).toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
  const date = row.effectiveDate
    ? new Date(`${row.effectiveDate}T12:00:00`).toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        ...(row.effectiveDate.slice(0, 4) !==
        String(new Date(event.recordedAt).getFullYear())
          ? { year: 'numeric' }
          : {}),
      })
    : null;
  const colourDescription =
    event.change.kind === 'colour'
      ? `, ${event.change.before} to ${event.change.after}`
      : '';
  const descriptionChanged =
    event.change.kind === 'habit' &&
    event.change.before?.description !== event.change.after?.description;
  return (
    <Pressable
      onPress={descriptionChanged ? () => onDescriptionPress(event) : undefined}
      accessibilityRole={descriptionChanged ? 'button' : undefined}
      accessibilityHint={
        descriptionChanged
          ? 'Compare description versions and restore'
          : undefined
      }
      accessible
      accessibilityLabel={`${row.title}, ${row.summary}${colourDescription}${date ? `, entry for ${date}` : ''}, ${time}${pending ? ', saving' : ''}`}
      style={styles.row}
    >
      <View style={styles.actionIcon}>
        <Icon name={row.icon} size={19} color={accent} />
      </View>
      <View style={styles.rowContent}>
        <View style={styles.rowHeading}>
          <Text style={styles.habitName}>{row.title}</Text>
          <Text style={styles.time}>{time}</Text>
        </View>
        <View style={styles.detailLine}>
          <Text style={styles.detail}>
            {row.summary}
            {date ? ` · For ${date}` : ''}
          </Text>
          {event.change.kind === 'colour' && (
            <View accessible={false} style={styles.swatches}>
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: theme.colour(event.change.before) },
                ]}
              />
              <Text allowFontScaling={false} style={styles.swatchArrow}>
                →
              </Text>
              <View
                style={[
                  styles.swatch,
                  { backgroundColor: theme.colour(event.change.after) },
                ]}
              />
            </View>
          )}
          {pending && <Text style={styles.pending}>Saving…</Text>}
        </View>
      </View>
    </Pressable>
  );
});

function HistoryButton({
  kind,
  onPress,
  disabled,
}: {
  kind: 'undo' | 'redo';
  onPress: () => void;
  disabled: boolean;
}) {
  const theme = useTheme();
  const styles = useStyles();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={
        kind === 'undo' ? 'Undo last change' : 'Redo last undone change'
      }
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { opacity: disabled ? 0.3 : pressed ? 0.55 : 1 },
      ]}
    >
      <Icon name={kind} size={17} color={theme.ink(0xcf)} />
      <Text style={styles.buttonLabel}>
        {kind === 'undo' ? 'Undo' : 'Redo'}
      </Text>
    </Pressable>
  );
}

export function HistoryView({
  Heading,
  sampleData = false,
  snapshot,
  backupBusy,
  onRestoreDescription,
  onUndo,
  onRedo,
  onRetry,
}: {
  Heading: ComponentType<TextProps>;
  sampleData?: boolean;
  snapshot: StoreSnapshot;
  backupBusy: boolean;
  onRestoreDescription: (id: string, text: string | undefined) => boolean;
  onUndo: () => void;
  onRedo: () => void;
  onRetry: () => void;
}) {
  const theme = useTheme();
  const styles = useStyles();
  const [descriptionAction, setDescriptionAction] =
    useState<HistoryAction | null>(null);
  const today = useLocalToday();
  const [limit, setLimit] = useState(100);
  const sections = historySections(snapshot.replay.undo, limit);
  const displayState = useMemo(
    () => historyDisplayState(snapshot.replay.state, snapshot.replay.undo),
    [snapshot.replay.state, snapshot.replay.undo],
  );
  const editable = !snapshot.error && !snapshot.busy && !backupBusy;
  const undoTarget = snapshot.replay.undo.at(-1);
  const targetRow = undoTarget
    ? historyPresentation(undoTarget, displayState)
    : null;
  const targetDate =
    undoTarget?.change.kind === 'entry' && undoTarget.change.date !== today
      ? new Date(`${undoTarget.change.date}T12:00:00`).toLocaleDateString(
          undefined,
          {
            day: 'numeric',
            month: 'short',
            ...(undoTarget.change.date.slice(0, 4) !== today.slice(0, 4)
              ? { year: 'numeric' }
              : {}),
          },
        )
      : null;
  const savedCount = snapshot.events.length - snapshot.pending;
  const sheetScroll = useSheetScroll();
  return (
    <View style={styles.container}>
      <View style={styles.controls}>
        <View accessibilityLiveRegion="polite" style={styles.status}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: snapshot.error
                  ? theme.colour('#DFAE82')
                  : snapshot.pending
                    ? theme.ink(0xb8)
                    : theme.colour('#668C7B'),
              },
            ]}
          />
          <Text style={styles.statusText}>
            {snapshot.error
              ? 'Not saved'
              : snapshot.pending
                ? 'Saving…'
                : sampleData
                  ? 'Sample · temporary'
                  : 'Saved'}
          </Text>
        </View>
        <View style={styles.buttons}>
          <HistoryButton
            kind="undo"
            onPress={onUndo}
            disabled={!editable || !snapshot.replay.undo.length}
          />
          <HistoryButton
            kind="redo"
            onPress={onRedo}
            disabled={!editable || !snapshot.replay.redo.length}
          />
        </View>
      </View>
      <Text style={styles.undoTarget} accessibilityLiveRegion="polite">
        {targetRow
          ? `Undo: ${targetRow.title} · ${targetRow.summary}${targetDate ? ` · ${targetDate}` : ''}`
          : 'Nothing to undo'}
      </Text>
      {snapshot.error && (
        <View style={styles.error}>
          <Text style={styles.errorText}>{snapshot.error}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onRetry}
            style={styles.retry}
          >
            <Text style={styles.buttonLabel}>Retry saving</Text>
          </Pressable>
        </View>
      )}
      {descriptionAction && (
        <DescriptionHistory
          Heading={Heading}
          action={descriptionAction}
          state={snapshot.replay.state}
          editable={editable}
          onRestore={onRestoreDescription}
          onClose={() => setDescriptionAction(null)}
        />
      )}
      <SectionList
        {...sheetScroll}
        sections={sections}
        extraData={snapshot}
        keyExtractor={(event) => event.id}
        stickySectionHeadersEnabled
        initialNumToRender={18}
        windowSize={7}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.dayHeading}>
            <Text accessibilityRole="header" style={styles.dayTitle}>
              {historyDayLabel(section.date, today)}
            </Text>
            <View style={styles.dayRule} />
          </View>
        )}
        renderItem={({ item }) => (
          <HistoryRow
            event={item}
            state={displayState}
            onDescriptionPress={setDescriptionAction}
            pending={item.lastChangedSequence > savedCount}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="history" size={32} color={theme.ink(0x74)} />
            <Text style={styles.emptyTitle}>No active changes</Text>
            <Text style={styles.emptyDescription}>
              Your habit entries and edits will appear here.
            </Text>
          </View>
        }
        ListFooterComponent={
          snapshot.replay.undo.length > limit ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => setLimit((count) => count + 100)}
              style={styles.more}
            >
              <Text style={styles.buttonLabel}>Show older changes</Text>
            </Pressable>
          ) : null
        }
      />
    </View>
  );
}
const useStyles = themedStyles((t) => ({
  container: { flex: 1 },
  controls: {
    paddingHorizontal: 24,
    paddingBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  status: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { color: t.ink(0x85), fontSize: 12, flexShrink: 1 },
  buttons: { flexDirection: 'row', gap: 6, flexShrink: 1 },
  button: {
    minHeight: 44,
    paddingHorizontal: 11,
    paddingVertical: 10,
    borderRadius: 11,
    backgroundColor: t.ink(0x14),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    flexShrink: 1,
  },
  buttonLabel: {
    color: t.ink(0xcf),
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  undoTarget: {
    marginHorizontal: 24,
    marginBottom: 8,
    fontSize: 12,
    lineHeight: 17,
    color: t.ink(0x90),
  },
  list: { flexGrow: 1, paddingBottom: 24 },
  dayHeading: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: t.background,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dayTitle: {
    color: t.ink(0x90),
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  dayRule: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: t.ink(0x24),
    flex: 1,
  },
  row: {
    minHeight: 54,
    paddingHorizontal: 24,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: t.ink(0x12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowContent: { flex: 1, gap: 3 },
  rowHeading: { flexDirection: 'row', alignItems: 'baseline', gap: 12 },
  habitName: { color: t.ink(0xdd), fontSize: 14, fontWeight: '500', flex: 1 },
  time: {
    color: t.ink(0x77),
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    flexShrink: 0,
  },
  detailLine: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    columnGap: 8,
    rowGap: 3,
  },
  detail: { color: t.ink(0x94), fontSize: 12, flexShrink: 1 },
  pending: { fontSize: 10, color: t.ink(0xa6) },
  swatches: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: t.ink(0x66),
  },
  swatchArrow: { fontSize: 11, color: t.ink(0x74) },
  empty: { alignItems: 'center', padding: 36, paddingTop: 60, gap: 12 },
  emptyTitle: { color: t.ink(0xdd), fontSize: 18, fontWeight: '500' },
  emptyDescription: { color: t.ink(0x96), fontSize: 13, textAlign: 'center' },
  error: {
    marginHorizontal: 24,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    backgroundColor: t.tint('#251C16'),
  },
  errorText: { color: t.colour('#C9B5A6'), fontSize: 13 },
  retry: { minHeight: 44, justifyContent: 'center', paddingTop: 8 },
  more: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 24,
    marginBottom: 0,
    borderRadius: 12,
    backgroundColor: t.ink(0x14),
  },
}));
