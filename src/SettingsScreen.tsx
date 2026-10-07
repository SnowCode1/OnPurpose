import type { ReactNode } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Text, useAppWindowDimensions } from './Typography';
import { TextSizeSetting } from './TextSizeSetting';
import { Icon, type IconName } from './Icon';
import { InfoNote } from './InfoNote';
import {
  checkboxStyleOptions,
  type CheckboxStyle,
  columnSpacingOptions,
  nameColumnWidthOptions,
  weekStartOptions,
  type ColumnSpacing,
  type NameColumnWidth,
  type WeekStart,
} from './displayPreferences';
import { rowSpacingOptions, type RowSpacing } from './rowSpacing';
import type { StoreSnapshot } from './storage/store';

export const settingsTitles = {
  index: 'Settings',
  appearance: 'Appearance',
  tracking: 'Daily tracking',
  backup: 'Backups',
  development: 'Development',
};
export type SettingsPage = keyof typeof settingsTitles;
type Props = {
  page: SettingsPage;
  onPage: (page: SettingsPage) => void;
  sampleData: boolean;
  developmentControls?: ReactNode;
  snapshot: StoreSnapshot;
  backupBusy: boolean;
  textScale: number;
  onTextScaleChange: (value: number) => void;
  rowSpacing: RowSpacing;
  onRowSpacingChange: (value: RowSpacing) => void;
  columnSpacing: ColumnSpacing;
  nameColumnWidth: NameColumnWidth;
  onColumnSpacingChange: (value: ColumnSpacing) => void;
  onNameColumnWidthChange: (value: NameColumnWidth) => void;
  weekStart: WeekStart;
  onWeekStartChange: (value: WeekStart) => void;
  weekDividers: boolean;
  onWeekDividersChange: (value: boolean) => void;
  tapAnimations: boolean;
  onTapAnimationsChange: (value: boolean) => void;
  checkboxStyle: CheckboxStyle;
  onCheckboxStyleChange: (value: CheckboxStyle) => void;
  dateFading: boolean;
  onDateFadingChange: (value: boolean) => void;
  hideCompleted: boolean;
  onHideCompletedChange: (value: boolean) => void;
  hapticsEnabled: boolean;
  onHapticsChange: (value: boolean) => void;
  onArchive: () => void;
  onRetry: () => void;
  onExport: () => void;
  onRestore: () => void;
  onRecover: () => void;
};
function Group({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 8 }}>
      {title && <Text style={styles.groupTitle}>{title}</Text>}
      <View style={styles.group}>{children}</View>
    </View>
  );
}
function Row({
  label,
  detail,
  value,
  icon,
  onPress,
  disabled = false,
}: {
  label: string;
  detail?: string;
  value?: string;
  icon?: IconName;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[label, value, detail].filter(Boolean).join(', ')}
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
      ]}
    >
      {icon && <Icon name={icon} size={20} color="#999999" />}
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={styles.label}>{label}</Text>
        {detail && <Text style={styles.note}>{detail}</Text>}
      </View>
      {value && <Text style={styles.value}>{value}</Text>}
      <View style={{ transform: [{ rotate: '-90deg' }] }}>
        <Icon name="chevron" size={16} color="#777777" />
      </View>
    </Pressable>
  );
}
function Toggle({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onChange: (value: boolean) => void;
  disabled: boolean;
}) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { flex: 1 }]}>{label}</Text>
      <Switch
        accessibilityLabel={label}
        disabled={disabled}
        value={value}
        onValueChange={onChange}
        trackColor={{ false: '#303030', true: '#74BBA5' }}
        thumbColor="#FFFFFF"
        ios_backgroundColor="#303030"
      />
    </View>
  );
}
function Choice<T extends string>({
  label,
  value,
  options,
  onChange,
  disabled,
}: {
  label: string;
  value: T;
  options: readonly { value: T; label: string }[];
  onChange: (value: T) => void;
  disabled: boolean;
}) {
  const { fontScale } = useAppWindowDimensions();
  return (
    <View style={styles.control}>
      <Text style={styles.label}>{label}</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4 }}>
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
              flexBasis: 74 * Math.max(1, fontScale),
              minHeight: 44,
              paddingHorizontal: 8,
              paddingVertical: 8,
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: value === option.value ? '#74BBA520' : '#1B1B1B',
              opacity: disabled ? 0.4 : pressed ? 0.6 : 1,
            })}
          >
            <Text
              style={{
                fontSize: 14,
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
export function SettingsScreen(p: Props) {
  const disabled = !!p.snapshot.error || p.snapshot.busy || p.backupBusy;
  const count = p.snapshot.replay.state.habits.filter((h) => h.archived).length;
  return (
    <ScrollView
      key={p.page}
      contentContainerStyle={styles.body}
      showsVerticalScrollIndicator={false}
    >
      {p.snapshot.error && (
        <View style={{ gap: 8 }}>
          <Text accessibilityRole="alert" style={styles.note}>
            {p.snapshot.error}
          </Text>
          <Row label="Retry saving" onPress={p.onRetry} />
        </View>
      )}
      {p.page === 'index' && (
        <>
          <Group title="Preferences">
            <Row
              icon="palette"
              label="Appearance"
              detail="Text size and grid spacing"
              onPress={() => p.onPage('appearance')}
            />
            <Row
              icon="checked"
              label="Daily tracking"
              detail="Completed habits, calendar and feedback"
              onPress={() => p.onPage('tracking')}
            />
          </Group>
          <Group title="Your data">
            <Row
              icon="archive"
              label="Archived habits"
              value={String(count)}
              onPress={p.onArchive}
            />
            <Row
              icon="history"
              label="Backups"
              detail={
                p.sampleData
                  ? 'Available with your saved data'
                  : 'Export and restore your records'
              }
              onPress={() => p.onPage('backup')}
            />
          </Group>
          {p.developmentControls && (
            <Group>
              <Row
                icon="settings"
                label="Development"
                detail="Sample data and previews"
                onPress={() => p.onPage('development')}
              />
            </Group>
          )}
          <Text style={styles.footer}>OnPurpose</Text>
        </>
      )}
      {p.page === 'appearance' && (
        <>
          <Group>
            <Choice
              label="Name column width"
              value={p.nameColumnWidth}
              options={nameColumnWidthOptions}
              onChange={p.onNameColumnWidthChange}
              disabled={disabled}
            />
            <Choice
              label="Column spacing"
              value={p.columnSpacing}
              options={columnSpacingOptions}
              onChange={p.onColumnSpacingChange}
              disabled={disabled}
            />
            <Choice
              label="Row spacing"
              value={p.rowSpacing}
              options={rowSpacingOptions}
              onChange={p.onRowSpacingChange}
              disabled={disabled}
            />
            <View style={styles.control}>
              <TextSizeSetting
                compact
                key={p.textScale}
                value={p.textScale}
                editable={!disabled}
                onChange={p.onTextScaleChange}
              />
            </View>
          </Group>
          <Group>
            <Choice
              label="Checkbox style"
              value={p.checkboxStyle}
              options={checkboxStyleOptions}
              onChange={p.onCheckboxStyleChange}
              disabled={disabled}
            />
            <Toggle
              label="Week dividers"
              value={p.weekDividers}
              onChange={p.onWeekDividersChange}
              disabled={disabled}
            />
            <Toggle
              label="Tap animations"
              value={p.tapAnimations}
              onChange={p.onTapAnimationsChange}
              disabled={disabled}
            />
            <Toggle
              label="Fade distant dates"
              value={p.dateFading}
              onChange={p.onDateFadingChange}
              disabled={disabled}
            />
          </Group>
          <InfoNote
            label="About appearance"
            text="Text size applies everywhere and follows your iPhone’s text size too. Recorded entries stay bright when dates fade."
          />
        </>
      )}
      {p.page === 'tracking' && (
        <>
          <Group>
            <Toggle
              label="Hide completed today"
              value={p.hideCompleted}
              onChange={p.onHideCompletedChange}
              disabled={disabled}
            />
            <Toggle
              label="Haptic feedback"
              value={p.hapticsEnabled}
              onChange={p.onHapticsChange}
              disabled={disabled}
            />
            <Choice
              label="Week starts on"
              value={p.weekStart}
              options={weekStartOptions}
              onChange={p.onWeekStartChange}
              disabled={disabled}
            />
          </Group>
          <InfoNote
            label="About daily tracking"
            text="Hidden habits can be shown again on the grid. Past and future dates show the full list. Completion uses each habit’s goal for Today; habits set to Track only stay visible."
          />
        </>
      )}
      {p.page === 'backup' && (
        <>
          {p.sampleData ? (
            <Text style={styles.note}>
              Switch off Sample data in Development to use backups of your saved
              habits.
            </Text>
          ) : (
            <>
              <Text accessibilityLiveRegion="polite" style={styles.note}>
                {p.snapshot.error ??
                  (p.snapshot.pending
                    ? 'Saving your changes…'
                    : 'Saved on this device')}
              </Text>
              <Group>
                <Row
                  label={p.backupBusy ? 'Working…' : 'Export backup'}
                  onPress={p.onExport}
                  disabled={disabled}
                />
                <Row
                  label="Restore backup…"
                  onPress={p.onRestore}
                  disabled={disabled}
                />
                {p.snapshot.hasRecovery && (
                  <Row
                    label="Restore previous data…"
                    onPress={p.onRecover}
                    disabled={disabled}
                  />
                )}
              </Group>
              <InfoNote
                label="About backups"
                text="Backups include your records and change history. Save a copy outside the app. Restoring asks for confirmation and keeps a copy of the data it replaces."
              />
            </>
          )}
        </>
      )}
      {p.page === 'development' && (
        <View
          pointerEvents={p.backupBusy || p.snapshot.busy ? 'none' : 'auto'}
          accessibilityElementsHidden={p.backupBusy || p.snapshot.busy}
        >
          {p.developmentControls}
        </View>
      )}
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  body: {
    padding: 20,
    paddingTop: 12,
    paddingBottom: 32,
    gap: 24,
    width: '100%',
    maxWidth: 660,
    alignSelf: 'center',
  },
  groupTitle: { color: '#888888', fontSize: 13, paddingHorizontal: 4 },
  group: { backgroundColor: '#111111', borderRadius: 14, overflow: 'hidden' },
  row: {
    minHeight: 56,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#242424',
  },
  control: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#242424',
  },
  label: { color: '#DEDEDE', fontSize: 17 },
  value: {
    color: '#999999',
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    flexShrink: 1,
  },
  note: { color: '#929292', fontSize: 13, lineHeight: 19 },
  footer: { color: '#666666', fontSize: 12, paddingHorizontal: 4 },
});
