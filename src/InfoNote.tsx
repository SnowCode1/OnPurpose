import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { appear } from './motion';
import { Text } from './Typography';
import { Icon } from './Icon';

// Explanations are available without occupying space until requested.
export function InfoNote({ label, text }: { label: string; text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={styles.note}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded }}
        onPress={() => setExpanded((value) => !value)}
        style={({ pressed }) => ({
          minHeight: 44,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <Icon name="info" size={17} color="#929292" />
        <Text style={styles.label}>{label}</Text>
        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <Icon name="chevron" size={13} color="#777777" />
        </View>
      </Pressable>
      {expanded && (
        <Animated.View entering={appear} style={styles.explanation}>
          <Text style={styles.text}>{text}</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#282828',
    paddingTop: 4,
  },
  label: { color: '#929292', fontSize: 13, flex: 1 },
  explanation: { paddingLeft: 25, paddingBottom: 8 },
  text: { color: '#AAAAAA', fontSize: 13, lineHeight: 19 },
});
