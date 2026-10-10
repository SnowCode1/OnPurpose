import {
  createContext,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Pressable, View } from 'react-native';
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from 'react-native-gesture-handler';
import Svg, { Line, Rect } from 'react-native-svg';
import { Text } from './Typography';
import { Icon } from './Icon';
import { feedback } from './haptics';
import { themedStyles, useTheme } from './ThemeContext';

/**
 * A selectable part of the chart, positioned in fractions of the plot. Slots
 * sharing a key are one item drawn in several places (a streak across rows).
 */
export type ChartSlot = {
  key: string;
  x0: number;
  x1: number;
  /** Row band, top to bottom; the whole height when omitted. */
  y0?: number;
  y1?: number;
  title: string;
  value: string;
};
export type ChartTick = { x: number; label: string };
/** `y` is a fraction from the top of the plot. */
export type AxisLabel = { y: number; label: string };
export type PlotLayout = {
  width: number;
  height: number;
  /** Index of the first slot of the selected item. */
  selected: number | null;
  selectedKey: string | null;
};

/** Holding still before dragging starts reading the chart (thumb tracking). */
export const SCRUB_HOLD_MS = 180;
/**
 * Set by the screen that owns horizontal paging: true while a chart is being
 * scrubbed, so a sideways drag reads the chart instead of changing page.
 */
export const ChartScrubLock = createContext<(locked: boolean) => void>(
  () => {},
);

/**
 * Shared chart chrome: axis labels, ticks, one reserved reading line (legend,
 * or the selected item with ‹ › ✕) so a selection never shifts the screen,
 * and every way to select: tap, hold-and-drag thumb tracking, the ‹ › steps
 * and VoiceOver adjustment. Selection follows a slot's key, so data changes
 * cannot move it to a different period.
 */
