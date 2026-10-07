import { useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Text, TextInput } from './Typography';
import { localDateKey } from './calendar';
import { validTimingDate } from './goalTiming';

export function DateNavigationSheet({
  date,
  today,
  onClose,
  onChoose,
}: {
  date: string;
  today: string;
  onClose: () => void;
  onChoose: (date: string) => void;
}) {
  const [chosen, setChosen] = useState(date);
  const insets = useSafeAreaInsets();
  const valid = validTimingDate(chosen);
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      onRequestClose={onClose}
    >
      <View
        style={[
          styles.overlay,
          {
            paddingTop: Math.max(16, insets.top),
            paddingBottom: Math.max(16, insets.bottom),
          },
        ]}
      >
        <View accessibilityViewIsModal style={styles.card}>
          <View style={styles.header}>
            <Text accessibilityRole="header" style={styles.title}>
              Jump to date
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close date picker"
              onPress={onClose}
              style={styles.action}
            >
              <Text style={styles.secondary}>Close</Text>
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 12 }}
          >
            {Platform.OS === 'web' ? (
              <TextInput
                accessibilityLabel="Jump to date"
                value={chosen}
                onChangeText={setChosen}
                placeholder="YYYY-MM-DD"
                maxLength={10}
                style={styles.input}
              />
            ) : (
              <DateTimePicker
                accessibilityLabel="Choose grid date"
                value={new Date(`${chosen}T12:00:00`)}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                themeVariant="dark"
                accentColor="#DDDDDD"
                onValueChange={(_, value) => setChosen(localDateKey(value))}
              />
            )}
          </ScrollView>
          <View style={styles.actions}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Jump to today"
              onPress={() => onChoose(today)}
              style={styles.action}
            >
              <Text style={styles.secondary}>Today</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Go to selected date"
              disabled={!valid}
              accessibilityState={{ disabled: !valid }}
              onPress={() => {
                if (valid) onChoose(chosen);
              }}
              style={[
                styles.action,
                styles.primary,
                { opacity: valid ? 1 : 0.4 },
              ]}
            >
              <Text
                style={{ color: '#000000', fontSize: 15, fontWeight: '600' }}
              >
                Go to date
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#00000099',
    paddingHorizontal: 18,
  },
  card: {
    width: '100%',
    maxWidth: 430,
    maxHeight: '100%',
    backgroundColor: '#121212',
    borderRadius: 20,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 6,
  },
  title: { color: '#EEEEEE', fontSize: 19, fontWeight: '600', flexShrink: 1 },
  action: {
    minHeight: 44,
    minWidth: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
  },
  secondary: { color: '#BBBBBB', fontSize: 15 },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    padding: 16,
  },
  primary: { backgroundColor: '#DDDDDD', borderRadius: 10 },
  input: {
    marginTop: 16,
    color: '#EEEEEE',
    fontSize: 18,
    backgroundColor: '#1C1C1C',
    borderRadius: 10,
    minHeight: 48,
    paddingHorizontal: 12,
  },
});
