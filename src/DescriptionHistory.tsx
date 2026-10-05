import { useState, type ComponentType } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  View,
  type TextProps,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { DescriptionText } from './DescriptionText';
import type { HistoryAction, StoredState } from './storage/model';

export function DescriptionHistory({
  Heading,
  action,
  state,
  editable,
  onRestore,
  onClose,
}: {
  Heading: ComponentType<TextProps>;
  action: HistoryAction;
  state: StoredState;
  editable: boolean;
  onRestore: (id: string, text: string | undefined) => boolean;
  onClose: () => void;
}) {
  const [version, setVersion] = useState<'before' | 'after'>('after');
  const change = action.change;
  if (change.kind !== 'habit') return null;
  const habit = change.after ?? change.before!;
  const text = change[version]?.description;
  const current = state.habits.find((item) => item.id === habit.id);
  const canRestore = editable && !!current && current.description !== text;
  return (
    <Modal
      visible
      presentationStyle="fullScreen"
      animationType="slide"
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      onRequestClose={onClose}
    >
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1, backgroundColor: '#000000' }}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingHorizontal: 14,
            }}
          >
            <Pressable
              accessibilityRole="button"
              onPress={onClose}
              style={{ minWidth: 60, minHeight: 48, justifyContent: 'center' }}
            >
              <Text style={{ color: '#BBBBBB', fontSize: 15 }}>Close</Text>
            </Pressable>
            <View
              style={{ flex: 1, alignItems: 'center', paddingHorizontal: 8 }}
            >
              <Heading
                accessibilityRole="header"
                numberOfLines={1}
                style={{ color: '#DDDDDD', fontSize: 15, fontWeight: '600' }}
              >
                {habit.name}
              </Heading>
              <Text style={{ color: '#777777', fontSize: 12, marginTop: 3 }}>
                Description history
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Restore ${version} description`}
              accessibilityState={{ disabled: !canRestore }}
              disabled={!canRestore}
              onPress={() => {
                if (onRestore(habit.id, text)) onClose();
              }}
              style={{
                minWidth: 60,
                minHeight: 48,
                justifyContent: 'center',
                alignItems: 'flex-end',
                opacity: canRestore ? 1 : 0.35,
              }}
            >
              <Text style={{ color: habit.color, fontSize: 15 }}>Restore</Text>
            </Pressable>
          </View>
          <View
            style={{
              flexDirection: 'row',
              gap: 8,
              paddingHorizontal: 24,
              paddingTop: 8,
            }}
          >
            {(['before', 'after'] as const).map((value) => (
              <Pressable
                key={value}
                accessibilityRole="tab"
                accessibilityState={{ selected: version === value }}
                onPress={() => setVersion(value)}
                style={{
                  flex: 1,
                  minHeight: 44,
                  justifyContent: 'center',
                  alignItems: 'center',
                  borderRadius: 10,
                  backgroundColor: version === value ? '#292929' : '#141414',
                }}
              >
                <Text style={{ color: '#CCCCCC', fontSize: 14 }}>
                  {value === 'before' ? 'Before' : 'After'}
                </Text>
              </Pressable>
            ))}
          </View>
          <Text
            style={{
              color: '#777777',
              fontSize: 12,
              paddingHorizontal: 24,
              paddingTop: 12,
            }}
          >
            {new Date(action.recordedAt).toLocaleString()}
          </Text>
          <ScrollView contentContainerStyle={{ padding: 24, flexGrow: 1 }}>
            {text ? (
              <DescriptionText text={text} colour={habit.color} />
            ) : (
              <Text style={{ color: '#888888', fontSize: 15 }}>
                No description in this version.
              </Text>
            )}
          </ScrollView>
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
