import { useState, type ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { Text } from './Typography';
import { Icon } from './Icon';
import { appear } from './motion';

// A goal first reads as four decisions. Opening one reveals only its controls;
// keep its content mounted so moving between sections cannot reset a draft.
export function GoalSection({
  label,
  summary,
  expanded,
  onPress,
  children,
}: {
  label: string;
  summary: string;
  expanded: boolean;
  onPress?: () => void;
  children?: ReactNode;
}) {
  const heading = (
    <>
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.label, expanded && styles.openLabel]}>
          {label}
        </Text>
        {!expanded && (
          <Text style={styles.summary} numberOfLines={2}>
            {summary}
          </Text>
        )}
      </View>
      {onPress && (
        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <Icon name="chevron" size={16} color="#888888" />
        </View>
      )}
    </>
  );
  return (
    <View style={styles.section}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Edit ${label.toLowerCase()}, ${summary}`}
          accessibilityState={{ expanded }}
          onPress={() => {
            Keyboard.dismiss();
            onPress();
          }}
          style={({ pressed }) => [
            styles.sectionHeading,
            expanded && { minHeight: 44, paddingVertical: 10 },
            { opacity: pressed ? 0.65 : 1 },
          ]}
        >
          {heading}
        </Pressable>
      ) : (
        <View style={styles.sectionHeading}>{heading}</View>
      )}
      <View
        style={{ display: expanded ? 'flex' : 'none' }}
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? 'auto' : 'no-hide-descendants'}
      >
        <View style={styles.sectionBody}>{children}</View>
      </View>
    </View>
  );
}

// A single selected value replaces a permanent bank of competing buttons.
export function GoalChoice({
  label,
  options,
  value,
  onChange,
  colour,
  direct = false,
}: {
  label: string;
  options: [string, string][];
  value: string;
  onChange: (value: string) => void;
  colour: string;
  direct?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find(([id]) => id === value)?.[1] ?? 'Choose';
  return (
    <View>
      {!direct && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${label}, ${selected}`}
          accessibilityState={{ expanded: open }}
          onPress={() => {
            Keyboard.dismiss();
            setOpen((previous) => !previous);
          }}
          style={({ pressed }) => [
            styles.choiceHeading,
            { opacity: pressed ? 0.65 : 1 },
          ]}
        >
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.control}>{selected}</Text>
          </View>
          <View style={{ transform: [{ rotate: open ? '180deg' : '0deg' }] }}>
            <Icon name="chevron" size={14} color="#999999" />
          </View>
        </Pressable>
      )}
      {(direct || open) && (
        <Animated.View entering={appear} style={styles.options}>
          {options.map(([id, title]) => (
            <Pressable
              key={id}
              accessibilityRole="radio"
              accessibilityLabel={`${label} option, ${title}`}
              accessibilityState={{ checked: value === id }}
              onPress={() => {
                if (id !== value) onChange(id);
                setOpen(false);
              }}
              style={({ pressed }) => [
                styles.option,
                { opacity: pressed ? 0.65 : 1 },
              ]}
            >
              <Text
                style={[
                  styles.control,
                  { flex: 1 },
                  value === id && { color: colour },
                ]}
              >
                {title}
              </Text>
              {value === id && <Icon name="checked" color={colour} size={18} />}
            </Pressable>
          ))}
        </Animated.View>
      )}
    </View>
  );
}
const styles = StyleSheet.create({
  section: { backgroundColor: '#141414', borderRadius: 14, overflow: 'hidden' },
  sectionHeading: {
    minHeight: 68,
    paddingHorizontal: 14,
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  sectionBody: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#292929',
    marginHorizontal: 14,
    paddingVertical: 10,
    gap: 12,
  },
  label: { fontSize: 12, color: '#929292' },
  openLabel: { fontSize: 14, color: '#DDDDDD' },
  summary: { fontSize: 16, color: '#E2E2E2' },
  control: { fontSize: 14, color: '#DDDDDD' },
  choiceHeading: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 7,
  },
  options: {
    backgroundColor: '#1D1D1D',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  option: {
    minHeight: 44,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
