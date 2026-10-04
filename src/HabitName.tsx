import { useRef, useState, useLayoutEffect } from 'react';
import {
  PanResponder,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import type { Habit } from './habits';
import { Icon } from './Icon';

export type HabitAction =
  'colour' | 'edit' | 'reorder' | 'archive' | 'moveUp' | 'moveDown';
export type HabitAnchor = {
  x: number;
  y: number;
  width: number;
  height: number;
};
export function HabitName({
  habit,
  height,
  selected,
  dragging,
  reorder,
  disabled,
  onPress,
  onHold,
  onDrag,
  onDrop,
  onCancel,
  onAction,
  onLayout,
}: {
  habit: Habit;
  height: number;
  selected: boolean;
  dragging: boolean;
  reorder: boolean;
  disabled: boolean;
  onPress: () => void;
  onHold: (anchor: HabitAnchor) => void;
  onDrag: (pageY: number, startY: number) => void;
  onDrop: () => void;
  onCancel: () => void;
  onAction: (action: HabitAction) => void;
  onLayout: (event: LayoutChangeEvent) => void;
}) {
  const view = useRef<View>(null);
  const held = useRef(false);
  const start = useRef(0);
  const callbacks = useRef({ reorder, disabled, onDrag, onDrop, onCancel });
  useLayoutEffect(() => {
    callbacks.current = { reorder, disabled, onDrag, onDrop, onCancel };
  });
  // PanResponder registers handlers; ref reads occur only when native events fire.
  // eslint-disable-next-line react-hooks/refs
  const [pan] = useState(() =>
    PanResponder.create({
      onStartShouldSetPanResponderCapture: () =>
        callbacks.current.reorder && !callbacks.current.disabled,
      onStartShouldSetPanResponder: () =>
        callbacks.current.reorder && !callbacks.current.disabled,
      onMoveShouldSetPanResponderCapture: (_, gesture) =>
        held.current &&
        gesture.numberActiveTouches === 1 &&
        Math.abs(gesture.dy) > 10 &&
        Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderGrant: (event) => {
        held.current = true;
        if (callbacks.current.reorder || !start.current)
          start.current = event.nativeEvent.pageY;
        callbacks.current.onDrag(
          event.nativeEvent.pageY,
          start.current || event.nativeEvent.pageY,
        );
      },
      onPanResponderMove: (event, gesture) => {
        if (!held.current) return;
        if (gesture.numberActiveTouches !== 1) {
          callbacks.current.onCancel();
          held.current = false;
          return;
        }
        callbacks.current.onDrag(event.nativeEvent.pageY, start.current);
      },
      onPanResponderRelease: () => {
        callbacks.current.onDrop();
        held.current = false;
        start.current = 0;
      },
      onPanResponderTerminate: () => {
        callbacks.current.onCancel();
        held.current = false;
        start.current = 0;
      },
      onPanResponderTerminationRequest: () => !held.current,
    }),
  );
  return (
    <View
      ref={view}
      collapsable={false}
      {...pan.panHandlers}
      onTouchStart={(event) => {
        start.current = event.nativeEvent.pageY;
      }}
      onLayout={onLayout}
    >
      <Pressable
        disabled={disabled}
        delayLongPress={380}
        accessibilityRole="button"
        accessibilityLabel={`${habit.name}, statistics`}
        accessibilityHint="Hold for habit actions, then drag to reorder"
        accessibilityActions={[
          { name: 'activate', label: 'Open statistics' },
          { name: 'edit', label: 'Edit habit' },
          { name: 'colour', label: 'Change colour' },
          { name: 'reorder', label: 'Reorder habits' },
          { name: 'moveUp', label: 'Move up' },
          { name: 'moveDown', label: 'Move down' },
          { name: 'archive', label: 'Archive habit' },
        ]}
        onAccessibilityAction={(event) =>
          event.nativeEvent.actionName === 'activate'
            ? onPress()
            : onAction(event.nativeEvent.actionName as HabitAction)
        }
        onPressIn={() => {
          held.current = false;
        }}
        onPress={() => {
          if (!held.current && !reorder) onPress();
        }}
        onLongPress={() => {
          held.current = true;
          view.current?.measureInWindow((x, y, width, height) =>
            onHold({ x, y, width, height }),
          );
        }}
        style={({ pressed }) => ({
          minHeight: height,
          paddingVertical: 8,
          paddingRight: 10,
          borderBottomWidth: 0.5,
          borderBottomColor: `${habit.color}20`,
          backgroundColor: selected
            ? '#171717'
            : pressed
              ? `${habit.color}15`
              : '#000000',
          opacity: dragging ? 0.18 : 1,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
        })}
      >
        {reorder && <Icon name="reorder" size={17} color={habit.color} />}
        <View style={{ flex: 1, gap: 2 }}>
          <Text
            style={{
              color: habit.color,
              fontSize: 15,
              lineHeight: 20,
              fontWeight: '500',
            }}
          >
            {habit.name}
          </Text>
          {habit.unit && (
            <Text
              style={{
                color: habit.color,
                fontSize: 11,
                lineHeight: 13,
                opacity: 0.8,
              }}
            >
              {habit.unit}
            </Text>
          )}
        </View>
      </Pressable>
    </View>
  );
}
