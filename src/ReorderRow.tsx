import type { Ref } from 'react';
import type { View, ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';
import { rowTransition } from './motion';

export type RowMotion = {
  active: boolean;
  top: number;
  dragY: SharedValue<number>;
  bodyTop: SharedValue<number>;
  scrollOffset: SharedValue<number>;
};
// Move the actual row contents. At the end of a drop this offset is zero,
// so there is no separate floating card to swap out or fade away.
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
          ? dragY.value - bodyTop.value - top + scrollOffset.value
          : 0,
      },
    ],
    zIndex: active ? 1 : 0,
  }));
  return (
    <Animated.View
      {...props}
      ref={ref}
      collapsable={false}
      layout={active ? undefined : rowTransition}
      style={[style, position]}
    />
  );
}
