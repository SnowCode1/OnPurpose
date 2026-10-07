import { memo, useImperativeHandle, type Ref } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import type { CheckboxStyle } from './displayPreferences';
import { Icon } from './Icon';
import { cellPressIn, cellSettle } from './motion';
export type CheckboxFeedback = { pulse: () => void };

// Only an accepted local tap starts this animation. Mounting virtualized days,
// replaying History and changing appearance never animate a screenful of cells.
export const GridCheckboxMark = memo(function GridCheckboxMark({
  ref,
  checked,
  style,
  size,
  colour,
  checkmark,
}: {
  ref: Ref<CheckboxFeedback>;
  checked: boolean;
  style: CheckboxStyle;
  size: number;
  colour: string;
  checkmark: string;
}) {
  const progress = useSharedValue(1);
  const animated = useAnimatedStyle(() => ({
    transform: [{ scale: progress.value }],
    opacity: 0.8 + ((progress.value - 0.94) / 0.06) * 0.2,
  }));
  useImperativeHandle(
    ref,
    () => ({
      pulse() {
        cancelAnimation(progress);
        progress.value = withSequence(
          withTiming(0.94, cellPressIn),
          withTiming(1, cellSettle),
        );
      },
    }),
    [progress],
  );
  const box = size * (22 / 28);
  return (
    <Animated.View
      style={animated}
      pointerEvents="none"
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {style === 'marks' ? (
        <Icon
          name={checked ? 'tick' : 'close'}
          size={size}
          strokeWidth={checked ? 2.3 : 1.8}
          color={colour}
        />
      ) : (
        <View
          style={{
            width: box,
            height: box,
            borderRadius: box * (6 / 22),
            borderWidth: Math.max(1.25, box * (1.5 / 22)),
            borderColor: colour,
            backgroundColor: checked ? colour : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {checked && (
            <Icon
              name="tick"
              size={box * 0.85}
              strokeWidth={2.5}
              color={checkmark}
            />
          )}
        </View>
      )}
    </Animated.View>
  );
});
