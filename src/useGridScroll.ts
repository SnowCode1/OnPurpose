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
import { feedback } from './haptics';

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
  onReveal: (fromPull: boolean) => void;
}) {
  const header = useAnimatedRef<FlatList<GridDay>>();
  const body = useAnimatedRef<FlatList<GridDay>>();
  const driver = useSharedValue(0);
  const pull = useSharedValue(0);
  const dragging = useSharedValue(false);
  const thresholdTicked = useSharedValue(false);

  useEffect(() => {
    driver.set(0);
    pull.set(0);
    dragging.set(false);
    thresholdTicked.set(false);
  }, [columnWidth, futureCount, driver, pull, dragging, thresholdTicked]);

  function tickAtThreshold(offset: number) {
    'worklet';
    if (
      dragging.value &&
      !thresholdTicked.value &&
      shouldRevealFuture(offset)
    ) {
      thresholdTicked.set(true);
      runOnJS(feedback)('boundary');
    }
  }

  function dayForOffset(offset: number) {
    'worklet';
    return settledDay(offset, columnWidth, dayCount, futureCount, visibleDays);
  }

  const headerScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      driver.set(1);
      dragging.set(true);
      thresholdTicked.set(false);
    },
    onScroll: (event) => {
      if (driver.value !== 1) return;
      scrollTo(body, event.contentOffset.x, 0, false);
      pull.set(Math.max(0, -event.contentOffset.x));
      tickAtThreshold(event.contentOffset.x);
    },
    onEndDrag: (event) => {
      if (driver.value !== 1) return;
      tickAtThreshold(event.contentOffset.x);
      dragging.set(false);
      if (shouldRevealFuture(event.contentOffset.x)) {
        driver.set(0);
        pull.set(0);
        runOnJS(onReveal)(true);
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
      dragging.set(true);
      thresholdTicked.set(false);
    },
    onScroll: (event) => {
      if (driver.value !== 2) return;
      scrollTo(header, event.contentOffset.x, 0, false);
      pull.set(Math.max(0, -event.contentOffset.x));
      tickAtThreshold(event.contentOffset.x);
    },
    onEndDrag: (event) => {
      if (driver.value !== 2) return;
      tickAtThreshold(event.contentOffset.x);
      dragging.set(false);
      if (shouldRevealFuture(event.contentOffset.x)) {
        driver.set(0);
        pull.set(0);
        runOnJS(onReveal)(true);
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
    dragging.set(false);
  }
  return { header, body, stopSync, pull, headerScroll, bodyScroll };
}
