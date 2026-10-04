import { useEffect } from 'react';
import { FlatList } from 'react-native';
import {
  runOnJS,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useSharedValue,
} from 'react-native-reanimated';
import type { GridDay } from './calendar';
import { shouldRevealFuture, settledDay } from './gridNavigation';

// Exactly one native list drives the other. Neither synchronization nor pull
// feedback waits for JS; React receives only the end-of-gesture date.
export function useGridScroll({
  columnWidth,
  visibleDays,
  dayCount,
  futureCount,
  onSettle,
  onReveal,
}: {
  columnWidth: number;
  visibleDays: number;
  dayCount: number;
  futureCount: number;
  onSettle: (day: number) => void;
  onReveal: () => void;
}) {
  const header = useAnimatedRef<FlatList<GridDay>>();
  const body = useAnimatedRef<FlatList<GridDay>>();
  const driver = useSharedValue(0);
  const pull = useSharedValue(0);

  useEffect(() => {
    driver.set(0);
    pull.set(0);
  }, [columnWidth, futureCount, driver, pull]);

  function dayForOffset(offset: number) {
    'worklet';
    return settledDay(offset, columnWidth, dayCount, futureCount, visibleDays);
  }

  const headerScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      driver.set(1);
    },
    onScroll: (event) => {
      if (driver.value !== 1) return;
      scrollTo(body, event.contentOffset.x, 0, false);
      pull.set(Math.max(0, -event.contentOffset.x));
    },
    onEndDrag: (event) => {
      if (driver.value !== 1) return;
      if (shouldRevealFuture(event.contentOffset.x)) {
        driver.set(0);
        pull.set(0);
        runOnJS(onReveal)();
      } else {
        runOnJS(onSettle)(
          dayForOffset(event.targetContentOffset?.x ?? event.contentOffset.x),
        );
      }
    },
    onMomentumEnd: (event) => {
      if (driver.value === 1)
        runOnJS(onSettle)(dayForOffset(event.contentOffset.x));
    },
  });
  const bodyScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      driver.set(2);
    },
    onScroll: (event) => {
      if (driver.value !== 2) return;
      scrollTo(header, event.contentOffset.x, 0, false);
      pull.set(Math.max(0, -event.contentOffset.x));
    },
    onEndDrag: (event) => {
      if (driver.value !== 2) return;
      if (shouldRevealFuture(event.contentOffset.x)) {
        driver.set(0);
        pull.set(0);
        runOnJS(onReveal)();
      } else {
        runOnJS(onSettle)(
          dayForOffset(event.targetContentOffset?.x ?? event.contentOffset.x),
        );
      }
    },
    onMomentumEnd: (event) => {
      if (driver.value === 2)
        runOnJS(onSettle)(dayForOffset(event.contentOffset.x));
    },
  });
  function stopSync() {
    driver.set(0);
    pull.set(0);
  }
  return { header, body, stopSync, pull, headerScroll, bodyScroll };
}
