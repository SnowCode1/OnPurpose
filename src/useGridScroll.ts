import { useLayoutEffect } from 'react';
import type { FlashListRef } from '@shopify/flash-list';
import {
  cancelAnimation,
  Easing,
  ReduceMotion,
  runOnJS,
  runOnUI,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import type { GridDay } from './calendar';
import { shouldRevealFuture, settledDay } from './gridNavigation';
import { feedback } from './haptics';

// Exactly one native list drives the other. Synchronization and visual pull
// feedback stay on the UI thread; React receives only discrete gesture events.
export function useGridScroll({
  columnWidth,
  visibleDays,
  dayCount,
  futureCount,
  origin,
  onSettle,
  onReveal,
}: {
  columnWidth: number;
  visibleDays: number;
  dayCount: number;
  futureCount: number;
  origin: number;
  onSettle: (day: number, finished: boolean) => void;
  onReveal: (offset: number) => void;
}) {
  const header = useAnimatedRef<FlashListRef<GridDay>>();
  const body = useAnimatedRef<FlashListRef<GridDay>>();
  const driver = useSharedValue(0);
  const geometryReady = useSharedValue(true);
  const pull = useSharedValue(0);
  const dragging = useSharedValue(false);
  const thresholdTicked = useSharedValue(false);
  const offset = useSharedValue(0);
  const navigationOffset = useSharedValue(0);

  useAnimatedReaction(
    () => (driver.value === 3 ? navigationOffset.value : null),
    (position) => {
      if (position === null) return;
      offset.set(position);
      scrollTo(header, position, 0, false);
      scrollTo(body, position, 0, false);
    },
  );

  useLayoutEffect(() => {
    driver.set(0);
    pull.set(0);
    dragging.set(false);
    thresholdTicked.set(false);
    cancelAnimation(navigationOffset);
    return () => {
      cancelAnimation(navigationOffset);
    };
  }, [
    columnWidth,
    futureCount,
    driver,
    pull,
    dragging,
    thresholdTicked,
    navigationOffset,
  ]);

  function tickAtThreshold(offset: number) {
    'worklet';
    if (
      dragging.value &&
      origin <= 0 &&
      !thresholdTicked.value &&
      shouldRevealFuture(offset)
    ) {
      thresholdTicked.set(true);
      runOnJS(feedback)('boundary');
    }
  }

  function dayForOffset(offset: number) {
    'worklet';
    return (
      origin +
      settledDay(offset, columnWidth, dayCount, futureCount, visibleDays)
    );
  }

  const headerScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      cancelAnimation(navigationOffset);
      driver.set(1);
      dragging.set(true);
      thresholdTicked.set(false);
    },
    onScroll: (event) => {
      if (driver.value !== 1) return;
      offset.set(event.contentOffset.x);
      scrollTo(body, event.contentOffset.x, 0, false);
      pull.set(origin > 0 ? 0 : Math.max(0, -event.contentOffset.x));
      tickAtThreshold(event.contentOffset.x);
    },
    onEndDrag: (event) => {
      if (driver.value !== 1) return;
      tickAtThreshold(event.contentOffset.x);
      dragging.set(false);
      if (
        shouldRevealFuture(event.contentOffset.x) ||
        (origin > 0 && event.contentOffset.x < 0)
      ) {
        driver.set(0);
        pull.set(0);
        runOnJS(onReveal)(event.contentOffset.x);
      } else {
        runOnJS(onSettle)(
          dayForOffset(event.targetContentOffset?.x ?? event.contentOffset.x),
          Math.abs(
            (event.targetContentOffset?.x ?? event.contentOffset.x) -
              event.contentOffset.x,
          ) < 1,
        );
      }
    },
    onMomentumEnd: (event) => {
      if (driver.value === 1)
        runOnJS(onSettle)(dayForOffset(event.contentOffset.x), true);
    },
  });
  const bodyScroll = useAnimatedScrollHandler({
    onBeginDrag: () => {
      cancelAnimation(navigationOffset);
      driver.set(2);
      dragging.set(true);
      thresholdTicked.set(false);
    },
    onScroll: (event) => {
      if (driver.value === 0 || driver.value === 2)
        offset.set(event.contentOffset.x);
      if (driver.value !== 2) return;
      scrollTo(header, event.contentOffset.x, 0, false);
      pull.set(origin > 0 ? 0 : Math.max(0, -event.contentOffset.x));
      tickAtThreshold(event.contentOffset.x);
    },
    onEndDrag: (event) => {
      if (driver.value !== 2) return;
      tickAtThreshold(event.contentOffset.x);
      dragging.set(false);
      if (
        shouldRevealFuture(event.contentOffset.x) ||
        (origin > 0 && event.contentOffset.x < 0)
      ) {
        driver.set(0);
        pull.set(0);
        runOnJS(onReveal)(event.contentOffset.x);
      } else {
        runOnJS(onSettle)(
          dayForOffset(event.targetContentOffset?.x ?? event.contentOffset.x),
          Math.abs(
            (event.targetContentOffset?.x ?? event.contentOffset.x) -
              event.contentOffset.x,
          ) < 1,
        );
      }
    },
    onMomentumEnd: (event) => {
      if (driver.value === 2)
        runOnJS(onSettle)(dayForOffset(event.contentOffset.x), true);
    },
  });
  function stopSync() {
    cancelAnimation(navigationOffset);
    driver.set(0);
    pull.set(0);
    dragging.set(false);
  }
  function scrollToDay(day: number, onArrive: () => void) {
    runOnUI(() => {
      'worklet';
      cancelAnimation(navigationOffset);
      dragging.set(false);
      pull.set(0);
      // Keep the expanded range until arrival, including when coming from future days.
      const target = (futureCount + day - origin) * columnWidth;
      navigationOffset.set(offset.value);
      driver.set(3);
      // Stop native momentum before taking over both lists on the UI thread.
      scrollTo(header, offset.value, 0, false);
      scrollTo(body, offset.value, 0, false);
      navigationOffset.set(
        withTiming(
          target,
          {
            duration: 280,
            easing: Easing.out(Easing.cubic),
            reduceMotion: ReduceMotion.System,
          },
          (finished) => {
            if (!finished) return;
            scrollTo(header, target, 0, false);
            scrollTo(body, target, 0, false);
            offset.set(target);
            driver.set(0);
            runOnJS(onArrive)();
          },
        ),
      );
    })();
  }
  function alignGeometry(target: number, ready: boolean) {
    runOnUI((position: number, finished: boolean) => {
      'worklet';
      cancelAnimation(navigationOffset);
      dragging.set(false);
      pull.set(0);
      // Ignore old mount offsets until both new lists have their native sizes.
      driver.set(finished ? 0 : 4);
      geometryReady.set(finished);
      offset.set(position);
      scrollTo(header, position, 0, false);
      scrollTo(body, position, 0, false);
    })(target, ready);
  }
  function continueReveal(offset: number) {
    runOnUI((target: number) => {
      'worklet';
      // A new user drag takes priority over the reveal animation.
      if (dragging.value) return;
      driver.set(2);
      scrollTo(body, target, 0, true);
    })(offset);
  }
  return {
    header,
    body,
    stopSync,
    continueReveal,
    scrollToDay,
    alignGeometry,
    pull,
    offset,
    geometryReady,
    headerScroll,
    bodyScroll,
  };
}
