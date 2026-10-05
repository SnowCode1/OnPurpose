import { useState } from 'react';
import { Pressable, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { Text } from './Typography';
import {
  roundTextScale,
  TEXT_SCALE_MIN,
  TEXT_SCALE_MAX,
  TEXT_SCALE_STEP,
} from './textSize';

export function TextSizeSetting({
  value,
  editable,
  onChange,
  compact = false,
}: {
  compact?: boolean;
  value: number;
  editable: boolean;
  onChange: (scale: number) => void;
}) {
  const [draft, setDraft] = useState(value);
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
        <Text style={{ color: '#E0E0E0', fontSize: 17, fontWeight: '500' }}>
          Text size
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Reset text size to 100 percent"
          disabled={!editable || value === 1}
          onPress={() => {
            setDraft(1);
            onChange(1);
          }}
          style={{
            minHeight: 44,
            justifyContent: 'center',
            opacity: editable && value !== 1 ? 1 : 0.35,
          }}
        >
          <Text style={{ color: '#BBBBBB', fontSize: 13 }}>Reset</Text>
        </Pressable>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Slider
          style={{ flex: 1, minHeight: 44 }}
          minimumValue={TEXT_SCALE_MIN}
          maximumValue={TEXT_SCALE_MAX}
          step={TEXT_SCALE_STEP}
          value={value}
          disabled={!editable}
          minimumTrackTintColor="#74BBA5"
          maximumTrackTintColor="#303030"
          thumbTintColor="#EEEEEE"
          accessibilityLabel="App text size"
          accessibilityValue={{ text: `${Math.round(draft * 100)} percent` }}
          onValueChange={(next) => setDraft(roundTextScale(next))}
          onSlidingComplete={(next) => onChange(roundTextScale(next))}
        />
        <Text
          style={{
            color: '#CCCCCC',
            fontSize: 14,
            minWidth: 44,
            fontVariant: ['tabular-nums'],
          }}
        >
          {Math.round(draft * 100)}%
        </Text>
      </View>
      {!compact && (
        <Text style={{ color: '#969696', fontSize: 14, lineHeight: 21 }}>
          Applies throughout the app, including notes. Works alongside iPhone
          text size.
        </Text>
      )}
    </View>
  );
}
