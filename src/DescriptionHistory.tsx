import { Text } from './Typography';
import {
  useMemo,
  useState,
  useEffect,
  useRef,
  useCallback,
  type ComponentType,
} from 'react';
import {
  Modal,
  Pressable,
  FlatList,
  Switch,
  View,
  type TextProps,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useReducedMotion } from 'react-native-reanimated';
import {
  descriptionChangeNavigator,
  type DescriptionScrollPort,
} from './descriptionChangeNavigation';
import { descriptionDiff, type DescriptionPassage } from './descriptionDiff';
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
  const [showChanges, setShowChanges] = useState(true);
  const change = action.change;
  const diff = useMemo(
    () =>
      descriptionDiff(
        change.kind === 'habit' ? (change.before?.description ?? '') : '',
        change.kind === 'habit' ? (change.after?.description ?? '') : '',
      ),
    [change],
  );
  const list = useRef<FlatList<DescriptionPassage>>(null);
  const reducedMotion = useReducedMotion();
  const scroll: DescriptionScrollPort = {
    scrollToIndex: (options) => list.current?.scrollToIndex(options),
    scrollToOffset: (options) => list.current?.scrollToOffset(options),
  };
  const navigator = useMemo(
    () => descriptionChangeNavigator(diff[version], reducedMotion),
    [diff, version, reducedMotion],
  );
  useEffect(() => {
    navigator.activate();
    return () => navigator.dispose();
  }, [navigator]);
  const onViewableItemsChanged = useCallback(
    ({ viewableItems }: { viewableItems: { index: number | null }[] }) => {
      const index = viewableItems.find((item) => item.index !== null)?.index;
      if (index !== undefined && index !== null) navigator.visible(index);
    },
    [navigator],
  );
  const hasChanges = diff[version].some((passage) => passage.changed);
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
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              paddingHorizontal: 24,
              paddingTop: 10,
            }}
          >
            <Text
              style={{ color: '#888888', fontSize: 12, flex: 1, minWidth: 90 }}
            >
              {new Date(action.recordedAt).toLocaleString()}
            </Text>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: 8,
                flexShrink: 1,
              }}
            >
              <Text style={{ color: '#AAAAAA', fontSize: 12 }}>Changes</Text>
              <Switch
                accessibilityLabel="Highlight changed description passages"
                value={showChanges}
                onValueChange={setShowChanges}
                trackColor={{ false: '#292929', true: '#365A4B' }}
                thumbColor="#DDDDDD"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Next changed passage"
                accessibilityHint="Scrolls to the next change, then wraps to the first"
                disabled={!hasChanges}
                onPress={() => {
                  setShowChanges(true);
                  navigator.next(scroll);
                }}
                style={{
                  minHeight: 44,
                  paddingHorizontal: 8,
                  justifyContent: 'center',
                  opacity: hasChanges ? 1 : 0.35,
                }}
              >
                <Text style={{ color: '#BBBBBB', fontSize: 12 }}>
                  Next change
                </Text>
              </Pressable>
            </View>
          </View>
          <FlatList
            key={version}
            ref={list}
            onViewableItemsChanged={onViewableItemsChanged}
            onScrollBeginDrag={() => navigator.manual()}
            onScrollToIndexFailed={(failure) =>
              navigator.failed(failure, scroll)
            }
            data={diff[version]}
            keyExtractor={(_passage, index) => String(index)}
            contentContainerStyle={{
              paddingHorizontal: 14,
              paddingTop: 16,
              paddingBottom: 24,
              flexGrow: 1,
            }}
            ListEmptyComponent={
              <Text
                style={{
                  color: '#888888',
                  fontSize: 15,
                  paddingHorizontal: 10,
                }}
              >
                No description in this version.
              </Text>
            }
            renderItem={({ item: passage }) => {
              const highlighted = showChanges && passage.changed;
              return (
                <View
                  style={{
                    paddingHorizontal: 10,
                    paddingVertical: 6,
                    marginBottom: 4,
                    borderRadius: 8,
                    backgroundColor: highlighted
                      ? version === 'before'
                        ? '#251A20'
                        : '#14251E'
                      : 'transparent',
                  }}
                >
                  {highlighted && (
                    <View
                      accessible
                      accessibilityLabel={
                        version === 'before'
                          ? 'Changed passage in the earlier version'
                          : 'Changed passage in the new version'
                      }
                      pointerEvents="none"
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: 6,
                        bottom: 6,
                        width: 2,
                        borderRadius: 1,
                        backgroundColor:
                          version === 'before' ? '#AF7E92' : '#79AD96',
                      }}
                    />
                  )}
                  <DescriptionText
                    tokens={passage.tokens}
                    colour={habit.color}
                  />
                </View>
              );
            }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </Modal>
  );
}