export function ChartFrame({
  name,
  slots,
  ticks,
  axis,
  legend,
  colour,
  height = 140,
  axisWidth = 30,
  reserveAxis = false,
  gridLines = true,
  draw,
}: {
  name: string;
  slots: ChartSlot[];
  ticks: ChartTick[];
  axis: AxisLabel[];
  legend: string;
  colour: string;
  height?: number;
  axisWidth?: number;
  /** Keep the label column without labels, aligning with other charts. */
  reserveAxis?: boolean;
  /** Horizontal lines at the axis labels (off for row labels). */
  gridLines?: boolean;
  draw: (plot: PlotLayout) => ReactNode;
}) {
  const theme = useTheme();
  const styles = useStyles();
  const [width, setWidth] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const lockPaging = useContext(ChartScrubLock);
  const keys: string[] = [];
  for (const slot of slots) if (!keys.includes(slot.key)) keys.push(slot.key);
  const position = selectedKey === null ? -1 : keys.indexOf(selectedKey);
  const index =
    position < 0 ? -1 : slots.findIndex((slot) => slot.key === selectedKey);
  const current = index >= 0 ? slots[index] : null;
  const step = (next: number) =>
    setSelectedKey(keys[Math.max(0, Math.min(keys.length - 1, next))] ?? null);
  // The slot under a point; between rows or bars, the nearest one, keeping to
  // the finger's row so dragging along a row stays on it.
  const slotAt = (x: number, y: number) => {
    if (!slots.length || width <= 0) return -1;
    let nearest = -1,
      distance = Infinity;
    slots.forEach((slot, i) => {
      const top = (slot.y0 ?? 0) * height,
        bottom = (slot.y1 ?? 1) * height,
        dx =
          x < slot.x0 * width
            ? slot.x0 * width - x
            : x >= slot.x1 * width
              ? x - slot.x1 * width + 0.01
              : 0,
        dy = y < top ? top - y : y > bottom ? y - bottom : 0,
        gap = dx * dx + 9 * dy * dy;
      if (gap < distance) {
        distance = gap;
        nearest = i;
      }
    });
    return nearest;
  };
  const latest = useRef({ slotAt, slots, lockPaging });
  useLayoutEffect(() => {
    latest.current = { slotAt, slots, lockPaging };
  });
  // Hold, then drag: a quick swipe still scrolls or pages, and a tap still
  // selects. Selection only re-renders when the slot under the thumb changes.
  /* eslint-disable react-hooks/refs -- gesture callbacks run on touch, not during render */
  const scrub = useMemo(() => {
    const pick = (x: number, y: number) => {
      const { slotAt: at, slots: list } = latest.current;
      const found = at(x, y);
      if (found >= 0) setSelectedKey(list[found].key);
    };
    return Gesture.Pan()
      .activateAfterLongPress(SCRUB_HOLD_MS)
      .runOnJS(true)
      .onStart((event) => {
        latest.current.lockPaging(true);
        feedback('selection');
        pick(event.x, event.y);
      })
      .onUpdate((event) => pick(event.x, event.y))
      .onFinalize(() => latest.current.lockPaging(false));
  }, []);
  /* eslint-enable react-hooks/refs */
  // Labels closer than a line apart would overlap; keep the first.
  const labels = axis.filter(
    (label, i) =>
      !axis
        .slice(0, i)
        .some((other) => Math.abs(other.y - label.y) * height < 14),
  );
  const visibleTicks: (ChartTick & { left: number })[] = [];
  for (const tick of ticks) {
    const left = Math.min(Math.max(0, tick.x * width), width - 44);
    if (!visibleTicks.length || left - visibleTicks.at(-1)!.left >= 40)
      visibleTicks.push({ ...tick, left });
  }
  return (
    <View style={{ gap: 6 }}>
      <View
        style={[styles.plotRow, !axis.length && !reserveAxis && { gap: 0 }]}
      >
        <View
          style={[
            styles.axis,
            { width: axis.length || reserveAxis ? axisWidth : 0, height },
          ]}
          accessible={false}
        >
          {labels.map((label, i) => (
            <Text
              key={i}
              numberOfLines={1}
              style={[
                styles.axisLabel,
                {
                  top: Math.min(height - 16, Math.max(0, label.y * height - 8)),
                },
              ]}
            >
              {label.label}
            </Text>
          ))}
        </View>
        <GestureHandlerRootView style={{ flex: 1, minWidth: 0 }}>
          <GestureDetector gesture={scrub}>
            <View collapsable={false}>
              <Pressable
                accessibilityRole="adjustable"
                accessibilityLabel={name}
                accessibilityValue={{
                  text: current
                    ? `${current.title}: ${current.value}`
                    : 'Nothing selected',
                }}
                accessibilityHint="Adjust to move through the chart. Use Clear selection to show everything."
                accessibilityActions={[
                  { name: 'increment', label: 'Next' },
                  { name: 'decrement', label: 'Previous' },
                  { name: 'clearSelection', label: 'Clear selection' },
                ]}
                onAccessibilityAction={(event) => {
                  const action = event.nativeEvent.actionName;
                  if (action === 'clearSelection') setSelectedKey(null);
                  else if (action === 'increment')
                    step(position < 0 ? 0 : position + 1);
                  else if (action === 'decrement')
                    step(position < 0 ? keys.length - 1 : position - 1);
                }}
                onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
                onPress={(event) => {
                  const next = slotAt(
                    event.nativeEvent.locationX,
                    event.nativeEvent.locationY,
                  );
                  if (next < 0) return;
                  setSelectedKey((previous) =>
                    previous === slots[next].key ? null : slots[next].key,
                  );
                }}
                style={{ height }}
              >
                {width > 0 && (
                  <Svg
                    width={width}
                    height={height}
                    pointerEvents="none"
                    accessible={false}
                  >
                    {gridLines &&
                      axis.map((label, i) => (
                        <Line
                          key={`grid:${i}`}
                          x1={0}
                          x2={width}
                          y1={Math.max(
                            0.5,
                            Math.min(height - 0.5, label.y * height),
                          )}
                          y2={Math.max(
                            0.5,
                            Math.min(height - 0.5, label.y * height),
                          )}
                          stroke={theme.ink(0x20)}
                          strokeWidth={1}
                        />
                      ))}
                    {ticks.map((tick) => (
                      <Line
                        key={`tick:${tick.x}`}
                        x1={tick.x * width}
                        x2={tick.x * width}
                        y1={0}
                        y2={height}
                        stroke={theme.ink(0x16)}
                        strokeWidth={1}
                      />
                    ))}
                    {slots.map((slot, i) =>
                      slot.key === selectedKey ? (
                        <Rect
                          key={`selected:${i}`}
                          x={slot.x0 * width}
                          y={(slot.y0 ?? 0) * height}
                          width={Math.max(1, (slot.x1 - slot.x0) * width)}
                          height={((slot.y1 ?? 1) - (slot.y0 ?? 0)) * height}
                          rx={2}
                          fill={colour}
                          opacity={0.2}
                        />
                      ) : null,
                    )}
                    {draw({
                      width,
                      height,
                      selected: current ? index : null,
                      selectedKey: current ? selectedKey : null,
                    })}
                  </Svg>
                )}
              </Pressable>
            </View>
          </GestureDetector>
          <View style={styles.ticks} accessible={false}>
            {visibleTicks.map((tick) => (
              <Text
                key={`${tick.x}:${tick.label}`}
                numberOfLines={1}
                style={[styles.tick, { left: tick.left }]}
              >
                {tick.label}
              </Text>
            ))}
          </View>
        </GestureHandlerRootView>
      </View>
      <View style={styles.detail}>
        <View style={{ flex: 1 }} accessibilityLiveRegion="polite">
          {current ? (
            <Text numberOfLines={2} style={styles.caption}>
              {current.title} ·{' '}
              <Text style={{ color: colour }}>{current.value}</Text>
            </Text>
          ) : (
            <Text numberOfLines={2} style={styles.small}>
              {legend}
            </Text>
          )}
        </View>
        {current && (
          <>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Previous"
              disabled={position <= 0}
              onPress={() => step(position - 1)}
              style={({ pressed }) => [
                styles.control,
                { opacity: position <= 0 ? 0.3 : pressed ? 0.5 : 1 },
              ]}
            >
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <Icon name="chevron" size={16} color={theme.ink(0xb0)} />
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next"
              disabled={position >= keys.length - 1}
              onPress={() => step(position + 1)}
              style={({ pressed }) => [
                styles.control,
                {
                  opacity:
                    position >= keys.length - 1 ? 0.3 : pressed ? 0.5 : 1,
                },
              ]}
            >
              <View style={{ transform: [{ rotate: '-90deg' }] }}>
                <Icon name="chevron" size={16} color={theme.ink(0xb0)} />
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear selection"
              onPress={() => setSelectedKey(null)}
              style={({ pressed }) => [
                styles.control,
                { opacity: pressed ? 0.5 : 1 },
              ]}
            >
              <Icon name="close" size={16} color={theme.ink(0x9a)} />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const useStyles = themedStyles((t) => ({
  plotRow: { flexDirection: 'row', gap: 8 },
  axis: { width: 30 },
  axisLabel: {
    position: 'absolute',
    right: 0,
    color: t.ink(0x7e),
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  ticks: { height: 18, marginTop: 4 },
  tick: {
    position: 'absolute',
    color: t.ink(0x7e),
    fontSize: 11,
    width: 44,
  },
  caption: { color: t.ink(0xa0), fontSize: 13, lineHeight: 19 },
  small: { color: t.ink(0x85), fontSize: 12, lineHeight: 18 },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
  },
  control: {
    width: 40,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
