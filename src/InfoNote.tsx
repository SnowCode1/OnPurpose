import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { appear } from './motion';
import { Text } from './Typography';
import { Icon } from './Icon';
import { themedStyles, useTheme } from './ThemeContext';

// Explanations are available without occupying space until requested.
export function InfoNote({ label, text }: { label: string; text: string }) {
  const theme = useTheme();
  const styles = useStyles();
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
        <Icon name="info" size={17} color={theme.ink(0x92)} />
        <Text style={styles.label}>{label}</Text>
        <View style={{ transform: [{ rotate: expanded ? '180deg' : '0deg' }] }}>
          <Icon name="chevron" size={13} color={theme.ink(0x77)} />
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

const useStyles = themedStyles((t) => ({
  note: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: t.ink(0x28),
    paddingTop: 4,
  },
  label: { color: t.ink(0x92), fontSize: 13, flex: 1 },
  explanation: { paddingLeft: 25, paddingBottom: 8 },
  text: { color: t.ink(0xaa), fontSize: 13, lineHeight: 19 },
}));
