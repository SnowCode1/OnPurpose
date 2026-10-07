import { useCallback, useLayoutEffect, useRef, useState } from 'react';
// Native name wraps can arrive as separate layout events during rotation. Apply
// one batch instead of rebuilding every date column for each measured name.
export function useMeasuredRowHeights(geometry: string) {
  const [heights, setHeights] = useState<Record<string, number>>({});
  const current = useRef(geometry);
  const pending = useRef<Record<string, number>>({});
  const frame = useRef<number | null>(null);
  useLayoutEffect(() => {
    current.current = geometry;
    pending.current = {};
    if (frame.current !== null) cancelAnimationFrame(frame.current);
    frame.current = null;
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    };
  }, [geometry]);
  const measure = useCallback(
    (id: string, height: number, generation: string) => {
      if (
        generation !== current.current ||
        !Number.isFinite(height) ||
        height <= 0
      )
        return;
      pending.current[id] = height;
      if (frame.current !== null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const batch = pending.current;
        pending.current = {};
        setHeights((previous) =>
          Object.keys(batch).some((id) => previous[id] !== batch[id])
            ? { ...previous, ...batch }
            : previous,
        );
      });
    },
    [],
  );
  return { heights, measure };
}
