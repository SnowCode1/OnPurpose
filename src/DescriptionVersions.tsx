import { Text } from './Typography';
import { Icon } from './Icon';
import { useState, type ComponentType } from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type TextProps,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DescriptionHistory } from './DescriptionHistory';
import { contrastOnBlack } from './colors';
import { descriptionExcerpt } from './descriptionReading';
import type { Habit } from './habits';
import type { HistoryAction, StoredState } from './storage/model';

export function DescriptionVersions({
  habit,
  actions,
  state,
  editable,
  Heading,
  onRestore,
  onClose,
}: {
  habit: Habit;
  actions: HistoryAction[];
  state: StoredState;
  editable: boolean;
  Heading: ComponentType<TextProps>;
  onRestore: (id: string, text: string | undefined) => boolean;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<HistoryAction | null>(null);
  const currentVersion = actions.find(
    (action) =>
      action.change.kind === 'habit' &&
      action.change.after?.description === habit.description,
  );
  const accent = contrastOnBlack(habit.color) >= 4.5 ? habit.color : '#B7DCCF';
  return (
    <Modal
      visible
      presentationStyle="fullScreen"
      animationType="slide"
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView style={styles.screen}>
          <View style={styles.header}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Close"
              onPress={onClose}
              style={styles.close}
            >
              <Icon name="close" />
            </Pressable>
            <View style={styles.title}>
              <Heading
                accessibilityRole="header"
                numberOfLines={1}
                style={styles.heading}
              >
                {habit.name}
              </Heading>
              <Text style={styles.subtitle}>Previous versions</Text>
            </View>
            <View style={{ width: 60 }} />
          </View>
          <FlatList
            data={actions}
            keyExtractor={(action) => action.id}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
            ListEmptyComponent={
              <Text style={styles.empty}>No description changes yet.</Text>
            }
            renderItem={({ item }) => {
              if (item.change.kind !== 'habit') return null;
              const text = item.change.after?.description;
              const current = item.id === currentVersion?.id;
              const summary = text
                ? descriptionExcerpt(text)
                : 'Description cleared';
              const date = new Date(item.recordedAt).toLocaleString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              });
              return (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`${summary}, ${date}${current ? ', current version' : ''}`}
                  onPress={() => setSelected(item)}
                  style={({ pressed }) => [
                    styles.row,
                    pressed && { opacity: 0.6 },
                  ]}
                >
                  <View style={styles.rowHeader}>
                    <Text style={styles.date}>{date}</Text>
                    {current && (
                      <Text style={[styles.current, { color: accent }]}>
                        Current
                      </Text>
                    )}
                  </View>
                  <Text numberOfLines={2} style={styles.summary}>
                    {summary}
                  </Text>
                </Pressable>
              );
            }}
          />
          {selected && (
            <DescriptionHistory
              key={selected.id}
              action={selected}
              state={state}
              editable={editable}
              Heading={Heading}
              onRestore={onRestore}
              onClose={() => setSelected(null)}
            />
          )}
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
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  close: { minWidth: 60, minHeight: 48, justifyContent: 'center' },
  title: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  heading: { color: '#DDDDDD', fontSize: 15, fontWeight: '600' },
  subtitle: { color: '#777777', fontSize: 12, marginTop: 3 },
  row: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#242424',
  },
  rowHeader: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  date: { color: '#929292', fontSize: 12 },
  current: { fontSize: 12 },
  summary: { color: '#CCCCCC', fontSize: 15, lineHeight: 21 },
  empty: { color: '#888888', fontSize: 15, paddingVertical: 24 },
});
