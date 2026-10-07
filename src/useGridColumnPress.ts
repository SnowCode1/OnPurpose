import { useEffect, useRef, useState } from 'react';
import type { GestureResponderEvent } from 'react-native';
import type { Habit } from './habits';
import type { RowMotion } from './ReorderRow';
import { gridColumnHit } from './gridColumnHit';

export function useGridColumnPress({
  habits,
  motions,
  heights,
  baseHeight,
  date,
  disabled,
  activate,
  moving,
}: {
  habits: Habit[];
  motions: Record<string, RowMotion>;
  heights: Record<string, number>;
  baseHeight: number;
  date: string;
  disabled: boolean;
  activate: (habit: Habit) => void;
  moving: boolean;
}) {
  const [pressed, setPressed] = useState<{ id: string; date: string } | null>(
    null,
  );
  const gesture = useRef<{ id: string; date: string } | null>(null);
  useEffect(() => {
    gesture.current = null;
  }, [date, disabled]);
  const hit = (event: GestureResponderEvent) => {
    // Read the animated positions only for a touch during row movement. Idle
    // taps and all scrolling stay free of synchronous UI-thread value reads.
    const currentTops =
      moving && habits.length ? motions[habits[0].id].rowTops.get() : undefined;
    return gridColumnHit(
      habits,
      motions,
      heights,
      baseHeight,
      event.nativeEvent.locationY,
      currentTops,
    );
  };
  return {
    pressed: !disabled && pressed?.date === date ? pressed.id : null,
    handlers: {
      onPressIn(event: GestureResponderEvent) {
        const habit = disabled ? null : hit(event);
        gesture.current = habit ? { id: habit.id, date } : null;
        setPressed(gesture.current);
      },
      onPressOut() {
        // Native Pressability sends press-out before press on release.
        setPressed(null);
      },
      onPress(event: GestureResponderEvent) {
        const start = gesture.current;
        gesture.current = null;
        setPressed(null);
        if (disabled || !start || start.date !== date) return;
        const habit = hit(event);
        if (habit?.id === start.id) activate(habit);
      },
    },
  };
}
