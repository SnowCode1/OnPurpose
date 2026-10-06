import { Text, TextInput } from './Typography';
import { useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { localDateKey } from './calendar';

export type StartDateFieldProps = {
  value: string;
  onChange: (value: string) => void;
  colour: string;
  label?: string;
  help?: string;
};
export function StartDateField({
  value,
  onChange,
  colour,
  label = 'Start date',
  help = 'Choose an earlier date to fill in old records. Statistics begin here.',
}: StartDateFieldProps) {
  const [open, setOpen] = useState(false);
  const date = new Date(`${value}T12:00:00`);
  return (
    <View style={{ gap: 8 }}>
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 8,
        }}
      >
        <Text style={{ color: '#AAAAAA', fontSize: 12 }}>{label}</Text>
        {Platform.OS === 'web' ? (
          <TextInput
            accessibilityLabel={label}
            value={value}
            onChangeText={onChange}
            maxLength={10}
            placeholder="YYYY-MM-DD"
            style={{
              color: colour,
              minHeight: 44,
              paddingHorizontal: 12,
              fontSize: 15,
              backgroundColor: '#1C1C1C',
              borderRadius: 10,
            }}
          />
        ) : Platform.OS === 'ios' || open ? (
          <DateTimePicker
            accessibilityLabel={
              label === 'Start date' ? 'Habit start date' : label
            }
            value={date}
            mode="date"
            display={Platform.OS === 'ios' ? 'compact' : 'default'}
            themeVariant="dark"
            accentColor={colour}
            onValueChange={(_, selected) => {
              onChange(localDateKey(selected));
              setOpen(false);
            }}
            onDismiss={() => setOpen(false)}
            style={{ minHeight: 44 }}
          />
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${label}, ${date.toLocaleDateString()}`}
            onPress={() => setOpen(true)}
            style={{
              minHeight: 44,
              justifyContent: 'center',
              paddingHorizontal: 12,
              backgroundColor: '#1C1C1C',
              borderRadius: 10,
            }}
          >
            <Text style={{ color: colour, fontSize: 15 }}>
              {date.toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </Text>
          </Pressable>
        )}
      </View>
      {!!help && (
        <Text style={{ color: '#999999', fontSize: 12, lineHeight: 18 }}>
          {help}
        </Text>
      )}
    </View>
  );
}
