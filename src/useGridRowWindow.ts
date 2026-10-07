import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Habit } from './habits';
import { gridRowBucket, gridRowRange } from './gridRowWindow';

export function useGridRowWindow(
  habits: Habit[],
  tops: Record<string, number>,
  heights: Record<string, number>,
  baseHeight: number,
  interactiveReorder: boolean,
) {
  const [viewport, setViewport] = useState(0);
  const [offset, setOffset] = useState(0);
  const lastBucket = useRef(0);
  const identity = habits.map((habit) => habit.id).join('|');
  const [transition, setTransition] = useState({ identity, full: false });
  if (identity !== transition.identity) setTransition({ identity, full: true });
  useEffect(() => {
    if (!transition.full) return;
    // Keep departing/surviving targets covered through the shared 220 ms motion.
    const timer = setTimeout(() => {
      setTransition((current) =>
        current.identity === identity ? { identity, full: false } : current,
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [identity, transition.full]);
  const updateOffset = useCallback(
    (y: number) => {
      const bucket = gridRowBucket(y, baseHeight);
      if (bucket === lastBucket.current) return;
      lastBucket.current = bucket;
      setOffset(bucket);
    },
    [baseHeight],
  );
  const range =
    interactiveReorder || transition.full
      ? { start: 0, end: habits.length }
      : gridRowRange(habits, tops, heights, baseHeight, offset, viewport);
  const rows = useMemo(
    () =>
      range.start === 0 && range.end === habits.length
        ? habits
        : habits.slice(range.start, range.end),
    [habits, range.start, range.end],
  );
  return { rows, updateOffset, setViewport };
}
