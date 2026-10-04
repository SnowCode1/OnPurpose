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
// Every row has a single animated absolute Y position. Reordering siblings must
// not also reflow their native layout and compensate with a separate transform:
// those updates can land on different frames and flash the row at the wrong Y.
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
    top: active
      ? dragY.value - bodyTop.value + scrollOffset.value
      : withSpring(top, reorderSpring),
    zIndex: active ? 1 : 0,
  }));
  return (
    <Animated.View
      {...props}
      ref={ref}
      collapsable={false}
      style={[{ position: 'absolute', left: 0, right: 0 }, style, position]}
    />
  );
}
