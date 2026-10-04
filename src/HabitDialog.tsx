import { useState, type ComponentType } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextProps,
} from 'react-native';
import { ColourPicker } from './ColourPicker';
import { isNumericHabit, type Habit } from './habits';
import { Icon } from './Icon';
import { calendarDay, localDateKey } from './calendar';

export type HabitDialogMode = 'stats' | 'colour' | 'edit' | 'create';
export function HabitDialog({
  habit,
  mode,
  values,
  today,
  Heading,
  onClose,
  onSave,
  onColour,
  onEdit,
  editable,
}: {
  habit: Habit;
  mode: HabitDialogMode;
  values: Record<string, number>;
  today: string;
  Heading: ComponentType<TextProps>;
  onClose: () => void;
  onSave: (habit: Habit) => boolean;
  onColour: (colour: string) => boolean;
  onEdit: () => void;
  editable: boolean;
}) {
  const [name, setName] = useState(habit.name),
    [unit, setUnit] = useState(habit.unit ?? ''),
    [numeric, setNumeric] = useState(isNumericHabit(habit));
  const [colour, setColour] = useState(habit.color),
    [picker, setPicker] = useState(false),
    [pickerDraft, setPickerDraft] = useState(habit.color);
  const valid =
    !!name.trim() && name.trim().length <= 200 && unit.trim().length <= 80;
  const editing = mode === 'edit' || mode === 'create';
  const days = Array.from({ length: 14 }, (_, index) =>
    calendarDay(today, 13 - index),
  );
  const recorded = Object.keys(values).filter(
    (key) =>
      key.startsWith(`${habit.id}:`) && key.slice(habit.id.length + 1) <= today,
  ).length;
  const recent = days.filter(
    (day) => values[`${habit.id}:${localDateKey(day)}`] !== undefined,
  ).length;
  function save() {
    const { unit: _unit, ...base } = habit;
    const after: Habit = {
      ...base,
      name: name.trim(),
      color: colour,
      ...(numeric && unit.trim() ? { unit: unit.trim() } : {}),
      type: numeric ? 'number' : 'checkbox',
    };
    if (onSave(after)) onClose();
  }
  const button = (label: string, onPress: () => void, disabled = false) => (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={[styles.button, { opacity: disabled ? 0.35 : 1 }]}
    >
      <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
  );
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.dialog} accessibilityViewIsModal>
          <View style={styles.header}>
            <Text style={styles.eyebrow}>
              {picker
                ? 'COLOUR'
                : mode === 'stats'
                  ? 'STATISTICS'
                  : mode === 'colour'
                    ? 'COLOUR'
                    : mode === 'create'
                      ? 'NEW HABIT'
                      : 'EDIT HABIT'}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close without applying changes"
              onPress={() => {
                if (picker) setPicker(false);
                else onClose();
              }}
              style={styles.close}
            >
              <Icon name="close" size={19} />
            </Pressable>
          </View>
          <Heading style={[styles.title, { color: habit.color }]}>
            {mode === 'create' ? 'Make it yours' : habit.name}
          </Heading>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {mode === 'colour' || picker ? (
              <ColourPicker
                color={picker ? colour : habit.color}
                onChange={(value) => {
                  if (picker) setPickerDraft(value ?? '');
                  else setColour(value ?? '');
                }}
              />
            ) : editing ? (
              <View style={{ gap: 18 }}>
                <View>
                  <Text style={styles.label}>Name</Text>
                  <TextInput
                    autoFocus={mode === 'create'}
                    accessibilityLabel="Habit name"
                    maxLength={200}
                    value={name}
                    onChangeText={setName}
                    style={styles.input}
                    selectionColor={colour}
                    placeholder="Read a little"
                    placeholderTextColor="#666666"
                  />
                </View>
                {mode === 'create' ? (
                  <View>
                    <Text style={styles.label}>Record as</Text>
                    <View style={styles.types}>
                      {(['checkbox', 'number'] as const).map((type) => (
                        <Pressable
                          key={type}
                          accessibilityRole="button"
                          accessibilityState={{
                            selected: numeric === (type === 'number'),
                          }}
                          onPress={() => setNumeric(type === 'number')}
                          style={[
                            styles.type,
                            {
                              backgroundColor:
                                numeric === (type === 'number')
                                  ? '#303030'
                                  : '#181818',
                            },
                          ]}
                        >
                          <Icon
                            name={type === 'number' ? 'number' : 'checked'}
                            size={18}
                          />
                          <Text style={styles.buttonText}>
                            {type === 'number' ? 'Daily total' : 'Checkbox'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                ) : (
                  <Text style={styles.description}>
                    {numeric ? 'Numeric daily total' : 'Checkbox habit'} · Type
                    is set when creating a habit.
                  </Text>
                )}
                {numeric && (
                  <View>
                    <Text style={styles.label}>Unit · optional</Text>
                    <TextInput
                      accessibilityLabel="Habit unit"
                      value={unit}
                      maxLength={80}
                      onChangeText={setUnit}
                      style={styles.input}
                      placeholder="minutes, pages, glasses…"
                      placeholderTextColor="#666666"
                    />
                  </View>
                )}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Choose habit colour"
                  onPress={() => {
                    setPickerDraft(colour);
                    setPicker(true);
                  }}
                  style={[
                    styles.button,
                    { flexDirection: 'row', justifyContent: 'space-between' },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: 10,
                    }}
                  >
                    <View
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 9,
                        backgroundColor: colour,
                      }}
                    />
                    <Text style={styles.buttonText}>Colour</Text>
                  </View>
                  <Text style={styles.description}>{colour}</Text>
                </Pressable>
              </View>
            ) : (
              <View style={{ gap: 20 }}>
                <View style={styles.stats}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statValue}>
                      {recent}
                      <Text style={styles.description}> / 14</Text>
                    </Text>
                    <Text style={styles.description}>Recent days recorded</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.statValue}>{recorded}</Text>
                    <Text style={styles.description}>Days recorded</Text>
                  </View>
                </View>
                <Text style={styles.label}>LAST TWO WEEKS</Text>
                <View style={styles.calendar}>
                  {days.map((day) => {
                    const key = localDateKey(day),
                      value = values[`${habit.id}:${key}`];
                    return (
                      <View
                        key={key}
                        accessible
                        accessibilityLabel={`${day.toLocaleDateString()}, ${value === undefined ? 'not recorded' : isNumericHabit(habit) ? `${value} ${habit.unit ?? ''}` : 'checked'}`}
                        style={styles.day}
                      >
                        <Text style={styles.dayLabel}>
                          {day.toLocaleDateString(undefined, {
                            weekday: 'narrow',
                          })}
                        </Text>
                        <Text
                          style={[
                            styles.dayValue,
                            {
                              color:
                                value === undefined ? '#777777' : habit.color,
                              backgroundColor:
                                value === undefined
                                  ? '#171717'
                                  : `${habit.color}20`,
                            },
                          ]}
                        >
                          {isNumericHabit(habit)
                            ? value === undefined
                              ? '—'
                              : String(value)
                            : value === 1
                              ? '✓'
                              : String(day.getDate())}
                        </Text>
                      </View>
                    );
                  })}
                </View>
                <Text style={styles.description}>
                  Future entries are excluded. Streaks and goal-based statistics
                  are coming next.
                </Text>
                {button('Edit habit', onEdit, !editable)}
              </View>
            )}
          </ScrollView>
          {(editing || mode === 'colour' || picker) && (
            <View style={styles.footer}>
              {button(
                'Done',
                () => {
                  if (picker) {
                    setColour(pickerDraft);
                    setPicker(false);
                  } else if (mode === 'colour') {
                    if (onColour(colour)) onClose();
                  } else save();
                },
                !editable ||
                  ((picker || mode === 'colour') &&
                    !/^#[0-9a-f]{6}$/i.test(picker ? pickerDraft : colour)) ||
                  (editing && !picker && !valid),
              )}
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#000000BB',
    padding: 24,
    justifyContent: 'center',
  },
  dialog: {
    backgroundColor: '#101010',
    borderColor: '#2A2A2A',
    borderWidth: 1,
    padding: 24,
    borderRadius: 24,
    width: '100%',
    maxWidth: 440,
    maxHeight: '90%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: -10,
  },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: -10,
  },
  eyebrow: {
    color: '#929292',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  title: { fontSize: 26, fontWeight: '600', marginBottom: 18 },
  label: { color: '#AAAAAA', fontSize: 12, marginBottom: 8 },
  description: { color: '#999999', fontSize: 12, lineHeight: 18 },
  input: {
    backgroundColor: '#1C1C1C',
    borderRadius: 12,
    padding: 14,
    fontSize: 17,
    color: '#E5E5E5',
  },
  button: {
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#202020',
    borderRadius: 12,
    padding: 12,
  },
  buttonText: { color: '#DDDDDD', fontSize: 15, fontWeight: '500' },
  types: { flexDirection: 'row', gap: 8 },
  type: {
    flex: 1,
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    padding: 10,
  },
  footer: {
    paddingTop: 16,
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#303030',
  },
  stats: { flexDirection: 'row', gap: 16 },
  statValue: { fontSize: 30, color: '#DDDDDD', fontVariant: ['tabular-nums'] },
  calendar: { flexDirection: 'row', flexWrap: 'wrap' },
  day: { width: '14.2857%', alignItems: 'center', paddingBottom: 12, gap: 5 },
  dayLabel: { fontSize: 10, color: '#888888' },
  dayValue: {
    fontSize: 13,
    textAlign: 'center',
    width: '90%',
    paddingVertical: 10,
    borderRadius: 9,
    fontVariant: ['tabular-nums'],
  },
});
