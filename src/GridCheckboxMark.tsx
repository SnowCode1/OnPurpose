import {
  memo,
  useEffect,
  useImperativeHandle,
  useRef,
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
  // Untouched/recycled marks have no Animated.Value or attached scale graph.
  // Allocate only after an accepted tap and start after the view has committed.
  const [progress, setProgress] = useState<Animated.Value | null>(null);
  const requested = useRef<string | null>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => {
    if (!progress) return;
    progress.stopAnimation();
    progress.setValue(1);
    if (requested.current === identity && !reducedMotion) pulse(progress);
    requested.current = null;
    return () => progress.stopAnimation();
  }, [identity, progress, reducedMotion]);
  useImperativeHandle(
    ref,
    () => ({
      pulse() {
        if (reducedMotion) return;
        if (progress) pulse(progress);
        else {
          requested.current = identity;
          setProgress((current) => current ?? new Animated.Value(1));
        }
      },
    }),
    [identity, progress, reducedMotion],
  );
  const box = size * (22 / 28);
  return (
    <Animated.View
      style={progress ? { transform: [{ scale: progress }] } : undefined}
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

function pulse(progress: Animated.Value) {
  progress.stopAnimation();
  progress.setValue(1);
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
}
