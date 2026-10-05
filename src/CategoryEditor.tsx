import { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { randomUUID } from 'expo-crypto';
import { Text, TextInput, useAppWindowDimensions } from './Typography';
import { Icon } from './Icon';
import type { HabitCategory } from './habits';
import {
  MAX_CATEGORIES,
  MAX_CATEGORY_LABEL,
  MAX_CATEGORY_SHORT_LABEL,
} from './entries';

export function CategoryEditor({
  categories,
  colour,
  onClose,
  onApply,
}: {
  categories: HabitCategory[];
  colour: string;
  onClose: () => void;
  onApply: (categories: HabitCategory[]) => void;
}) {
  const [options, setOptions] = useState(categories);
  const { width, fontScale } = useAppWindowDimensions();
  const stacked = width < 360 || fontScale > 1.3;
  const valid =
    options.length > 0 &&
    options.some((option) => !option.archived) &&
    options.every((option) => option.label.trim());
  const update = (id: string, fields: Partial<HabitCategory>) =>
    setOptions((previous) =>
      previous.map((option) =>
        option.id === id ? { ...option, ...fields } : option,
      ),
    );
  return (
    <Modal
      visible
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          >
            <View style={styles.header}>
              <Pressable
                accessibilityRole="button"
                onPress={onClose}
                style={styles.action}
              >
                <Text style={styles.control}>Close</Text>
              </Pressable>
              <Text accessibilityRole="header" style={styles.heading}>
                Categories
              </Text>
              <Pressable
                accessibilityRole="button"
                disabled={!valid}
                accessibilityState={{ disabled: !valid }}
                style={styles.action}
                onPress={() =>
                  onApply(
                    options.map(({ shortLabel, ...option }) => ({
                      ...option,
                      label: option.label.trim(),
                      ...(shortLabel?.trim()
                        ? { shortLabel: shortLabel.trim() }
                        : {}),
                    })),
                  )
                }
              >
                <Text
                  style={[
                    styles.control,
                    { color: colour, opacity: valid ? 1 : 0.35 },
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
              {options.map((option) => (
                <View
                  key={option.id}
                  style={[
                    styles.option,
                    { opacity: option.archived ? 0.6 : 1 },
                  ]}
                >
                  <View
                    style={[
                      styles.fields,
                      { flexDirection: stacked ? 'column' : 'row' },
                    ]}
                  >
                    <TextInput
                      accessibilityLabel={`Category name ${option.label || 'new category'}`}
                      value={option.label}
                      maxLength={MAX_CATEGORY_LABEL}
                      onChangeText={(label) => update(option.id, { label })}
                      placeholder="Category name"
                      placeholderTextColor="#707070"
                      style={[styles.name, !stacked && { flex: 1 }]}
                      selectionColor={colour}
                    />
                    <TextInput
                      accessibilityLabel={`Short grid label for ${option.label || 'new category'}`}
                      value={option.shortLabel ?? ''}
                      maxLength={MAX_CATEGORY_SHORT_LABEL}
                      onChangeText={(shortLabel) =>
                        update(option.id, { shortLabel })
                      }
                      placeholder="Short label"
                      accessibilityHint="Optional abbreviation shown in grid cells"
                      placeholderTextColor="#707070"
                      style={[
                        styles.short,
                        !stacked && { width: 90 * fontScale },
                      ]}
                      selectionColor={colour}
                    />
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${option.archived ? 'Restore' : 'Archive'} category ${option.label || 'new category'}`}
                    onPress={() =>
                      option.label.trim()
                        ? update(option.id, { archived: !option.archived })
                        : setOptions((previous) =>
                            previous.filter((item) => item.id !== option.id),
                          )
                    }
                    style={styles.icon}
                  >
                    <Icon
                      name={option.archived ? 'undo' : 'archive'}
                      size={18}
                      color={option.archived ? colour : '#999999'}
                    />
                  </Pressable>
                </View>
              ))}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Add category"
                disabled={options.length >= MAX_CATEGORIES}
                accessibilityState={{
                  disabled: options.length >= MAX_CATEGORIES,
                }}
                onPress={() =>
                  setOptions((previous) => [
                    ...previous,
                    { id: randomUUID(), label: '' },
                  ])
                }
                style={styles.add}
              >
                <Icon name="plus" color={colour} size={18} />
                <Text style={[styles.control, { color: colour }]}>
                  Add category
                </Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    gap: 10,
    minHeight: 56,
  },
  heading: {
    flex: 1,
    textAlign: 'center',
    color: '#DDDDDD',
    fontSize: 17,
    fontWeight: '600',
  },
  action: { minHeight: 44, minWidth: 48, justifyContent: 'center' },
  control: { color: '#BBBBBB', fontSize: 15 },
  body: {
    padding: 20,
    paddingBottom: 36,
    gap: 12,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    backgroundColor: '#151515',
    borderRadius: 14,
  },
  fields: { flex: 1, gap: 4 },
  name: {
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
    color: '#EEEEEE',
    fontSize: 16,
  },
  short: {
    minHeight: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
    color: '#AAAAAA',
    fontSize: 13,
  },
  icon: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: { flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 48 },
});
