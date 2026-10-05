import {
  memo,
  useCallback,
  useMemo,
  type ComponentType,
  type ReactNode,
} from 'react';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  View,
  type TextProps,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Text } from './Typography';
import { DescriptionText } from './DescriptionText';
import {
  descriptionReadingPassages,
  type ReadingPassage,
} from './descriptionReading';
import type { Habit } from './habits';

export const DescriptionReader = memo(function DescriptionReader({
  habit,
  Heading,
  editable,
  onEdit,
  onClose,
  children,
}: {
  habit: Habit;
  Heading: ComponentType<TextProps>;
  editable: boolean;
  onEdit: () => void;
  onClose: () => void;
  children?: ReactNode;
}) {
  const passages = useMemo(
    () => descriptionReadingPassages(habit.description ?? ''),
    [habit.description],
  );
  const render = useCallback(
    ({ item }: { item: ReadingPassage }) => (
      <DescriptionText tokens={item.tokens} colour={habit.color} />
    ),
    [habit.color],
  );
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
              accessibilityLabel="Close note and return to statistics"
              onPress={onClose}
              style={styles.action}
            >
              <Text style={styles.actionText}>Close</Text>
            </Pressable>
            <View
              style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}
            >
              <Heading
                accessibilityRole="header"
                numberOfLines={1}
                style={styles.title}
              >
                {habit.name}
              </Heading>
              <Text style={styles.subtitle}>Notes</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Edit description"
              accessibilityState={{ disabled: !editable }}
              disabled={!editable}
              onPress={onEdit}
              style={[
                styles.action,
                { alignItems: 'flex-end', opacity: editable ? 1 : 0.35 },
              ]}
            >
              <Text style={styles.actionText}>Edit</Text>
            </Pressable>
          </View>
          <FlatList
            data={passages}
            keyExtractor={(item) => item.key}
            renderItem={render}
            initialNumToRender={8}
            maxToRenderPerBatch={6}
            updateCellsBatchingPeriod={16}
            windowSize={7}
            contentContainerStyle={styles.body}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={<Text style={styles.empty}>No note yet.</Text>}
          />
          {children}
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
});
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#000000' },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    gap: 8,
  },
  action: { minHeight: 44, minWidth: 60, justifyContent: 'center' },
  actionText: { color: '#BBBBBB', fontSize: 15 },
  title: { color: '#DDDDDD', fontSize: 15, fontWeight: '600' },
  subtitle: { color: '#777777', fontSize: 12, marginTop: 3 },
  body: {
    padding: 24,
    paddingBottom: 40,
    width: '100%',
    maxWidth: 720,
    alignSelf: 'center',
  },
  empty: { color: '#929292', fontSize: 15 },
});
