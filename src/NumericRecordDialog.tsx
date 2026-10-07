import { useMemo, useState, type ComponentType } from 'react';
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
import type { EntryDay } from './calendar';
import type { EntryValues } from './entries';
import type { Habit } from './habits';
import { checkmarkColor } from './colors';
import { feedback } from './haptics';
import { recentNumericTotals } from './numericSuggestions';

// Key the dialog by habit/date. Typing stays local; Done reads the latest store
// precondition through onSave, and Close discards this uncommitted draft.
export function NumericRecordDialog({
  habit,
  day,
  initialValue,
  values,
  editable,
  Heading,
  onClose,
  onSave,
}: {
  habit: Habit;
  day: EntryDay;
  initialValue: number | null;
  values: EntryValues;
  editable: boolean;
  Heading: ComponentType<TextProps>;
  onClose: () => void;
  onSave: (value: number | null) => boolean;
}) {
  const [input, setInput] = useState(
    initialValue === null ? '' : String(initialValue),
  );
  const trimmed = input.trim().replace(',', '.');
  const numeric = Number(trimmed);
  const valid =
    trimmed === '' ||
    (/^\d+(\.\d*)?$/.test(trimmed) &&
      Number.isFinite(numeric) &&
      numeric <= Number.MAX_SAFE_INTEGER);
  const suggestedTotals = useMemo(
    () => recentNumericTotals(values, habit.id, day.key),
    [values, habit.id, day.key],
  );
  const accent = habit.color;
  function saveNumber() {
    if (!valid || !editable) return;
    if (onSave(trimmed === '' ? null : numeric)) onClose();
  }
  return (
    <Modal
      visible
      animationType="fade"
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      transparent
      onRequestClose={onClose}
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
            <Text style={styles.eyebrow}>DAILY TOTAL</Text>
            <Heading style={[styles.dialogTitle, { color: accent }]}>
              {habit.name}
            </Heading>
            <>
              <Text style={styles.secondary}>{day.fullLabel}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  autoFocus
                  keyboardType="decimal-pad"
                  accessibilityLabel={`Daily total${habit.unit ? ` in ${habit.unit}` : ''}`}
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
                  {habit.unit}
                </Text>
              </View>
              {!!suggestedTotals.length && (
                <View
                  style={{
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                    gap: 8,
                    marginBottom: 12,
                  }}
                >
                  {suggestedTotals.map((total) => (
                    <Pressable
                      key={total}
                      accessibilityRole="button"
                      accessibilityLabel={`Use recent total ${total}${habit.unit ? ` ${habit.unit}` : ''}`}
                      accessibilityState={{
                        selected: trimmed !== '' && numeric === total,
                      }}
                      onPress={() => {
                        setInput(String(total));
                        feedback('selection');
                      }}
                      style={{
                        minHeight: 44,
                        minWidth: 52,
                        paddingHorizontal: 14,
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 10,
                        backgroundColor:
                          trimmed !== '' && numeric === total
                            ? `${accent}22`
                            : '#1C1C1C',
                      }}
                    >
                      <Text
                        style={{
                          color: accent,
                          fontSize: 16,
                          fontVariant: ['tabular-nums'],
                        }}
                      >
                        {total}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              )}
              <Text style={styles.secondary}>
                {valid
                  ? 'Leave blank to clear this entry.'
                  : 'Enter a number of zero or more.'}
              </Text>
              <View style={styles.actions}>
                <Pressable
                  accessibilityRole="button"
                  onPress={onClose}
                  style={styles.action}
                >
                  <Text style={styles.actionText}>Close</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ disabled: !valid || !editable }}
                  disabled={!valid || !editable}
                  onPress={saveNumber}
                  style={[
                    styles.action,
                    styles.primaryAction,
                    {
                      backgroundColor: accent,
                      opacity: valid && editable ? 1 : 0.4,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.primaryActionText,
                      { color: checkmarkColor(accent) },
                    ]}
                  >
                    Done
                  </Text>
                </Pressable>
              </View>
            </>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
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
