import {
  FlashList,
  type FlashListProps,
  type FlashListRef,
} from '@shopify/flash-list';
import { type ComponentProps, type Ref, useState } from 'react';
import { FlatList, Platform, type FlatListProps } from 'react-native';
import Animated from 'react-native-reanimated';
import type { GridDay } from './calendar';

// Recycling retains native views during scrolling. A width change resets
// measured item widths so historical columns cannot retain mixed old/new sizes.
// Freeze the initial index: later history loading must not trigger another jump.
const AnimatedDateList = Animated.createAnimatedComponent(FlashList<GridDay>);
export function DateColumns({
  initialScrollIndex,
  columnWidth,
  ref,
  ...props
}: Omit<FlashListProps<GridDay>, 'style'> & {
  style?: ComponentProps<typeof AnimatedDateList>['style'];
  ref: Ref<FlashListRef<GridDay>>;
  columnWidth: number;
}) {
  const [initialIndex] = useState(initialScrollIndex);
  // RN Web retains its known layout path. Native devices recycle columns;
  // FlashList's inverted DOM offsets differ from the native scroll coordinate.
  if (Platform.OS === 'web')
    return (
      <Animated.FlatList
        {...(props as unknown as Omit<
          FlatListProps<GridDay>,
          'CellRendererComponent'
        >)}
        ref={ref as Ref<FlatList<GridDay>>}
        key={columnWidth}
        initialScrollIndex={initialScrollIndex}
        maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
        getItemLayout={(_, index) => ({
          length: columnWidth,
          offset: columnWidth * index,
          index,
        })}
        windowSize={5}
      />
    );
  return (
    <AnimatedDateList {...props} ref={ref} initialScrollIndex={initialIndex} />
  );
}
