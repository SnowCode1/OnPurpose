import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Text } from './Typography';
import { Icon } from './Icon';

// Explanations are available without occupying space until requested.
export function InfoNote({ label, text }: { label: string; text: string }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <View style={{ gap: expanded ? 4 : 0 }}>
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
        <Text style={{ color: '#929292', fontSize: 13, flexShrink: 1 }}>
          {label}
        </Text>
      </Pressable>
      {expanded && (
        <Text style={{ color: '#929292', fontSize: 13, lineHeight: 19 }}>
          {text}
        </Text>
      )}
    </View>
  );
}
