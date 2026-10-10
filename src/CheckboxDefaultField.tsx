import { Switch, View } from 'react-native';
import { Text } from './Typography';
import { useTheme } from './ThemeContext';
export function CheckboxDefaultField({
  checked,
  onChange,
  colour,
  detail,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  colour: string;
  detail?: string;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        minHeight: 52,
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={{ color: theme.ink(0xdd), fontSize: 14 }}>
          Default state · {checked ? 'On' : 'Off'}
        </Text>
        <Text style={{ color: theme.ink(0x99), fontSize: 12 }}>
          {detail ? `${detail} · ` : ''}For days you haven’t changed
        </Text>
      </View>
      <Switch
        accessibilityLabel="Default checkbox state on"
        value={checked}
        onValueChange={onChange}
        trackColor={{ true: theme.colour(colour) }}
      />
    </View>
  );
}
