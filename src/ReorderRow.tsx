import type { Ref } from 'react';
import type { View, ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  type SharedValue,
} from 'react-native-reanimated';
import { reorderSpring } from './motion';

export type RowMotion = {
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
  const { active, top, dragY, bodyTop, scrollOffset } = motion;
  const position = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: active
          ? dragY.value - bodyTop.value + scrollOffset.value
          : withSpring(top, reorderSpring),
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
