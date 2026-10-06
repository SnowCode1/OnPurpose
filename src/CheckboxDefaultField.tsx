import { Switch, View } from 'react-native';
import { Text } from './Typography';
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
        <Text style={{ color: '#DDDDDD', fontSize: 14 }}>
          Default state · {checked ? 'On' : 'Off'}
        </Text>
        <Text style={{ color: '#999999', fontSize: 12 }}>
          {detail ? `${detail} · ` : ''}For days you haven’t changed
        </Text>
      </View>
      <Switch
        accessibilityLabel="Default checkbox state on"
        value={checked}
        onValueChange={onChange}
        trackColor={{ true: colour }}
      />
    </View>
  );
}
