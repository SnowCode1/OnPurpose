import { useState } from 'react';
import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Svg, { Line, Rect } from 'react-native-svg';
import { Text } from './Typography';
import type { TimeOfDayStatistics } from './timeOfDay';

const HEIGHT = 110;
const hourLabel = (hour: number) =>
  new Date(2000, 0, 1, hour).toLocaleTimeString(undefined, { hour: 'numeric' });
const hourRange = (hour: number) =>
  `${hourLabel(hour)}–${hourLabel((hour + 1) % 24)}`;
const days = (count: number) => `${count} ${count === 1 ? 'day' : 'days'}`;

// Shared by both statistics screens; each owns its section/heading styles.
export function TimeOfDayChart({
  stats,
  colour,
  sectionStyle,
  headingStyle,
}: {
  stats: TimeOfDayStatistics;
  colour: string;
  sectionStyle: StyleProp<ViewStyle>;
  headingStyle: StyleProp<TextStyle>;
}) {
  const [width, setWidth] = useState(300);
  const [selected, setSelected] = useState<number | null>(null);
  const step = width / 24;
  const max = Math.max(1, ...stats.hours);
  const detail =
    selected === null
      ? { period: 'Tap a bar to inspect', value: 'Tap it again to clear' }
      : { period: hourRange(selected), value: days(stats.hours[selected]) };
  return (
    <View style={sectionStyle}>
      <Text accessibilityRole="header" style={headingStyle}>
        Time of day
      </Text>
      {stats.peak !== null && (
        <Text style={styles.caption}>
          Most often {hourRange(stats.peak)} · selected period
        </Text>
      )}
      {stats.counted > 0 && (
        <View style={{ gap: 8 }}>
          <Pressable
            accessibilityRole="adjustable"
            accessibilityLabel="Time of day chart"
            accessibilityValue={{
              text:
                selected === null
                  ? 'No hour selected'
                  : `${detail.period}: ${detail.value}`,
            }}
            accessibilityHint="Adjust to inspect hours. Use Clear selection to show all bars."
            accessibilityActions={[
              { name: 'increment', label: 'Next hour' },
              { name: 'decrement', label: 'Previous hour' },
              { name: 'clearSelection', label: 'Clear selection' },
            ]}
            onAccessibilityAction={(event) => {
              const action = event.nativeEvent.actionName;
              if (action === 'clearSelection') setSelected(null);
              else if (action === 'increment' || action === 'decrement')
                setSelected((previous) =>
                  previous === null
                    ? action === 'increment'
                      ? 0
                      : 23
                    : Math.max(
                        0,
                        Math.min(
                          23,
                          previous + (action === 'increment' ? 1 : -1),
                        ),
                      ),
                );
            }}
            onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
            onPress={(event) => {
              if (width <= 0) return;
              const hour = Math.max(
                0,
                Math.min(23, Math.floor(event.nativeEvent.locationX / step)),
              );
              setSelected((previous) => (previous === hour ? null : hour));
            }}
            style={{ height: HEIGHT }}
          >
            <Svg
              width={width}
              height={HEIGHT}
              pointerEvents="none"
              accessible={false}
            >
              {[2, HEIGHT - 4].map((y) => (
                <Line
                  key={y}
                  x1={0}
                  x2={width}
                  y1={y}
                  y2={y}
                  stroke="#242424"
                  strokeWidth={1}
                />
              ))}
              {selected !== null && (
                <Rect
                  x={selected * step}
                  y={0}
                  width={step}
                  height={HEIGHT - 2}
                  rx={3}
                  fill={colour}
                  opacity={0.08}
                />
              )}
              {stats.hours.map(
                (count, hour) =>
                  count > 0 && (
                    <Rect
                      key={hour}
                      x={hour * step + step * 0.16}
                      y={HEIGHT - 4 - Math.max(2, (count / max) * (HEIGHT - 6))}
                      width={Math.max(1, step * 0.68)}
                      height={Math.max(2, (count / max) * (HEIGHT - 6))}
                      rx={Math.min(3, step * 0.2)}
                      fill={colour}
                      opacity={
                        selected === null || selected === hour ? 0.9 : 0.35
                      }
                    />
                  ),
              )}
            </Svg>
          </Pressable>
          <View style={styles.axis} accessible={false}>
            {[0, 6, 12, 18].map((hour) => (
              <Text key={hour} style={[styles.small, { flex: 1 }]}>
                {hourLabel(hour)}
              </Text>
            ))}
          </View>
          <View style={styles.detail}>
            <View style={{ flex: 1, gap: 2 }} accessibilityLiveRegion="polite">
              <Text style={styles.caption}>{detail.period}</Text>
              <Text
                style={[styles.small, selected !== null && { color: colour }]}
              >
                {detail.value}
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear time of day selection"
              accessibilityElementsHidden={selected === null}
              importantForAccessibility={
                selected === null ? 'no-hide-descendants' : 'auto'
              }
              disabled={selected === null}
              onPress={() => setSelected(null)}
              style={({ pressed }) => [
                styles.clear,
                { opacity: selected === null ? 0 : pressed ? 0.5 : 1 },
              ]}
            >
              <Text style={styles.caption}>Clear</Text>
            </Pressable>
          </View>
        </View>
      )}
      <Text style={styles.caption}>
        {stats.counted === 0
          ? stats.recorded
            ? 'No entries in this period were recorded on the day they belong to.'
            : 'Nothing recorded in this period.'
          : `Based on ${stats.counted} of ${days(stats.recorded)} recorded.${stats.counted < stats.recorded ? ' Entries added on a later day are left out.' : ''}`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: { color: '#989898', fontSize: 13, lineHeight: 19 },
  small: {
    color: '#858585',
    fontSize: 12,
    lineHeight: 18,
    fontVariant: ['tabular-nums'],
  },
  axis: { flexDirection: 'row' },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    minHeight: 48,
  },
  clear: {
    minHeight: 44,
    minWidth: 52,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
