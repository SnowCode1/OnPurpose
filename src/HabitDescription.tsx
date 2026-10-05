import { Text } from './Typography';
import { memo, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { descriptionExcerpt } from './descriptionReading';
import { contrastOnBlack } from './colors';

export const HabitDescription = memo(function HabitDescription({
  description,
  colour,
  onOpen,
  onEdit,
  onVersions,
  editable,
}: {
  description?: string;
  colour: string;
  onOpen: () => void;
  onEdit: () => void;
  onVersions?: () => void;
  editable: boolean;
}) {
  const excerpt = useMemo(
    () => descriptionExcerpt(description ?? ''),
    [description],
  );
  const accent = contrastOnBlack(colour) >= 4.5 ? colour : '#B7DCCF';
  return (
    <View style={[styles.container, description && styles.card]}>
      {description && <Text style={styles.label}>Notes</Text>}
      {description && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open full note"
          onPress={onOpen}
          style={({ pressed }) => ({
            opacity: pressed ? 0.6 : 1,
            minHeight: 44,
          })}
        >
          <Text numberOfLines={3} style={styles.excerpt}>
            {excerpt}
          </Text>
        </Pressable>
      )}
      <View style={styles.actions}>
        {description && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open full note"
            onPress={onOpen}
            style={styles.action}
          >
            <Text style={[styles.actionText, { color: accent }]}>
              Open note
            </Text>
          </Pressable>
        )}
        <View style={{ flex: 1 }} />
        {onVersions && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Previous description versions"
            onPress={onVersions}
            style={styles.action}
          >
            <Text style={styles.actionText}>Versions</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={
            description ? 'Edit description' : 'Add description'
          }
          disabled={!editable}
          onPress={onEdit}
          style={[styles.action, { opacity: editable ? 1 : 0.35 }]}
        >
          <Text style={styles.actionText}>
            {description ? 'Edit' : 'Add description'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});
const styles = StyleSheet.create({
  container: { gap: 8 },
  card: {
    backgroundColor: '#111111',
    borderColor: '#292929',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 2,
  },
  label: { color: '#929292', fontSize: 12 },
  excerpt: { color: '#C7C7C7', fontSize: 15, lineHeight: 23 },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 16,
  },
  action: { minHeight: 44, justifyContent: 'center' },
  actionText: { color: '#BBBBBB', fontSize: 13 },
});
