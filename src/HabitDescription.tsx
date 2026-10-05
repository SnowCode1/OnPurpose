import { useMemo, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { DescriptionText } from './DescriptionText';
import { descriptionPreview } from './description';

const NOTE_SURFACE = '#111111';

export function HabitDescription({
  description,
  colour,
  onEdit,
  editable,
}: {
  description?: string;
  colour: string;
  onEdit: () => void;
  editable: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [height, setHeight] = useState(0);
  const { fontScale } = useWindowDimensions();
  const preview = useMemo(
    () => descriptionPreview(description ?? '', expanded),
    [description, expanded],
  );
  const limit = 150 * Math.max(1, fontScale);
  const truncated = !expanded && (preview.truncated || height > limit + 1);
  return (
    <View style={[styles.container, description && styles.card]}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ color: '#929292', fontSize: 12 }}>Description</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            description ? 'Edit description' : 'Add description'
          }
          disabled={!editable}
          onPress={onEdit}
          style={({ pressed }) => ({
            minHeight: 44,
            paddingLeft: 14,
            justifyContent: 'center',
            opacity: !editable ? 0.35 : pressed ? 0.6 : 1,
          })}
        >
          <Text style={{ color: '#BBBBBB', fontSize: 13 }}>
            {description ? 'Edit' : 'Add description'}
          </Text>
        </Pressable>
      </View>
      {description && (
        <>
          <View
            style={{
              maxHeight: expanded ? undefined : limit,
              overflow: 'hidden',
            }}
          >
            <View
              style={{ flexShrink: 0 }}
              onLayout={(event) => setHeight(event.nativeEvent.layout.height)}
            >
              <DescriptionText tokens={preview.tokens} colour={colour} />
            </View>
            {!expanded && height > limit + 1 && (
              <LinearGradient
                pointerEvents="none"
                colors={[`${NOTE_SURFACE}00`, NOTE_SURFACE]}
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 22,
                }}
              />
            )}
          </View>
          {(truncated || expanded) && (
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded }}
              onPress={() => setExpanded((value) => !value)}
              style={({ pressed }) => ({
                minHeight: 44,
                justifyContent: 'center',
                alignSelf: 'flex-start',
                opacity: pressed ? 0.6 : 1,
              })}
            >
              <Text style={{ color: '#AFAFAF', fontSize: 13 }}>
                {expanded ? 'Show less' : 'Read more'}
              </Text>
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 4 },
  card: {
    backgroundColor: NOTE_SURFACE,
    borderColor: '#292929',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 2,
    paddingBottom: 8,
  },
});
