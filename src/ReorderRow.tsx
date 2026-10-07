import {
  createContext,
  memo,
  useCallback,
  useContext,
  useLayoutEffect,
  useState,
  type ReactNode,
  type Ref,
} from 'react';
import { View, type ViewProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  type SharedValue,
} from 'react-native-reanimated';

export type RowMotion = {
  id: string;
  rowTops: SharedValue<Record<string, number>>;
  active: boolean;
  top: number;
  dragY: SharedValue<number>;
  bodyTop: SharedValue<number>;
  scrollOffset: SharedValue<number>;
};
type PositionStyle = ReturnType<typeof useAnimatedStyle>;
const RowStyles = createContext<Record<string, PositionStyle>>({});
type RegisterPosition = (id: string, style: PositionStyle) => () => void;

// Owners stay mounted when date lists recycle or reset their measured widths.
// One mapper serves the name, every date cell and the loading strip for a habit.
// Registration occurs before paint, never by mutating a cache during render.
export function RowPositions({
  motions,
  children,
  ...props
}: {
  motions: Record<string, RowMotion>;
  children: ReactNode;
  ref?: Ref<View>;
} & ViewProps) {
  const [positions, setPositions] = useState<Record<string, PositionStyle>>({});
  const register = useCallback<RegisterPosition>((id, style) => {
    setPositions((current) =>
      current[id] === style ? current : { ...current, [id]: style },
    );
    return () =>
      setPositions((current) => {
        if (current[id] !== style) return current;
        const next = { ...current };
        delete next[id];
        return next;
      });
  }, []);
  return (
    <RowStyles.Provider value={positions}>
      {Object.values(motions).map((motion) => (
        <RowPositionOwner key={motion.id} motion={motion} register={register} />
      ))}
      <View {...props}>{children}</View>
    </RowStyles.Provider>
  );
}
const RowPositionOwner = memo(function RowPositionOwner({
  motion,
  register,
}: {
  motion: RowMotion;
  register: RegisterPosition;
}) {
  const { id, rowTops, active, top, dragY, bodyTop, scrollOffset } = motion;
  const position = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: active
          ? dragY.value - bodyTop.value + scrollOffset.value
          : (rowTops.value[id] ?? top),
      },
    ],
    zIndex: active ? 1 : 0,
  }));
  useLayoutEffect(() => register(id, position), [id, position, register]);
  return null;
});
// All rows share a fixed layout origin (top: 0). Their absolute Y is expressed
// only as a transform: no layout work on each drag frame, and no moving layout
// anchor that could race with transform compensation during preview swaps.
export function ReorderRow({
  motion,
  style,
  ref,
  animatedPosition = true,
  ...props
}: ViewProps & {
  motion: RowMotion;
  ref?: Ref<View>;
  animatedPosition?: boolean;
}) {
  const positions = useContext(RowStyles);
  // Stationary date cells keep the same native row but do not attach animated
  // descriptors on every recycled column. Reconnect the shared style for motion.
  const position = (animatedPosition ? positions[motion.id] : undefined) ?? {
    transform: [{ translateY: motion.top }],
    zIndex: motion.active ? 1 : 0,
  };
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
