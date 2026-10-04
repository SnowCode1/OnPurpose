import type { Ref } from 'react';
import type { View, ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useAnimatedReaction,
  useSharedValue,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { reorderSpring } from './motion';

export type RowMotion = {
  id: string;
  rowTops: SharedValue<Record<string, number>>;
  active: boolean;
  top: number;
  dragY: SharedValue<number>;
  bodyTop: SharedValue<number>;
  scrollOffset: SharedValue<number>;
};
// All rows share a fixed layout origin (top: 0). Their absolute Y is expressed
// only as a transform: no layout work on each drag frame, and no moving layout
// anchor that could race with transform compensation during preview swaps.
export function ReorderRow({
  motion,
  style,
  ref,
  ...props
}: ViewProps & {
  motion: RowMotion;
  ref?: Ref<View>;
}) {
  const { id, rowTops, active, top, dragY, bodyTop, scrollOffset } = motion;
  const restingY = useSharedValue(top);
  useAnimatedReaction(
    () => ({ target: rowTops.value[id] ?? top, active }),
    (current, previous) => {
      if (current.active) {
        // The held row follows dragY. Keep its resting coordinate ready for the
        // final hand-off, even when a short drop finishes before neighbours settle.
        restingY.value = current.target;
      } else if (
        !previous ||
        previous.active ||
        current.target !== previous.target
      ) {
        restingY.value = withSpring(current.target, reorderSpring);
      }
    },
  );
  const position = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: active
          ? dragY.value - bodyTop.value + scrollOffset.value
          : restingY.value,
      },
    ],
    zIndex: active ? 1 : 0,
  }));
  return (
    <Animated.View
      {...props}
      ref={ref}
      collapsable={false}
      style={[
        { position: 'absolute', top: 0, left: 0, right: 0 },
        style,
        position,
      ]}
    />
  );
}
