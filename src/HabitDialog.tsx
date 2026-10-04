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
import { HabitIconPicker } from './HabitIconPicker';
import { HabitSymbol } from './HabitSymbol';
import { habitIconLabel, type HabitIcon } from './habitIcons';

export type HabitDialogMode = 'colour' | 'edit' | 'create';
export function HabitDialog({
  habit,
  mode,
  Heading,
  onClose,
  onSave,
  onColour,
  editable,
}: {
  habit: Habit;
  mode: HabitDialogMode;
  Heading: ComponentType<TextProps>;
  onClose: () => void;
  onSave: (habit: Habit) => boolean;
  onColour: (colour: string) => boolean;
  editable: boolean;
}) {
  const [name, setName] = useState(habit.name),
    [unit, setUnit] = useState(habit.unit ?? ''),
    [numeric, setNumeric] = useState(isNumericHabit(habit));
  const [colour, setColour] = useState(habit.color),
    [picker, setPicker] = useState(false),
    [pickerDraft, setPickerDraft] = useState(habit.color);
  const [icon, setIcon] = useState(habit.icon);
  const [iconPicker, setIconPicker] = useState(false);
  const [iconDraft, setIconDraft] = useState<HabitIcon | undefined | null>(
    habit.icon,
  );
  const valid =
    !!name.trim() && name.trim().length <= 200 && unit.trim().length <= 80;
  const editing = mode === 'edit' || mode === 'create';
  function save() {
    const { unit: _unit, icon: _icon, ...base } = habit;
    const after: Habit = {
      ...base,
      name: name.trim(),
      color: colour,
      ...(icon ? { icon } : {}),
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
              {iconPicker
                ? 'ICON'
                : picker
                  ? 'COLOUR'
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
                if (iconPicker) setIconPicker(false);
                else if (picker) setPicker(false);
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
            key={iconPicker ? 'icon' : picker ? 'colour' : 'form'}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {iconPicker ? (
              <HabitIconPicker
                icon={icon}
                colour={colour}
                onChange={setIconDraft}
              />
            ) : mode === 'colour' || picker ? (
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
                  accessibilityLabel={`Habit icon, ${habitIconLabel(icon)}`}
                  onPress={() => {
                    setIconDraft(icon);
                    setIconPicker(true);
                  }}
                  style={[
                    styles.button,
                    {
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      gap: 12,
                    },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      gap: 10,
                      alignItems: 'center',
                    }}
                  >
                    <HabitSymbol icon={icon} colour={colour} />
                    <Text style={styles.buttonText}>Icon</Text>
                  </View>
                  <Text style={styles.description}>{habitIconLabel(icon)}</Text>
                </Pressable>
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
            ) : null}
          </ScrollView>
          {(editing || mode === 'colour' || picker) && (
            <View style={styles.footer}>
              {button(
                'Done',
                () => {
                  if (iconPicker) {
                    if (iconDraft !== null) {
                      setIcon(iconDraft);
                      setIconPicker(false);
                    }
                  } else if (picker) {
                    setColour(pickerDraft);
                    setPicker(false);
                  } else if (mode === 'colour') {
                    if (onColour(colour)) onClose();
                  } else save();
                },
                !editable ||
                  (iconPicker && iconDraft === null) ||
                  ((picker || mode === 'colour') &&
                    !/^#[0-9a-f]{6}$/i.test(picker ? pickerDraft : colour)) ||
                  (editing && !picker && !iconPicker && !valid),
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
});
