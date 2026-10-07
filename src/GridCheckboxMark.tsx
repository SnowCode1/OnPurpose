import {
  memo,
  useEffect,
  useImperativeHandle,
  useState,
  type Ref,
} from 'react';
import { Animated, Easing, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import type { CheckboxStyle } from './displayPreferences';
import { Icon } from './Icon';
export type CheckboxFeedback = { pulse: () => void };

// Only an accepted local tap starts this animation. Mounting virtualized days,
// replaying History and changing appearance never animate a screenful of cells.
export const GridCheckboxMark = memo(function GridCheckboxMark({
  ref,
  identity,
  checked,
  style,
  size,
  colour,
  checkmark,
}: {
  ref: Ref<CheckboxFeedback>;
  identity: string;
  checked: boolean;
  style: CheckboxStyle;
  size: number;
  colour: string;
  checkmark: string;
}) {
  // Native Animated creates no Reanimated mapper/reaction per untouched cell.
  // The small native graph is connected only when a tap actually animates.
  const [progress] = useState(() => new Animated.Value(1));
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    progress.stopAnimation();
    progress.setValue(1);
    return () => progress.stopAnimation();
  }, [identity, progress]);
  useImperativeHandle(
    ref,
    () => ({
      pulse() {
        progress.stopAnimation();
        progress.setValue(1);
        if (reducedMotion) return;
        Animated.sequence([
          Animated.timing(progress, {
            toValue: 0.94,
            duration: 45,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
            isInteraction: false,
          }),
          Animated.timing(progress, {
            toValue: 1,
            duration: 135,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
            isInteraction: false,
          }),
        ]).start();
      },
    }),
    [progress, reducedMotion],
  );
  const box = size * (22 / 28);
  return (
    <Animated.View
      style={{ transform: [{ scale: progress }] }}
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
