import { useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { Text } from './Typography';
import { Icon } from './Icon';

/** A selectable part of the chart, positioned in fractions of the width. */
export type ChartSlot = {
  key: string;
  x0: number;
  x1: number;
  title: string;
  value: string;
};
export type ChartTick = { x: number; label: string };
/** `y` is a fraction from the top of the plot. */
export type AxisLabel = { y: number; label: string };
export type PlotLayout = {
  width: number;
  height: number;
  selected: number | null;
};

/**
 * Shared chart chrome: axis labels, ticks, tap and VoiceOver selection, and
 * one reserved reading line (legend, or the selected slot with ‹ › ✕), so a
 * selection never shifts the screen. Selection follows a slot's key, so data
 * changes cannot move it to a different period.
 */
export function ChartFrame({
  name,
  slots,
  ticks,
  axis,
  legend,
  colour,
  height = 140,
  draw,
}: {
  name: string;
  slots: ChartSlot[];
  ticks: ChartTick[];
  axis: AxisLabel[];
  legend: string;
  colour: string;
  height?: number;
  draw: (plot: PlotLayout) => ReactNode;
}) {
  const [width, setWidth] = useState(0);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const index =
    selectedKey === null
      ? -1
      : slots.findIndex((slot) => slot.key === selectedKey);
  const current = index >= 0 ? slots[index] : null;
  const select = (next: number) =>
    setSelectedKey(
      slots[Math.max(0, Math.min(slots.length - 1, next))]?.key ?? null,
    );
  const slotAt = (x: number) => {
    const fraction = width > 0 ? x / width : 0;
    const found = slots.findIndex(
      (slot) => fraction >= slot.x0 && fraction < slot.x1,
    );
    if (found >= 0) return found;
    let nearest = -1,
      distance = Infinity;
    slots.forEach((slot, i) => {
      const gap = Math.abs((slot.x0 + slot.x1) / 2 - fraction);
      if (gap < distance) {
        distance = gap;
        nearest = i;
      }
    });
    return nearest;
  };
  // Labels closer than a line apart would overlap; keep the first.
  const labels = axis.filter(
    (label, index) =>
      !axis
        .slice(0, index)
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
      <View style={styles.plotRow}>
        <View style={[styles.axis, { height }]} accessible={false}>
          {labels.map((label, index) => (
            <Text
              key={index}
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
        <View style={{ flex: 1, minWidth: 0 }}>
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
                select(index < 0 ? 0 : index + 1);
              else if (action === 'decrement')
                select(index < 0 ? slots.length - 1 : index - 1);
            }}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            onPress={(event) => {
              if (!slots.length || width <= 0) return;
              const next = slotAt(event.nativeEvent.locationX);
              setSelectedKey((previous) =>
                previous === slots[next]?.key ? null : slots[next].key,
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
                {axis.map((label, index) => (
                  <Line
                    key={`grid:${index}`}
                    x1={0}
                    x2={width}
                    y1={Math.max(0.5, Math.min(height - 0.5, label.y * height))}
                    y2={Math.max(0.5, Math.min(height - 0.5, label.y * height))}
                    stroke="#202020"
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
                    stroke="#161616"
                    strokeWidth={1}
                  />
                ))}
                {current && (
                  <Line
                    x1={((current.x0 + current.x1) / 2) * width}
                    x2={((current.x0 + current.x1) / 2) * width}
                    y1={0}
                    y2={height}
                    stroke={colour}
                    strokeOpacity={0.35}
                    strokeWidth={Math.max(1, (current.x1 - current.x0) * width)}
                  />
                )}
                {draw({ width, height, selected: current ? index : null })}
              </Svg>
            )}
          </Pressable>
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
        </View>
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
              disabled={index <= 0}
              onPress={() => select(index - 1)}
              style={({ pressed }) => [
                styles.control,
                { opacity: index <= 0 ? 0.3 : pressed ? 0.5 : 1 },
              ]}
            >
              <View style={{ transform: [{ rotate: '90deg' }] }}>
                <Icon name="chevron" size={16} color="#B0B0B0" />
              </View>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Next"
              disabled={index >= slots.length - 1}
              onPress={() => select(index + 1)}
              style={({ pressed }) => [
                styles.control,
                {
                  opacity: index >= slots.length - 1 ? 0.3 : pressed ? 0.5 : 1,
                },
              ]}
            >
              <View style={{ transform: [{ rotate: '-90deg' }] }}>
                <Icon name="chevron" size={16} color="#B0B0B0" />
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
              <Icon name="close" size={16} color="#9A9A9A" />
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  plotRow: { flexDirection: 'row', gap: 8 },
  axis: { width: 30 },
  axisLabel: {
    position: 'absolute',
    right: 0,
    color: '#7E7E7E',
    fontSize: 11,
    fontVariant: ['tabular-nums'],
  },
  ticks: { height: 18, marginTop: 4 },
  tick: {
    position: 'absolute',
    color: '#7E7E7E',
    fontSize: 11,
    width: 44,
  },
  caption: { color: '#A0A0A0', fontSize: 13, lineHeight: 19 },
  small: { color: '#858585', fontSize: 12, lineHeight: 18 },
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
});
