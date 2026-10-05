import { TextInput, Text } from './Typography';
import { View } from 'react-native';
import { validDate } from './storage/model';
import type { StartDateFieldProps } from './StartDateField';

export function StartDateField({
  value,
  onChange,
  colour,
}: StartDateFieldProps) {
  const valid = validDate(value);
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: '#AAAAAA', fontSize: 12 }}>
        Start date · YYYY-MM-DD
      </Text>
      <TextInput
        accessibilityLabel="Habit start date, YYYY-MM-DD"
        value={value}
        onChangeText={onChange}
        maxLength={10}
        autoCorrect={false}
        selectionColor={colour}
        style={{
          minHeight: 44,
          borderRadius: 12,
          padding: 14,
          color: '#E5E5E5',
          backgroundColor: '#1C1C1C',
          fontSize: 17,
        }}
      />
      <Text
        style={{
          color: valid ? '#999999' : '#F0A798',
          fontSize: 12,
          lineHeight: 18,
        }}
      >
        {valid
          ? 'Choose an earlier date to fill in old records. Statistics begin here.'
          : 'Enter a valid date, for example 2026-10-04.'}
      </Text>
    </View>
  );
}
