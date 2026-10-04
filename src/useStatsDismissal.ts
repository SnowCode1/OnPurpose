import { useWindowDimensions } from 'react-native';
import {
  ReduceMotion,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { shouldDismissStats } from './statsDismissal';

export function useStatsDismissal(onDismiss: () => void) {
  const { height } = useWindowDimensions();
  const reducedMotion = useReducedMotion();
  const eligible = useSharedValue(false);
  const dragging = useSharedValue(false);
  const closing = useSharedValue(false);
  const shift = useSharedValue(0);
  const hidden = useSharedValue(false);
  const scroll = useAnimatedScrollHandler({
    onBeginDrag(event) {
      if (closing.value) return;
      eligible.set(event.contentOffset.y <= 1);
      dragging.set(true);
    },
    onScroll(event) {
      if (!closing.value && dragging.value && eligible.value && !reducedMotion)
        shift.set(Math.min(90, Math.max(0, -event.contentOffset.y) * 0.45));
    },
    onEndDrag(event) {
      if (closing.value) return;
      dragging.set(false);
      if (
        shouldDismissStats(
          eligible.value,
          event.contentOffset.y,
          event.velocity?.y ?? 0,
        )
      ) {
        closing.set(true);
        shift.set(
          withTiming(
            height,
            { duration: 180, reduceMotion: ReduceMotion.System },
            (finished) => {
              if (finished) {
                hidden.set(true);
                runOnJS(onDismiss)();
              }
            },
          ),
        );
      } else {
        shift.set(
          withTiming(0, { duration: 160, reduceMotion: ReduceMotion.System }),
        );
      }
      eligible.set(false);
    },
  });
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: reducedMotion ? 0 : shift.value }],
    opacity: hidden.value ? 0 : 1,
  }));
  return { scroll, style };
}
