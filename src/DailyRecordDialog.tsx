import { useState, type ComponentType } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type TextProps,
} from 'react-native';
import { Text, TextInput } from './Typography';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { colorOnBlack, contrastOnBlack } from './colors';
import type { Habit } from './habits';
import type { EntryDay } from './calendar';
import {
  categorySelection,
  textEntry,
  MAX_ENTRY_TEXT,
  type EntryValue,
} from './entries';
import { feedback } from './haptics';

export function DailyRecordDialog({
  habit,
  day,
  value,
  editable,
  Heading,
  onClose,
  onSave,
}: {
  habit: Habit;
  day: EntryDay;
  value: EntryValue | undefined;
  editable: boolean;
  Heading: ComponentType<TextProps>;
  onClose: () => void;
  onSave: (value: EntryValue | null) => boolean;
}) {
  const [text, setText] = useState(typeof value === 'string' ? value : '');
  const [selected, setSelected] = useState<string[]>(
    Array.isArray(value) ? value : [],
  );
  const categorical = habit.type === 'categorical';
  const accent = contrastOnBlack(habit.color) >= 4.5 ? habit.color : '#DDDDDD';
  return (
    <Modal
      visible
      animationType="slide"
      transparent
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
    >
      <SafeAreaProvider>
        <KeyboardAvoidingView
          style={styles.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <SafeAreaView
            edges={['bottom', 'left', 'right']}
            style={styles.sheet}
            accessibilityViewIsModal
          >
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close entry without applying changes"
                onPress={onClose}
                style={styles.action}
              >
                <Text style={styles.control}>Close</Text>
              </Pressable>
              <View style={styles.title}>
                <Heading
                  numberOfLines={1}
                  style={[styles.name, { color: accent }]}
                >
                  {habit.name}
                </Heading>
                <Text style={styles.date}>{day.fullLabel}</Text>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={!editable}
                accessibilityState={{ disabled: !editable }}
                onPress={() => {
                  if (
                    onSave(
                      categorical
                        ? categorySelection(selected)
                        : textEntry(text),
                    )
                  )
                    onClose();
                }}
                style={styles.action}
              >
                <Text
                  style={[
                    styles.control,
                    { color: accent, opacity: editable ? 1 : 0.35 },
                  ]}
                >
                  Done
                </Text>
              </Pressable>
            </View>
            <ScrollView
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={styles.body}
            >
              {categorical ? (
                <View style={styles.options}>
                  {habit.categories
                    ?.filter(
                      (option) =>
                        !option.archived ||
                        (Array.isArray(value) && value.includes(option.id)),
                    )
                    .map((option) => {
                      const checked = selected.includes(option.id);
                      return (
                        <Pressable
                          key={option.id}
                          accessibilityRole="checkbox"
                          aria-checked={checked}
                          accessibilityState={{ checked, disabled: !editable }}
                          accessibilityLabel={`${option.label}${option.archived ? ', archived category' : ''}`}
                          disabled={!editable}
                          onPress={() => {
                            setSelected((previous) =>
                              previous.includes(option.id)
                                ? previous.filter((id) => id !== option.id)
                                : [...previous, option.id],
                            );
                            feedback('selection');
                          }}
                          style={[
                            styles.option,
                            {
                              borderColor: checked
                                ? `${habit.color}66`
                                : '#303030',
                              backgroundColor: checked
                                ? colorOnBlack(habit.color, 0.15)
                                : '#191919',
                            },
                          ]}
                        >
                          <Icon
                            name={checked ? 'checked' : 'unchecked'}
                            color={checked ? accent : '#777777'}
                            size={18}
                          />
                          <Text
                            style={[
                              styles.optionLabel,
                              { color: checked ? accent : '#C0C0C0' },
                            ]}
                          >
                            {option.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                </View>
              ) : (
                <TextInput
                  autoFocus
                  editable={editable}
                  multiline
                  scrollEnabled
                  accessibilityLabel={`Daily text for ${habit.name}`}
                  value={text}
                  onChangeText={setText}
                  maxLength={MAX_ENTRY_TEXT}
                  selectionColor={habit.color}
                  placeholder="Write an entry…"
                  placeholderTextColor="#666666"
                  style={styles.input}
                  textAlignVertical="top"
                />
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Clear daily entry"
                disabled={
                  !editable || (categorical ? !selected.length : !text.length)
                }
                onPress={() => {
                  setText('');
                  setSelected([]);
                }}
                style={styles.clear}
              >
                <Icon name="erase" size={17} color="#909090" />
                <Text style={styles.clearLabel}>Clear entry</Text>
              </Pressable>
            </ScrollView>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </SafeAreaProvider>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#101010',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 12,
  },
  action: { minHeight: 48, minWidth: 44, justifyContent: 'center' },
  control: { color: '#B8B8B8', fontSize: 15 },
  title: { flex: 1, gap: 3, alignItems: 'center' },
  name: { fontSize: 17, fontWeight: '600' },
  date: { fontSize: 11, color: '#818181', textAlign: 'center' },
  body: { padding: 20, paddingBottom: 24, gap: 12 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  option: {
    flexDirection: 'row',
    gap: 9,
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    minHeight: 48,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
    maxWidth: '100%',
  },
  optionLabel: { fontSize: 15, flexShrink: 1 },
  input: {
    color: '#DDDDDD',
    backgroundColor: '#191919',
    borderRadius: 14,
    padding: 14,
    fontSize: 17,
    minHeight: 160,
    maxHeight: 320,
  },
  clear: { minHeight: 44, flexDirection: 'row', gap: 8, alignItems: 'center' },
  clearLabel: { color: '#909090', fontSize: 13 },
});
